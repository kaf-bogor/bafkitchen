'use client'

import React from 'react'

import {
  Box,
  Button,
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
  useToast
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useParams } from 'next/navigation'

import { useGetInvoice } from '@/app/admin/(panel)/invoices/actions'
import { Layout } from '@/components'
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Price,
  StatCard,
  StatusBadge
} from '@/components/ui'
import {
  invoiceStatusColors,
  invoiceStatusMessages,
  EInvoiceStatus
} from '@/interfaces/invoice'
import { currency } from '@/utils'
import { exportInvoiceToPDF } from '@/utils/exportPDF'

export default function VendorInvoiceDetailPage() {
  const { invoiceId } = useParams()
  const toast = useToast()

  const { data: invoice, loading: isFetching, error } = useGetInvoice(
    invoiceId as string
  )

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
            breadcrumbs={[
              { label: 'Dashboard vendor', path: '/dashboard' },
              { label: invoice.invoiceNumber }
            ]}
            actions={
              <HStack spacing={3}>
                <StatusBadge color={invoiceStatusColors[invoice.status]}>
                  {invoiceStatusMessages[invoice.status]}
                </StatusBadge>
                <Button
                  size="sm"
                  colorScheme="brand"
                  variant="outline"
                  onClick={handleExportPDF}
                >
                  Export PDF
                </Button>
              </HStack>
            }
          />

          <Flex direction={{ base: 'column', lg: 'row' }} align="start" gap={6}>
            <VStack flex="2" spacing={6} align="stretch" w="full" minW={0}>
              <Card>
                <CardHeader title="Informasi pelanggan" />
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="text-muted">
                        Nama
                      </Text>
                      <Text fontSize="sm" fontWeight="500" color="text-strong">
                        {invoice.customer?.name || '-'}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="text-muted">
                        No. telepon
                      </Text>
                      <Text fontSize="sm" fontWeight="500" color="text-strong">
                        {invoice.customer?.phoneNumber || '-'}
                      </Text>
                    </HStack>
                    {invoice.customer?.namaSantri && (
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="text-muted">
                          Nama santri
                        </Text>
                        <Text fontSize="sm" fontWeight="500" color="text-strong">
                          {invoice.customer.namaSantri}
                        </Text>
                      </HStack>
                    )}
                    {invoice.customer?.kelas && (
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="text-muted">
                          Kelas
                        </Text>
                        <Text fontSize="sm" fontWeight="500" color="text-strong">
                          {invoice.customer.kelas}
                        </Text>
                      </HStack>
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
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="text-muted">
                            Tanggal lunas
                          </Text>
                          <Text fontSize="sm" fontWeight="500" color="text-strong">
                            {format(
                              new Date(invoice.settledDate),
                              'dd MMM yyyy',
                              { locale: id }
                            )}
                          </Text>
                        </HStack>
                      )}
                  </VStack>
                </CardBody>
              </Card>

              <SimpleGridStats
                total={invoice.totalAmount}
                commission={invoice.commission?.amount || 0}
                net={netAmount}
              />
            </VStack>
          </Flex>
        </>
      ) : (
        !isFetching &&
        !error && (
          <EmptyState
            title="Invoice tidak ditemukan"
            description="Invoice yang Anda cari tidak tersedia."
          />
        )
      )}
    </Layout>
  )
}

function SimpleGridStats({
  total,
  commission,
  net
}: {
  total: number
  commission: number
  net: number
}) {
  return (
    <VStack spacing={4} align="stretch">
      <StatCard
        label="Total invoice"
        value={currency.toIDRFormat(total)}
        tone="blue"
      />
      <StatCard
        label="Komisi Bazaf"
        value={currency.toIDRFormat(commission)}
        tone="gray"
      />
      <StatCard
        label="Net diterima"
        value={currency.toIDRFormat(net)}
        tone="green"
      />
    </VStack>
  )
}
