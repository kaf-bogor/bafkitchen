'use client'
import React from 'react'

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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  useToast
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { Layout } from '@/components'
import { invoiceStatusColors, invoiceStatusMessages, EInvoiceStatus } from '@/interfaces/invoice'
import { toIDRFormat } from '@/utils/currency'
import { exportInvoiceToPDF } from '@/utils/exportPDF'

import { useGetInvoice, useUpdateInvoiceStatus } from '../actions'

export default function InvoiceDetailsPage() {
  const { invoiceId } = useParams()
  const toast = useToast()

  const { data: invoice, loading: isFetching, error } = useGetInvoice(invoiceId as string)
  const { updateInvoiceStatus, loading: isUpdating } = useUpdateInvoiceStatus()

  const breadcrumbs = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Invoices', path: '/admin/invoices' },
    { label: `Invoice ${invoice?.invoiceNumber || invoiceId}`, path: `/admin/invoices/${invoiceId}` }
  ]

  const handleStatusUpdate = async (newStatus: EInvoiceStatus) => {
    if (!invoice) return

    try {
      await updateInvoiceStatus({
        invoiceId: invoice.id,
        status: newStatus,
        settledDate: newStatus === EInvoiceStatus.SETTLED ? new Date().toISOString() : undefined
      })
      
      toast({
        title: 'Invoice status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (error) {
      toast({
        title: 'Failed to update invoice status',
        description: (error as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const handleExportPDF = () => {
    if (!invoice) return

    try {
      exportInvoiceToPDF(invoice)
      toast({
        title: 'PDF exported successfully',
        description: 'Invoice has been downloaded as PDF',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (error) {
      toast({
        title: 'Failed to export PDF',
        description: (error as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  if (isFetching) {
    return (
      <Layout breadcrumbs={breadcrumbs} isFetching={true}>
        <Box>Loading invoice details...</Box>
      </Layout>
    )
  }

  if (error || !invoice) {
    return (
      <Layout breadcrumbs={breadcrumbs} error={error as Error}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>
            {error?.message || 'Invoice not found'}
          </AlertDescription>
        </Alert>
      </Layout>
    )
  }

  const isDueToday = new Date(invoice.dueDate).toDateString() === new Date().toDateString()
  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== EInvoiceStatus.SETTLED

  return (
    <Layout breadcrumbs={breadcrumbs}>
      <VStack spacing={6} align="stretch">
        {/* Invoice Header */}
        <Card>
          <CardHeader>
            <HStack justify="space-between" wrap="wrap">
              <VStack align="start" spacing={2}>
                <Heading size="lg">Invoice {invoice.invoiceNumber}</Heading>
                <Text color="gray.600">
                  Issued on {format(new Date(invoice.issuedDate), 'dd MMMM yyyy, HH:mm', { locale: id })}
                </Text>
                <Link href={`/admin/orders/${invoice.orderId}`}>
                  <Text color="blue.500" fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                    → View Related Order: {invoice.orderId}
                  </Text>
                </Link>
              </VStack>
              <VStack align="end" spacing={3}>
                <HStack spacing={2}>
                  <Button
                    colorScheme="red"
                    size="sm"
                    onClick={handleExportPDF}
                    leftIcon={<Text>📄</Text>}
                  >
                    Export PDF
                  </Button>
                  <Badge
                    colorScheme={invoiceStatusColors[invoice.status]}
                    fontSize="md"
                    px={4}
                    py={2}
                    borderRadius="md"
                  >
                    {invoiceStatusMessages[invoice.status]}
                  </Badge>
                </HStack>
                {invoice.status === EInvoiceStatus.ISSUED && (
                  <Button
                    colorScheme="green"
                    size="sm"
                    onClick={() => handleStatusUpdate(EInvoiceStatus.SETTLED)}
                    isLoading={isUpdating}
                  >
                    Mark as Settled
                  </Button>
                )}
              </VStack>
            </HStack>
          </CardHeader>
        </Card>

        <HStack align="start" spacing={6} wrap="wrap">
          {/* Invoice Details */}
          <VStack flex="2" spacing={6} align="stretch" minW="400px">
            {/* Vendor Information */}
            <Card>
              <CardHeader>
                <Heading size="md">Vendor Information</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={3}>
                  <HStack>
                    <Text fontWeight="bold" minW="120px">Vendor Name:</Text>
                    <Text>{invoice.vendorName}</Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="bold" minW="120px">Vendor ID:</Text>
                    <Text fontFamily="mono" fontSize="sm">{invoice.vendorId}</Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <Heading size="md">Customer Information</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={3}>
                  <HStack>
                    <Text fontWeight="bold" minW="120px">Name:</Text>
                    <Text>{invoice.customer?.name || 'Unknown Customer'}</Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="bold" minW="120px">Phone:</Text>
                    <Text>{invoice.customer?.phoneNumber || 'N/A'}</Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="bold" minW="120px">Nama Santri:</Text>
                    <Text>{invoice.customer?.namaSantri || 'N/A'}</Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="bold" minW="120px">Kelas:</Text>
                    <Text>{invoice.customer?.kelas || 'N/A'}</Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader>
                <Heading size="md">Invoice Items</Heading>
              </CardHeader>
              <CardBody>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Product</Th>
                      <Th isNumeric>Quantity</Th>
                      <Th isNumeric>Unit Price</Th>
                      <Th isNumeric>Total</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {invoice.items.map((item, index) => (
                      <Tr key={index}>
                        <Td>{item.productName}</Td>
                        <Td isNumeric>{item.quantity}</Td>
                        <Td isNumeric>{toIDRFormat(item.unitPrice)}</Td>
                        <Td isNumeric fontWeight="bold">{toIDRFormat(item.totalPrice)}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                
                <Divider my={4} />
                
                <VStack align="end" spacing={2}>
                  <HStack justify="space-between" w="200px">
                    <Text>Subtotal:</Text>
                    <Text fontWeight="bold">{toIDRFormat(invoice.totalAmount)}</Text>
                  </HStack>
                  {invoice.commission && (
                    <HStack justify="space-between" w="200px">
                      <Text fontSize="sm" color="gray.600">
                        BAFkitchen Commission ({invoice.commission.percentage}%):
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {toIDRFormat(invoice.commission.amount)}
                      </Text>
                    </HStack>
                  )}
                  <Divider />
                  <HStack justify="space-between" w="200px">
                    <Text fontSize="lg" fontWeight="bold">Net Amount:</Text>
                    <Text fontSize="lg" fontWeight="bold" color="blue.600">
                      {toIDRFormat(invoice.totalAmount - (invoice.commission?.amount || 0))}
                    </Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </VStack>

          {/* Payment Information */}
          <VStack flex="1" spacing={6} align="stretch" minW="300px">
            <Card>
              <CardHeader>
                <Heading size="md">Payment Information</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={4}>
                  <Box w="full">
                    <Text fontWeight="bold" mb={2}>Due Date</Text>
                    <Text 
                      color={isDueToday ? 'orange.500' : isOverdue ? 'red.500' : 'inherit'}
                      fontWeight={isDueToday || isOverdue ? 'bold' : 'normal'}
                    >
                      {format(new Date(invoice.dueDate), 'dd MMMM yyyy', { locale: id })}
                    </Text>
                    {isDueToday && (
                      <Badge colorScheme="orange" mt={1}>
                        Due Today
                      </Badge>
                    )}
                    {isOverdue && (
                      <Badge colorScheme="red" mt={1}>
                        Overdue
                      </Badge>
                    )}
                  </Box>

                  <Divider />

                  <Box w="full">
                    <Text fontWeight="bold" mb={2}>Total Amount</Text>
                    <Text fontSize="xl" fontWeight="bold" color="blue.600">
                      {toIDRFormat(invoice.totalAmount)}
                    </Text>
                  </Box>

                  {invoice.status === EInvoiceStatus.SETTLED && invoice.settledDate && (
                    <>
                      <Divider />
                      <Box w="full">
                        <Text fontWeight="bold" mb={2}>Settled Date</Text>
                        <Text color="green.600">
                          {format(new Date(invoice.settledDate), 'dd MMMM yyyy, HH:mm', { locale: id })}
                        </Text>
                      </Box>
                    </>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <Heading size="md">Quick Actions</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <Button
                    w="full"
                    colorScheme="red"
                    onClick={handleExportPDF}
                    leftIcon={<Text>📄</Text>}
                  >
                    Export Invoice PDF
                  </Button>
                  <Link href={`/admin/orders/${invoice.orderId}`}>
                    <Button w="full" variant="outline" colorScheme="blue">
                      View Order Details
                    </Button>
                  </Link>
                  <Link href={`/dashboard?vendorId=${invoice.vendorId}`}>
                    <Button w="full" variant="outline" colorScheme="purple">
                      View Vendor Dashboard
                    </Button>
                  </Link>
                  {invoice.status === EInvoiceStatus.ISSUED && (
                    <Button
                      w="full"
                      colorScheme="green"
                      onClick={() => handleStatusUpdate(EInvoiceStatus.SETTLED)}
                      isLoading={isUpdating}
                    >
                      Mark as Settled
                    </Button>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </HStack>
      </VStack>
    </Layout>
  )
}