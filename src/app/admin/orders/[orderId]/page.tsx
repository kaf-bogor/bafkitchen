'use client'

import React, { useState } from 'react'

import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Image,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Circle,
  Button,
  useToast
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useParams } from 'next/navigation'

import { useAuth } from '@/app/UserProvider'
import { Layout } from '@/components'
import { mapOrderStatusToColor, mapOrderStatusToMessage, getNextStatus, getActionDescription } from '@/constants/order'
import { toIDRFormat } from '@/utils/currency'

import { useGetOrder, useGetOrderActivities, useUpdateOrderStatus } from './actions'

export default function OrderDetailsPage() {
  const { orderId } = useParams()
  const { user } = useAuth()
  const toast = useToast()

  const { data: order, loading: isFetching, error, refetch } = useGetOrder(orderId as string, !!user)
  const { data: activities, refetch: refetchActivities } = useGetOrderActivities(orderId as string, !!user)
  const { updateOrderStatus } = useUpdateOrderStatus()

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const handleStatusUpdate = async () => {
    if (!order || !user) return

    const nextStatus = getNextStatus(order.status)
    if (!nextStatus) return

    setIsUpdatingStatus(true)
    try {
      await updateOrderStatus({
        orderId: order.id,
        status: nextStatus,
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || user.email || 'Unknown User'
      })

      toast({
        title: 'Status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      // Refetch data
      await Promise.all([refetch(), refetchActivities()])
    } catch (error) {
      toast({
        title: 'Failed to update status',
        description: (error as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const breadcrumbs = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Orders', path: '/admin/orders' },
    { label: `Order ${order?.orderNumber || orderId}`, path: `/admin/orders/${orderId}` }
  ]


  const getTotalQuantity = (productOrders: any[]) => {
    return productOrders?.reduce((total, item) => total + (item.quantity || 0), 0) || 0
  }

  const getTotalPrice = (productOrders: any[]) => {
    return productOrders?.reduce((total, item) => {
      const price = item.product?.price || 0
      const quantity = item.quantity || 0
      return total + (price * quantity)
    }, 0) || 0
  }

  if (isFetching) {
    return (
      <Layout breadcrumbs={breadcrumbs} isFetching={true}>
        <Box>Loading order details...</Box>
      </Layout>
    )
  }

  if (error || !order) {
    return (
      <Layout breadcrumbs={breadcrumbs} error={error as Error}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>
            {error?.message || 'Order not found'}
          </AlertDescription>
        </Alert>
      </Layout>
    )
  }

  return (
    <Layout breadcrumbs={breadcrumbs}>
      <VStack spacing={6} align="stretch">
        {/* Order Header */}
        <Card>
          <CardHeader>
            <HStack justify="space-between" wrap="wrap">
              <VStack align="start" spacing={2}>
                <Heading size="lg">Order #{order.orderNumber || order.id}</Heading>
                <Text color="gray.600">
                  Created on {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                </Text>
              </VStack>
              <VStack align="end" spacing={3}>
                <Badge
                  colorScheme={mapOrderStatusToColor[order.status]}
                  fontSize="md"
                  px={4}
                  py={2}
                  borderRadius="md"
                >
                  {mapOrderStatusToMessage[order.status] || order.status}
                </Badge>
                {getActionDescription(order.status) && (
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={handleStatusUpdate}
                    isLoading={isUpdatingStatus}
                    loadingText="Updating..."
                  >
                    {getActionDescription(order.status)}
                  </Button>
                )}
              </VStack>
            </HStack>
          </CardHeader>
        </Card>

        <HStack align="start" spacing={6} wrap="wrap">
          {/* Order Details */}
          <VStack flex="2" spacing={6} align="stretch" minW="400px">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <Heading size="md">Customer Information</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={3}>
                  <HStack>
                    <Text fontWeight="bold" minW="100px">Name:</Text>
                    <Text>{order.customer?.name || 'Unknown Customer'}</Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="bold" minW="100px">Phone:</Text>
                    <Text>{order.customer?.phoneNumber || 'N/A'}</Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="bold" minW="100px">Nama Santri:</Text>
                    <Text>{order.customer?.namaSantri || 'N/A'}</Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="bold" minW="100px">Kelas:</Text>
                    <Text>{order.customer?.kelas || 'N/A'}</Text>
                  </HStack>
                  {order.customer?.notes && (
                    <VStack align="start">
                      <Text fontWeight="bold">Catatan:</Text>
                      <Text pl={4}>{order.customer.notes}</Text>
                    </VStack>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Vendor Information */}
            <Card>
              <CardHeader>
                <Heading size="md">Vendor Information</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={3}>
                  {order.productOrders && order.productOrders.length > 0 ? (
                    (() => {
                      // Get unique vendors from product orders
                      const uniqueVendors = new Map()
                      order.productOrders.forEach(po => {
                        if (po.product?.vendor) {
                          uniqueVendors.set(po.product.vendor.id, po.product.vendor.name)
                        }
                      })

                      if (uniqueVendors.size === 0) {
                        return (
                          <Text color="gray.500">No vendor information available</Text>
                        )
                      }

                      return Array.from(uniqueVendors.entries()).map(([vendorId, vendorName]) => (
                        <HStack key={vendorId}>
                          <Badge colorScheme="blue" variant="subtle">
                            {vendorName}
                          </Badge>
                        </HStack>
                      ))
                    })()
                  ) : (
                    <Text color="gray.500">No products found</Text>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <Heading size="md">Order Items</Heading>
              </CardHeader>
              <CardBody>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Product</Th>
                      <Th>Vendor</Th>
                      <Th>Quantity</Th>
                      <Th isNumeric>Unit Price</Th>
                      <Th isNumeric>Total</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {order.productOrders?.map((item, index) => {
                      // Get vendor info for this product
                      const vendorName = item.product?.vendor?.name || 'Unknown Vendor'

                      return (
                        <Tr key={index}>
                          <Td>
                            <HStack>
                              {item.product?.imageUrl && (
                                <Image
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  boxSize="50px"
                                  objectFit="cover"
                                  borderRadius="md"
                                />
                              )}
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="medium">{item.product?.name || 'Unknown Product'}</Text>
                              </VStack>
                            </HStack>
                          </Td>
                          <Td>
                            <Badge 
                              colorScheme={vendorName === 'Unknown Vendor' ? 'gray' : 'blue'} 
                              variant="subtle" 
                              size="sm"
                            >
                              {vendorName}
                            </Badge>
                          </Td>
                          <Td>{item.quantity}</Td>
                          <Td isNumeric>{toIDRFormat(item.product?.price || 0)}</Td>
                          <Td isNumeric>{toIDRFormat((item.product?.price || 0) * item.quantity)}</Td>
                        </Tr>
                      )
                    })}
                  </Tbody>
                </Table>
                
                <Divider my={4} />
                
                <HStack justify="space-between">
                  <Text fontSize="lg" fontWeight="bold">
                    Total ({getTotalQuantity(order.productOrders || [])} items):
                  </Text>
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    {toIDRFormat(getTotalPrice(order.productOrders || []))}
                  </Text>
                </HStack>
              </CardBody>
            </Card>
          </VStack>

          {/* Activity Timeline */}
          <VStack flex="1" spacing={6} align="stretch" minW="350px">
            <Card>
              <CardHeader>
                <Heading size="md">Activity Log</Heading>
              </CardHeader>
              <CardBody>
                {activities && activities.length > 0 ? (
                  <VStack spacing={4} align="stretch">
                    {activities.map((activity, index) => (
                      <HStack key={activity.id} align="start" spacing={4}>
                        <VStack spacing={0}>
                          <Circle
                            size="8px"
                            bg={activity.action.includes('updated') ? 'blue.500' : 'green.500'}
                          />
                          {index < activities.length - 1 && (
                            <Box w="2px" h="40px" bg="gray.200" />
                          )}
                        </VStack>
                        <VStack align="start" spacing={1} flex={1} pb={4}>
                          <Text fontSize="sm" fontWeight="medium">
                            {activity.action}
                          </Text>
                          {activity.fromStatus && activity.toStatus && (
                            <Text fontSize="xs" color="gray.600">
                              From: {mapOrderStatusToMessage[activity.fromStatus] || activity.fromStatus} → 
                              To: {mapOrderStatusToMessage[activity.toStatus] || activity.toStatus}
                            </Text>
                          )}
                          {activity.notes && (
                            <Text fontSize="xs" color="gray.500" fontStyle="italic">
                              &ldquo;{activity.notes}&rdquo;
                            </Text>
                          )}
                          <Text fontSize="xs" color="gray.500">
                            {activity.userName} • {format(new Date(activity.timestamp), 'dd MMM yyyy, HH:mm', { locale: id })}
                          </Text>
                        </VStack>
                      </HStack>
                    ))}
                  </VStack>
                ) : (
                  <Text color="gray.500" textAlign="center" py={4}>
                    No activity recorded yet
                  </Text>
                )}
              </CardBody>
            </Card>
          </VStack>
        </HStack>
      </VStack>
    </Layout>
  )
}