'use client'

import React, { useMemo, useState } from 'react'

import {
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SimpleGrid,
  Text
} from '@chakra-ui/react'
import { endOfDay, format, startOfDay, subDays } from 'date-fns'
import { id } from 'date-fns/locale'
import { useSearchParams } from 'next/navigation'

import { useAuth } from '@/app/UserProvider'
import { Layout } from '@/components'
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  ResponsiveTable,
  StatCard,
  StatusBadge,
  type ResponsiveColumn
} from '@/components/ui'
import { currency } from '@/utils'
import { exportTableToCSV } from '@/utils/exportCSV'
import { exportReportToPDF } from '@/utils/exportPDF'
import { buildReport, type ReportRow } from '@/utils/reports'

import { useVendorOrders } from './actions'

type RangeKey = 'today' | '7d' | '30d' | 'all'

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Hari ini' },
  { key: '7d', label: '7 hari' },
  { key: '30d', label: '30 hari' },
  { key: 'all', label: 'Semua' }
]

export default function VendorReportsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()

  const isAdmin = user?.role === 'admin'
  const vendorId = isAdmin
    ? searchParams.get('vendorId') || ''
    : user?.vendorId || ''

  const { data: orders, loading: isFetching, error } = useVendorOrders(vendorId)

  const [range, setRange] = useState<RangeKey>('30d')

  const rangeStart = useMemo(() => {
    const now = new Date()
    if (range === 'today') return startOfDay(now)
    if (range === '7d') return startOfDay(subDays(now, 7))
    if (range === '30d') return startOfDay(subDays(now, 30))
    return new Date(0)
  }, [range])

  const filteredOrders = useMemo(
    () =>
      (orders || []).filter(
        (order) => new Date(order.createdAt) >= rangeStart
      ),
    [orders, rangeStart]
  )

  const report = useMemo(
    () => buildReport(filteredOrders, { vendorId }),
    [filteredOrders, vendorId]
  )
  const { totals, byProduct } = report

  const period =
    range === 'all'
      ? 'Semua periode'
      : `${format(rangeStart, 'dd MMM yyyy', { locale: id })} - ${format(endOfDay(new Date()), 'dd MMM yyyy', { locale: id })}`

  const handleExportCSV = () => {
    exportTableToCSV(
      ['Produk', 'Qty', 'Omset', 'HPP', 'Laba Kotor'],
      byProduct.map((row) => [
        row.name,
        row.qty,
        currency.toIDRFormat(row.omset),
        currency.toIDRFormat(row.hpp),
        currency.toIDRFormat(row.labaKotor)
      ]),
      `Rekap_Penjualan_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`
    )
  }

  const handleExportPDF = () => {
    exportReportToPDF(
      {
        title: 'Rekap Penjualan',
        subtitle: period,
        summary: [
          { label: 'Omset', value: currency.toIDRFormat(totals.omset) },
          { label: 'Item terjual', value: String(totals.qty) },
          { label: 'Laba kotor', value: currency.toIDRFormat(totals.labaKotor) }
        ],
        columns: ['Produk', 'Qty', 'Omset', 'HPP', 'Laba'],
        rows: byProduct.map((row) => [
          row.name,
          row.qty,
          currency.toIDRFormat(row.omset),
          currency.toIDRFormat(row.hpp),
          currency.toIDRFormat(row.labaKotor)
        ])
      },
      `Rekap_Penjualan_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`
    )
  }

  const productColumns: ResponsiveColumn<ReportRow>[] = [
    {
      key: 'name',
      header: 'Produk',
      render: (row) => <Text fontWeight="600">{row.name}</Text>
    },
    { key: 'qty', header: 'Qty', isNumeric: true, render: (row) => row.qty },
    {
      key: 'omset',
      header: 'Omset',
      isNumeric: true,
      render: (row) => currency.toIDRFormat(row.omset)
    },
    {
      key: 'hpp',
      header: 'HPP',
      isNumeric: true,
      render: (row) => currency.toIDRFormat(row.hpp)
    },
    {
      key: 'laba',
      header: 'Laba kotor',
      isNumeric: true,
      render: (row) => (
        <Text fontWeight="600" color="brand.700">
          {currency.toIDRFormat(row.labaKotor)}
        </Text>
      )
    }
  ]

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      <PageHeader
        title="Rekap penjualan"
        subtitle={period}
        breadcrumbs={[
          { label: 'Dashboard vendor', path: '/dashboard' },
          { label: 'Rekap' }
        ]}
        actions={
          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              variant="outline"
              colorScheme="brand"
              isDisabled={!byProduct.length}
            >
              Export
            </MenuButton>
            <MenuList>
              <MenuItem onClick={handleExportCSV}>Export CSV</MenuItem>
              <MenuItem onClick={handleExportPDF}>Export PDF</MenuItem>
            </MenuList>
          </Menu>
        }
      />

      {!vendorId ? (
        <EmptyState
          title={isAdmin ? 'Pilih vendor' : 'Akun belum tertaut ke vendor'}
          description={
            isAdmin
              ? 'Buka rekap lewat tombol Impersonate di menu Pengguna.'
              : 'Hubungi admin untuk menautkan akun Anda dengan vendor.'
          }
        />
      ) : (
        <>
          <Flex gap={2} mb={5} flexWrap="wrap" align="center">
            {RANGE_OPTIONS.map((option) => (
              <Button
                key={option.key}
                size="sm"
                variant={range === option.key ? 'solid' : 'outline'}
                colorScheme={range === option.key ? 'brand' : 'gray'}
                onClick={() => setRange(option.key)}
              >
                {option.label}
              </Button>
            ))}
            <StatusBadge color="gray">{totals.orderCount} order</StatusBadge>
          </Flex>

          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={5} mb={6}>
            <StatCard
              label="Omset"
              value={currency.toIDRFormat(totals.omset)}
              sublabel="Total penjualan"
              tone="brand"
            />
            <StatCard
              label="Item terjual"
              value={totals.qty}
              sublabel={`${byProduct.length} produk`}
              tone="blue"
            />
            <StatCard
              label="Laba kotor"
              value={currency.toIDRFormat(totals.labaKotor)}
              sublabel="Omset − HPP"
              tone="green"
            />
          </SimpleGrid>

          <Card>
            <CardHeader
              title="Rekap per produk"
              description={`${byProduct.length} produk`}
            />
            <CardBody p={0}>
              <ResponsiveTable
                columns={productColumns}
                rows={byProduct}
                getRowKey={(row) => row.key}
                mobileTitleKey="name"
                emptyState={
                  <Text color="text-muted" textAlign="center" py={8}>
                    Belum ada penjualan pada periode ini.
                  </Text>
                }
              />
            </CardBody>
          </Card>
        </>
      )}
    </Layout>
  )
}
