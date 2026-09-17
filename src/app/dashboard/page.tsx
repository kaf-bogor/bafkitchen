'use client'

import React, { useMemo, useState } from 'react'

import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  HStack,
  Select,
  SimpleGrid,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { useAuth } from '@/app/UserProvider'
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

import { useGetInvoicesByVendor } from '../admin/(panel)/invoices/actions'
import { useGetVendor } from '../admin/(panel)/vendors/actions'

export default function VendorDashboard() {
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const isAdmin = user?.role === 'admin'

  // Admins may open any vendor (impersonate); everyone else is locked to their own vendor.
  const selectedVendorId = isAdmin
    ? searchParams.get('vendorId') || ''
    : user?.vendorId || ''

  const [statusFilter, setStatusFilter] = useState('')

  const { data: vendor } = useGetVendor(selectedVendorId)

  const {
    data: vendorInvoices,
    loading: isFetching,
    error
  } = useGetInvoicesByVendor(selectedVendorId)

  const vendorName = vendor?.name || user?.vendorName || ''

  const filteredInvoices = useMemo(() => {
    if (!vendorInvoices?.length) return []
    if (!statusFilter) return vendorInvoices
    return vendorInvoices.filter((invoice) => invoice.status === statusFilter)
  }, [vendorInvoices, statusFilter])

  const stats = useMemo(() => {
    if (!vendorInvoices?.length) {
      return {
        totalInvoices: 0,
        totalAmount: 0,
        pendingAmount: 0,
        settledAmount: 0,
        overdueCount: 0
      }
    }

    const now = new Date()
    let totalAmount = 0
    let pendingAmount = 0
    let settledAmount = 0
    let overdueCount = 0

    vendorInvoices.forEach((invoice) => {
      totalAmount += invoice.totalAmount

      if (invoice.status === EInvoiceStatus.SETTLED) {
        settledAmount += invoice.totalAmount
      } else {
        pendingAmount += invoice.totalAmount

        if (new Date(invoice.dueDate) < now) {
          overdueCount++
        }
      }
    })

    return {
      totalInvoices: vendorInvoices.length,
      totalAmount,
      pendingAmount,
      settledAmount,
      overdueCount
    }
  }, [vendorInvoices])

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      <PageHeader
        title={vendorName || 'Dashboard vendor'}
        subtitle={
          isAdmin && selectedVendorId
            ? 'Melihat sebagai vendor (impersonate)'
            : 'Ringkasan invoice vendor'
        }
        breadcrumbs={[{ label: 'Dashboard vendor' }]}
      />

      {selectedVendorId ? (
        <>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={5} mb={6}>
            <StatCard
              label="Total invoice"
              value={stats.totalInvoices}
              sublabel="Semua waktu"
              tone="brand"
            />
            <StatCard
              label="Total nilai"
              value={currency.toIDRFormat(stats.totalAmount)}
              sublabel="Semua invoice"
              tone="blue"
            />
            <StatCard
              label="Menunggu pembayaran"
              value={currency.toIDRFormat(stats.pendingAmount)}
              sublabel="Belum dibayar"
              tone="orange"
            />
            <StatCard
              label="Lunas"
              value={currency.toIDRFormat(stats.settledAmount)}
              sublabel="Sudah dibayar"
              tone="green"
            />
          </SimpleGrid>

          {stats.overdueCount > 0 && (
            <Alert status="warning" borderRadius="lg" mb={6}>
              <AlertIcon />
              <AlertDescription>
                {stats.overdueCount} invoice melewati jatuh tempo.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader
              title="Invoice"
              description={`${filteredInvoices.length} invoice`}
              actions={
                <Select
                  size="sm"
                  maxW="200px"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Semua status</option>
                  {Object.values(EInvoiceStatus).map((status) => (
                    <option key={status} value={status}>
                      {invoiceStatusMessages[status]}
                    </option>
                  ))}
                </Select>
              }
            />
            <CardBody p={0}>
              {filteredInvoices.length === 0 ? (
                <EmptyState
                  title="Belum ada invoice"
                  description="Invoice akan muncul di sini setelah pesanan diproses."
                />
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>No. invoice</Th>
                        <Th>Tanggal</Th>
                        <Th>Order</Th>
                        <Th>Jumlah</Th>
                        <Th>Jatuh tempo</Th>
                        <Th>Status</Th>
                        <Th>Aksi</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredInvoices.map((invoice) => {
                        const isDueToday =
                          new Date(invoice.dueDate).toDateString() ===
                          new Date().toDateString()
                        const isOverdue =
                          new Date(invoice.dueDate) < new Date() &&
                          invoice.status !== EInvoiceStatus.SETTLED

                        return (
                          <Tr key={invoice.id} _hover={{ bg: 'gray.50' }}>
                            <Td>
                              <Text fontWeight="600">
                                {invoice.invoiceNumber}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {format(new Date(invoice.issuedDate), 'dd MMM yyyy', {
                                  locale: id
                                })}
                              </Text>
                            </Td>
                            <Td>
                              <Link href={`/admin/orders/${invoice.orderId}`}>
                                {invoice.orderId.substring(0, 8)}...
                              </Link>
                            </Td>
                            <Td>
                              <Price value={invoice.totalAmount} size="sm" />
                            </Td>
                            <Td>
                              <HStack spacing={2} flexWrap="wrap">
                                <Text
                                  fontSize="sm"
                                  color={
                                    isDueToday
                                      ? 'orange.500'
                                      : isOverdue
                                        ? 'red.500'
                                        : 'text-body'
                                  }
                                  fontWeight={
                                    isDueToday || isOverdue ? '600' : 'normal'
                                  }
                                >
                                  {format(
                                    new Date(invoice.dueDate),
                                    'dd MMM yyyy',
                                    { locale: id }
                                  )}
                                </Text>
                                {isOverdue && (
                                  <StatusBadge
                                    color="red"
                                    px={2}
                                    py={0.5}
                                    fontSize="2xs"
                                  >
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
                            </Td>
                            <Td>
                              <StatusBadge color={invoiceStatusColors[invoice.status]}>
                                {invoiceStatusMessages[invoice.status]}
                              </StatusBadge>
                            </Td>
                            <Td>
                              <Link href={`/dashboard/invoices/${invoice.id}`}>
                                <Button size="xs" colorScheme="brand" variant="outline">
                                  Lihat detail
                                </Button>
                              </Link>
                            </Td>
                          </Tr>
                        )
                      })}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </CardBody>
          </Card>
        </>
      ) : (
        <EmptyState
          title={
            isAdmin ? 'Pilih vendor untuk dilihat' : 'Akun belum tertaut ke vendor'
          }
          description={
            isAdmin
              ? 'Gunakan tombol Impersonate di menu Pengguna untuk membuka dashboard vendor.'
              : 'Hubungi admin untuk menautkan akun Anda dengan vendor.'
          }
          action={
            isAdmin ? (
              <Link href="/admin/users">
                <Button colorScheme="brand" size="sm" mt={2}>
                  Buka menu Pengguna
                </Button>
              </Link>
            ) : undefined
          }
        />
      )}
    </Layout>
  )
}
