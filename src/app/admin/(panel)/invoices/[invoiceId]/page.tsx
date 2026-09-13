'use client'
import React, { useRef } from 'react'

import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
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
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { Layout } from '@/components'
import {
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  Price,
  StatusBadge
} from '@/components/ui'
import {
  invoiceStatusColors,
  invoiceStatusMessages,
  EInvoiceStatus
} from '@/interfaces/invoice'
import { exportInvoiceToPDF } from '@/utils/exportPDF'

import { useGetInvoice, useUpdateInvoiceStatus } from '../actions'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <HStack justify="space-between" align="start">
      <Text fontSize="sm" color="text-muted">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="500" color="text-strong" textAlign="right">
        {value}
      </Text>
    </HStack>
  )
}

export default function InvoiceDetailsPage() {
  const { invoiceId } = useParams()
  const toast = useToast()

  const { data: invoice, loading: isFetching, error, refetch } = useGetInvoice(invoiceId as string)
  const { updateInvoiceStatus, loading: isUpdating } = useUpdateInvoiceStatus()

  const settleDialog = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const handleStatusUpdate = async (newStatus: EInvoiceStatus) => {
    if (!invoice) return

    try {
      await updateInvoiceStatus({
        invoiceId: invoice.id,
        status: newStatus,
        settledDate:
          newStatus === EInvoiceStatus.SETTLED
            ? new Date().toISOString()
            : undefined
      })

      toast({
        title: 'Status invoice diperbarui',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      await refetch()
    } catch (err) {
      toast({
        title: 'Gagal memperbarui status invoice',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const confirmSettle = async () => {
    await handleStatusUpdate(EInvoiceStatus.SETTLED)
    settleDialog.onClose()
  }

  const handleExportPDF = () => {
    if (!invoice) return

    try {
      exportInvoiceToPDF(invoice)
      toast({
        title: 'PDF berhasil diunduh',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (err) {
      toast({
        title: 'Gagal mengunduh PDF',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const breadcrumbs = [
    { label: 'Dasbor', path: '/admin' },
    { label: 'Invoice', path: '/admin/invoices' },
    { label: invoice?.invoiceNumber || (invoiceId as string) }
  ]

  const isDueToday =
    invoice &&
    new Date(invoice.dueDate).toDateString() === new Date().toDateString()
  const isOverdue =
    invoice &&
    new Date(invoice.dueDate) < new Date() &&
    invoice.status !== EInvoiceStatus.SETTLED

  const netAmount = invoice
    ? invoice.totalAmount - (invoice.commission?.amount || 0)
    : 0

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      {invoice ? (
        <>
          <PageHeader
            title={`Invoice ${invoice.invoiceNumber}`}
            subtitle={`Diterbitkan ${format(
              new Date(invoice.issuedDate),
              'dd MMMM yyyy',
              { locale: id }
            )}`}
            breadcrumbs={breadcrumbs}
            actions={
              <HStack spacing={3}>
                <StatusBadge color={invoiceStatusColors[invoice.status]}>
                  {invoiceStatusMessages[invoice.status]}
                </StatusBadge>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="brand"
                  onClick={handleExportPDF}
                >
                  Export PDF
                </Button>
                {invoice.status === EInvoiceStatus.ISSUED && (
                  <Button
                    size="sm"
                    colorScheme="brand"
                    onClick={settleDialog.onOpen}
                  >
                    Tandai lunas
                  </Button>
                )}
              </HStack>
            }
          />

          <Flex direction={{ base: 'column', lg: 'row' }} align="start" gap={6}>
            <VStack flex="2" spacing={6} align="stretch" w="full" minW={0}>
              <Card>
                <CardHeader title="Vendor" />
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <InfoRow label="Nama vendor" value={invoice.vendorName || '-'} />
                    <InfoRow
                      label="ID vendor"
                      value={
                        <Text as="span" fontFamily="mono" fontSize="xs">
                          {invoice.vendorId}
                        </Text>
                      }
                    />
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Informasi pelanggan" />
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <InfoRow
                      label="Nama"
                      value={invoice.customer?.name || '-'}
                    />
                    <InfoRow
                      label="No. telepon"
                      value={invoice.customer?.phoneNumber || '-'}
                    />
                    {invoice.customer?.namaSantri && (
                      <InfoRow
                        label="Nama santri"
                        value={invoice.customer.namaSantri}
                      />
                    )}
                    {invoice.customer?.kelas && (
                      <InfoRow label="Kelas" value={invoice.customer.kelas} />
                    )}
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Rincian item" />
                <CardBody p={0}>
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Produk</Th>
                          <Th isNumeric>Jumlah</Th>
                          <Th isNumeric>Harga satuan</Th>
                          <Th isNumeric>Total</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {invoice.items.map((item, index) => (
                          <Tr key={index}>
                            <Td>{item.productName}</Td>
                            <Td isNumeric>{item.quantity}</Td>
                            <Td isNumeric>
                              <Price value={item.unitPrice} size="sm" />
                            </Td>
                            <Td isNumeric>
                              <Price value={item.totalPrice} size="sm" />
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </CardBody>
              </Card>
            </VStack>

            <VStack flex="1" spacing={6} align="stretch" w="full" minW={0}>
              <Card>
                <CardHeader title="Ringkasan" />
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <Flex justify="space-between" align="baseline">
                      <Text fontSize="sm" color="text-muted">
                        Total invoice
                      </Text>
                      <Price value={invoice.totalAmount} size="md" />
                    </Flex>
                    <Flex justify="space-between" align="baseline">
                      <Text fontSize="sm" color="text-muted">
                        Komisi Bazaf
                        {invoice.commission
                          ? ` (${invoice.commission.percentage}%)`
                          : ''}
                      </Text>
                      <Text fontSize="sm" color="text-body">
                        -
                        <Price
                          value={invoice.commission?.amount || 0}
                          size="sm"
                        />
                      </Text>
                    </Flex>
                    <Divider />
                    <Flex justify="space-between" align="baseline">
                      <Text fontSize="sm" fontWeight="600" color="text-strong">
                        Net diterima
                      </Text>
                      <Price value={netAmount} size="lg" />
                    </Flex>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Pembayaran" />
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="text-muted">
                        Jatuh tempo
                      </Text>
                      <HStack spacing={2}>
                        <Text
                          fontSize="sm"
                          fontWeight="500"
                          color={
                            isDueToday
                              ? 'orange.500'
                              : isOverdue
                                ? 'red.500'
                                : 'text-strong'
                          }
                        >
                          {format(new Date(invoice.dueDate), 'dd MMM yyyy', {
                            locale: id
                          })}
                        </Text>
                        {isOverdue && (
                          <StatusBadge color="red" px={2} py={0.5} fontSize="2xs">
                            Terlambat
                          </StatusBadge>
                        )}
                        {isDueToday && (
                          <StatusBadge
                            color="orange"
                            px={2}
                            py={0.5}
                            fontSize="2xs"
                          >
                            Hari ini
                          </StatusBadge>
                        )}
                      </HStack>
                    </HStack>

                    {invoice.status === EInvoiceStatus.SETTLED &&
                      invoice.settledDate && (
                        <InfoRow
                          label="Tanggal lunas"
                          value={format(
                            new Date(invoice.settledDate),
                            'dd MMM yyyy',
                            { locale: id }
                          )}
                        />
                      )}
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Aksi" />
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Link href={`/admin/orders/${invoice.orderId}`}>
                      <Button w="full" variant="outline" colorScheme="brand">
                        Lihat order
                      </Button>
                    </Link>
                    <Link href={`/dashboard?vendorId=${invoice.vendorId}`}>
                      <Button w="full" variant="outline" colorScheme="brand">
                        Lihat dashboard vendor
                      </Button>
                    </Link>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </Flex>
        </>
      ) : (
        !isFetching &&
        !error && (
          <Alert status="warning" borderRadius="lg">
            <AlertIcon />
            <AlertTitle>Invoice tidak ditemukan</AlertTitle>
            <AlertDescription>
              Invoice dengan ID tersebut tidak tersedia.
            </AlertDescription>
          </Alert>
        )
      )}

      <AlertDialog
        isOpen={settleDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={settleDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="600">
              Tandai lunas
            </AlertDialogHeader>
            <AlertDialogBody color="text-body">
              Apakah Anda yakin invoice{' '}
              <strong>{invoice?.invoiceNumber}</strong> sudah dibayar lunas? Status
              akan diubah menjadi <strong>Lunas</strong>.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={settleDialog.onClose}
                isDisabled={isUpdating}
              >
                Batal
              </Button>
              <Button
                colorScheme="brand"
                onClick={confirmSettle}
                ml={3}
                isLoading={isUpdating}
                loadingText="Memperbarui..."
              >
                Ya, tandai lunas
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  )
}
