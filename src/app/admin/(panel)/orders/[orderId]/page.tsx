'use client'

import React, { useState } from 'react'

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Circle,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useParams } from 'next/navigation'

import { useAuth } from '@/app/UserProvider'
import { Layout } from '@/components'
import ProductImage from '@/components/ProductImage'
import { Card, CardBody, CardHeader, PageHeader, Price, StatusBadge } from '@/components/ui'
import { mapOrderStatusToColor, mapOrderStatusToMessage, getNextStatus, getActionDescription } from '@/constants/order'
import { uploadMedia } from '@/utils/auth'

import { useGetOrder, useGetOrderActivities, useUpdateOrderStatus, useUpdatePaymentProof } from './actions'
import StatusUpdateConfirmDialog from '../components/StatusUpdateConfirmDialog'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Flex gap={3} align="start">
      <Text fontSize="sm" color="text-muted" minW="110px" flexShrink={0}>
        {label}
      </Text>
      <Text fontSize="sm" color="text-body" fontWeight="500">
        {value}
      </Text>
    </Flex>
  )
}

export default function OrderDetailsPage() {
  const { orderId } = useParams()
  const { user } = useAuth()
  const toast = useToast()

  const { data: order, loading: isFetching, error, refetch } = useGetOrder(orderId as string, !!user)
  const { data: activities, refetch: refetchActivities } = useGetOrderActivities(orderId as string, !!user)
  const { updateOrderStatus } = useUpdateOrderStatus()
  const { updatePaymentProof, loading: isUpdatingProof } = useUpdatePaymentProof()

  const confirmDialog = useDisclosure()
  const proofDialog = useDisclosure()

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null)
  const [editProofFile, setEditProofFile] = useState<File | null>(null)

  const nextStatus = order ? getNextStatus(order.status) : null
  const showProofUpload = order?.status === 'Payment Pending'

  const handleProofChange = (file: File | null) => {
    setProofFile(file)
    setProofPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  const closeConfirmDialog = () => {
    confirmDialog.onClose()
    setProofFile(null)
    setProofPreviewUrl(null)
  }

  const handleConfirmStatus = async () => {
    if (!order || !nextStatus) return

    setIsUpdatingStatus(true)
    try {
      let proofUrl: string | undefined
      let proofKey: string | undefined
      if (proofFile) {
        const upload = await uploadMedia(proofFile)
        proofUrl = upload.downloadURL
        proofKey = upload.fullPath
      }

      await updateOrderStatus({
        orderId: order.id,
        status: nextStatus,
        proofUrl,
        proofKey
      })

      toast({
        title: 'Status berhasil diperbarui',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      closeConfirmDialog()
      await Promise.all([refetch(), refetchActivities()])
    } catch (err) {
      toast({
        title: 'Gagal memperbarui status',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleEditProof = async () => {
    if (!order || !editProofFile) return
    try {
      const upload = await uploadMedia(editProofFile)
      await updatePaymentProof({
        orderId: order.id,
        proofUrl: upload.downloadURL,
        proofKey: upload.fullPath
      })
      toast({
        title: 'Bukti pembayaran diperbarui',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      proofDialog.onClose()
      setEditProofFile(null)
      await Promise.all([refetch(), refetchActivities()])
    } catch (err) {
      toast({
        title: 'Gagal memperbarui bukti pembayaran',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const breadcrumbs = [
    { label: 'Dasbor', path: '/admin' },
    { label: 'Order', path: '/admin/orders' },
    { label: `Order ${order?.orderNumber || orderId}` }
  ]

  const getTotalQuantity = (productOrders: any[]) =>
    productOrders?.reduce((total, item) => total + (item.quantity || 0), 0) || 0

  const getTotalPrice = (productOrders: any[]) =>
    productOrders?.reduce((total, item) => {
      const price = item.product?.price || 0
      const quantity = item.quantity || 0
      return total + price * quantity
    }, 0) || 0

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      {order && (
        <>
          <PageHeader
            title={`Order ${order.orderNumber || order.id}`}
            subtitle={`Dibuat ${format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })}`}
            breadcrumbs={breadcrumbs}
            actions={
              <HStack spacing={3}>
                <StatusBadge color={mapOrderStatusToColor[order.status]}>
                  {mapOrderStatusToMessage[order.status] || order.status}
                </StatusBadge>
                {getActionDescription(order.status) && (
                  <Button
                    colorScheme="brand"
                    size="sm"
                    onClick={confirmDialog.onOpen}
                  >
                    {getActionDescription(order.status)}
                  </Button>
                )}
              </HStack>
            }
          />

          <Flex direction={{ base: 'column', lg: 'row' }} align="start" gap={6}>
            {/* Order Details */}
            <VStack flex="2" spacing={6} align="stretch" w="full" minW={0}>
              <Card>
                <CardHeader title="Informasi pelanggan" />
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <InfoRow label="Nama" value={order.customer?.name || 'Tidak diketahui'} />
                    <InfoRow label="No. telepon" value={order.customer?.phoneNumber || '-'} />
                    {order.customer?.notes && (
                      <InfoRow label="Catatan" value={order.customer.notes} />
                    )}
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title="Bukti pembayaran"
                  actions={
                    <Button
                      size="xs"
                      variant="outline"
                      colorScheme="brand"
                      onClick={proofDialog.onOpen}
                    >
                      {order.paymentProofUrl ? 'Ubah' : 'Unggah'}
                    </Button>
                  }
                />
                <CardBody>
                  {order.paymentProofUrl ? (
                    <Box
                      as="a"
                      href={order.paymentProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      display="block"
                    >
                      <ProductImage
                        src={order.paymentProofUrl}
                        alt="Bukti pembayaran"
                        maxH="320px"
                        w="full"
                        objectFit="contain"
                        borderRadius="lg"
                      />
                    </Box>
                  ) : (
                    <Text fontSize="sm" color="text-muted">
                      Belum ada bukti pembayaran.
                    </Text>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Vendor" />
                <CardBody>
                  <HStack flexWrap="wrap" gap={2}>
                    {order.productOrders && order.productOrders.length > 0 ? (
                      (() => {
                        const uniqueVendors = new Map<string, string>()
                        order.productOrders.forEach((po) => {
                          if (po.product?.vendor) {
                            uniqueVendors.set(po.product.vendor.id, po.product.vendor.name)
                          }
                        })

                        if (uniqueVendors.size === 0) {
                          return <Text color="text-muted" fontSize="sm">Tidak ada informasi vendor</Text>
                        }

                        return Array.from(uniqueVendors.entries()).map(
                          ([vendorId, vendorName]) => (
                            <StatusBadge key={vendorId} color="blue">
                              {vendorName}
                            </StatusBadge>
                          )
                        )
                      })()
                    ) : (
                      <Text color="text-muted" fontSize="sm">Tidak ada produk</Text>
                    )}
                  </HStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Item pesanan" />
                <CardBody p={0}>
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Produk</Th>
                          <Th>Vendor</Th>
                          <Th>Jumlah</Th>
                          <Th isNumeric>Harga satuan</Th>
                          <Th isNumeric>Total</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {order.productOrders?.map((item, index) => {
                          const vendorName = item.product?.vendor?.name || 'Tanpa vendor'
                          return (
                            <Tr key={index}>
                              <Td>
                                <HStack align="start">
                                  {item.product && (
                                    <ProductImage
                                      src={item.product.imageUrl}
                                      alt={item.product.name}
                                      boxSize="44px"
                                      objectFit="cover"
                                      borderRadius="md"
                                    />
                                  )}
                                  <VStack align="start" spacing={0.5}>
                                    <Text fontWeight="500">
                                      {item.product?.name || 'Produk tidak diketahui'}
                                    </Text>
                                    {item.notes && (
                                      <Text fontSize="xs" color="text-muted">
                                        Catatan: {item.notes}
                                      </Text>
                                    )}
                                  </VStack>
                                </HStack>
                              </Td>
                              <Td>
                                <StatusBadge
                                  color={vendorName === 'Tanpa vendor' ? 'gray' : 'blue'}
                                >
                                  {vendorName}
                                </StatusBadge>
                              </Td>
                              <Td>{item.quantity}</Td>
                              <Td isNumeric>
                                <Price value={item.product?.price || 0} size="sm" />
                              </Td>
                              <Td isNumeric>
                                <Price
                                  value={(item.product?.price || 0) * item.quantity}
                                  size="sm"
                                />
                              </Td>
                            </Tr>
                          )
                        })}
                      </Tbody>
                    </Table>
                  </Box>

                  <Divider />

                  <Flex justify="space-between" align="center" px={5} py={4}>
                    <Text fontSize="sm" color="text-muted">
                      Total ({getTotalQuantity(order.productOrders || [])} item)
                    </Text>
                    <Price value={getTotalPrice(order.productOrders || [])} size="lg" />
                  </Flex>
                </CardBody>
              </Card>
            </VStack>

            {/* Activity Timeline */}
            <Box flex="1" w="full" minW={0}>
              <Card>
                <CardHeader title="Riwayat aktivitas" />
                <CardBody>
                  {activities && activities.length > 0 ? (
                    <VStack spacing={4} align="stretch">
                      {activities.map((activity, index) => (
                        <HStack key={activity.id} align="start" spacing={4}>
                          <VStack spacing={0}>
                            <Circle
                              size="8px"
                              bg={activity.toStatus ? 'brand.500' : 'gray.400'}
                            />
                            {index < activities.length - 1 && (
                              <Box w="2px" h="40px" bg="border-subtle" />
                            )}
                          </VStack>
                          <VStack align="start" spacing={1.5} flex={1} pb={4}>
                            <Text fontSize="sm" fontWeight="500" color="text-strong">
                              {activity.fromStatus && activity.toStatus
                                ? 'Status pesanan'
                                : activity.action}
                            </Text>
                            {activity.toStatus && (
                              <HStack
                                spacing={1.5}
                                flexWrap="nowrap"
                                overflowX="auto"
                                className="no-scrollbar"
                              >
                                {activity.fromStatus && (
                                  <>
                                    <StatusBadge
                                      color={
                                        mapOrderStatusToColor[
                                          activity.fromStatus
                                        ]
                                      }
                                      px={2}
                                      py={0.5}
                                      fontSize="2xs"
                                    >
                                      {mapOrderStatusToMessage[
                                        activity.fromStatus
                                      ] || activity.fromStatus}
                                    </StatusBadge>
                                    <Text fontSize="2xs" color="text-subtle">
                                      →
                                    </Text>
                                  </>
                                )}
                                <StatusBadge
                                  color={mapOrderStatusToColor[activity.toStatus]}
                                  px={2}
                                  py={0.5}
                                  fontSize="2xs"
                                >
                                  {mapOrderStatusToMessage[activity.toStatus] ||
                                    activity.toStatus}
                                </StatusBadge>
                              </HStack>
                            )}
                            {activity.notes && (
                              <Text fontSize="xs" color="text-muted" fontStyle="italic">
                                &ldquo;{activity.notes}&rdquo;
                              </Text>
                            )}
                            <Text fontSize="xs" color="text-subtle">
                              {activity.userName} •{' '}
                              {format(new Date(activity.timestamp), 'dd MMM yyyy, HH:mm', {
                                locale: id
                              })}
                            </Text>
                          </VStack>
                        </HStack>
                      ))}
                    </VStack>
                  ) : (
                    <Text color="text-muted" fontSize="sm" textAlign="center" py={4}>
                      Belum ada aktivitas
                    </Text>
                  )}
                </CardBody>
              </Card>
            </Box>
          </Flex>
        </>
      )}

      {!isFetching && !order && !error && (
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          <AlertTitle>Order tidak ditemukan</AlertTitle>
          <AlertDescription>Order dengan ID tersebut tidak tersedia.</AlertDescription>
        </Alert>
      )}

      {order && nextStatus && (
        <StatusUpdateConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={closeConfirmDialog}
          onConfirm={handleConfirmStatus}
          currentStatus={order.status}
          nextStatus={nextStatus}
          actionDescription={getActionDescription(order.status) || ''}
          orderNumber={order.orderNumber || order.id}
          isLoading={isUpdatingStatus}
          showProofUpload={showProofUpload}
          proofFile={proofFile}
          proofPreviewUrl={proofPreviewUrl}
          onProofChange={handleProofChange}
        />
      )}

      <Modal isOpen={proofDialog.isOpen} onClose={proofDialog.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Bukti pembayaran</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {order?.paymentProofUrl && (
              <ProductImage
                src={order.paymentProofUrl}
                alt="Bukti pembayaran"
                maxH="240px"
                w="full"
                objectFit="contain"
                borderRadius="lg"
                mb={3}
              />
            )}
            <FormControl>
              <FormLabel>Unggah gambar baru</FormLabel>
              <Input
                type="file"
                accept="image/*"
                p={1}
                onChange={(e) => setEditProofFile(e.target.files?.[0] || null)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={proofDialog.onClose}>
              Batal
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleEditProof}
              isLoading={isUpdatingProof}
              isDisabled={!editProofFile}
            >
              Simpan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  )
}
