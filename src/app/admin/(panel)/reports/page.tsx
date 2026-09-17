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
  Text,
  VStack
} from '@chakra-ui/react'
import { endOfDay, format, startOfDay, subDays } from 'date-fns'
import { id } from 'date-fns/locale'

import { useOrders } from '@/app/admin/actions'
import { useAuth } from '@/app/UserProvider'
import { Layout } from '@/components'
import {
  Card,
  CardBody,
  CardHeader,
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

type RangeKey = 'today' | '7d' | '30d'

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Hari ini' },
  { key: '7d', label: '7 hari' },
  { key: '30d', label: '30 hari' }
]

export default function ReportsPage() {
  const { user } = useAuth()
  const [range, setRange] = useState<RangeKey>('30d')
  const [dateStart, setDateStart] = useState(
    startOfDay(subDays(new Date(), 30)).toISOString()
  )
  const [dateEnd, setDateEnd] = useState(endOfDay(new Date()).toISOString())

  const { data: orders, loading: isFetching, error } = useOrders(
    dateStart,
    dateEnd,
    !!user
  )

  const changeRange = (key: RangeKey) => {
    setRange(key)
    const end = endOfDay(new Date()).toISOString()
    if (key === 'today') setDateStart(startOfDay(new Date()).toISOString())
    else if (key === '7d')
      setDateStart(startOfDay(subDays(new Date(), 7)).toISOString())
    else setDateStart(startOfDay(subDays(new Date(), 30)).toISOString())
    setDateEnd(end)
  }

  const report = useMemo(() => buildReport(orders || []), [orders])
  const { totals, byVendor, byProduct } = report

  const period = `${format(new Date(dateStart), 'dd MMM yyyy', { locale: id })} - ${format(new Date(dateEnd), 'dd MMM yyyy', { locale: id })}`

  const handleExportCSV = () => {
    exportTableToCSV(
      ['Vendor', 'Qty', 'Omset', 'HPP', 'Laba Kotor'],
      byVendor.map((row) => [
        row.name,
        row.qty,
        currency.toIDRFormat(row.omset),
        currency.toIDRFormat(row.hpp),
        currency.toIDRFormat(row.labaKotor)
      ]),
      `Laporan_Penjualan_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`
    )
  }

  const handleExportPDF = () => {
    exportReportToPDF(
      {
        title: 'Laporan Penjualan',
        subtitle: period,
        summary: [
          { label: 'Omset', value: currency.toIDRFormat(totals.omset) },
          { label: 'HPP', value: currency.toIDRFormat(totals.hpp) },
          { label: 'Laba kotor', value: currency.toIDRFormat(totals.labaKotor) }
        ],
        columns: ['Vendor', 'Qty', 'Omset', 'HPP', 'Laba'],
        rows: byVendor.map((row) => [
          row.name,
          row.qty,
          currency.toIDRFormat(row.omset),
          currency.toIDRFormat(row.hpp),
          currency.toIDRFormat(row.labaKotor)
        ])
      },
      `Laporan_Penjualan_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`
    )
  }

  const vendorColumns: ResponsiveColumn<ReportRow>[] = [
    {
      key: 'name',
      header: 'Vendor',
      render: (row) => <Text fontWeight="600">{row.name}</Text>
    },
    {
      key: 'qty',
      header: 'Qty',
      isNumeric: true,
      render: (row) => row.qty
    },
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
        title="Laporan penjualan"
        subtitle={period}
        breadcrumbs={[
          { label: 'Dasbor', path: '/admin' },
          { label: 'Laporan' }
        ]}
        actions={
          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              variant="outline"
              colorScheme="brand"
              isDisabled={!byVendor.length}
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

      <Flex gap={2} mb={5} flexWrap="wrap" align="center">
        {RANGE_OPTIONS.map((option) => (
          <Button
            key={option.key}
            size="sm"
            variant={range === option.key ? 'solid' : 'outline'}
            colorScheme={range === option.key ? 'brand' : 'gray'}
            onClick={() => changeRange(option.key)}
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
          label="HPP"
          value={currency.toIDRFormat(totals.hpp)}
          sublabel="Harga pokok"
          tone="gray"
        />
        <StatCard
          label="Laba kotor"
          value={currency.toIDRFormat(totals.labaKotor)}
          sublabel="Omset − HPP"
          tone="green"
        />
      </SimpleGrid>

      <VStack align="stretch" spacing={6}>
        <Card>
          <CardHeader
            title="Rekap per vendor"
            description={`${byVendor.length} vendor`}
          />
          <CardBody p={0}>
            <ResponsiveTable
              columns={vendorColumns}
              rows={byVendor}
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
      </VStack>
    </Layout>
  )
}
