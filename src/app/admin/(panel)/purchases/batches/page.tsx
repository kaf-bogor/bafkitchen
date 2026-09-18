'use client'

import React, { useState } from 'react'

import {
  HStack,
  Select,
  SimpleGrid,
  Text
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

import { useGetProducts } from '@/app/admin/(panel)/products/actions'
import { useGetStockBatches } from '@/app/admin/(panel)/purchases/actions'
import { Layout } from '@/components'
import {
  EmptyState,
  PageHeader,
  ResponsiveTable,
  StatCard,
  StatusBadge,
  type ResponsiveColumn
} from '@/components/ui'
import { IStockBatch } from '@/interfaces/purchase'
import { currency } from '@/utils'

export default function StockBatchesPage() {
  const [productId, setProductId] = useState('')
  const { data: products } = useGetProducts()
  const { data: batches, summary, loading, error } = useGetStockBatches(
    productId || undefined
  )

  const columns: ResponsiveColumn<IStockBatch>[] = [
    {
      key: 'productName',
      header: 'Produk',
      render: (row) => <Text fontWeight="600">{row.productName || '-'}</Text>
    },
    {
      key: 'purchaseNumber',
      header: 'No. Nota',
      render: (row) => <Text fontSize="sm">{row.purchaseNumber || '-'}</Text>
    },
    {
      key: 'receivedAt',
      header: 'Tanggal',
      render: (row) =>
        row.receivedAt
          ? format(new Date(row.receivedAt), 'dd MMM yyyy', { locale: id })
          : '-'
    },
    {
      key: 'qty',
      header: 'Sisa / Masuk',
      isNumeric: true,
      render: (row) => (
        <Text>
          {row.qtyRemaining}{' '}
          <Text as="span" color="text-muted">
            / {row.qtyIn}
          </Text>
        </Text>
      )
    },
    {
      key: 'costPrice',
      header: 'HPP beli',
      isNumeric: true,
      render: (row) => currency.toIDRFormat(row.costPrice)
    },
    {
      key: 'sellPrice',
      header: 'Harga jual',
      isNumeric: true,
      render: (row) => currency.toIDRFormat(row.sellPrice)
    },
    {
      key: 'margin',
      header: 'Laba/unit',
      isNumeric: true,
      render: (row) => currency.toIDRFormat(row.sellPrice - row.costPrice)
    },
    {
      key: 'potentialProfit',
      header: 'Potensi laba',
      isNumeric: true,
      render: (row) => (
        <Text fontWeight="600" color="brand.700">
          {currency.toIDRFormat(row.potentialProfit)}
        </Text>
      )
    }
  ]

  return (
    <Layout error={error as Error} isFetching={loading}>
      <PageHeader
        title="Batch stok"
        subtitle="Lacak sisa stok tiap pembelian beserta potensi labanya"
        breadcrumbs={[
          { label: 'Dasbor', path: '/admin' },
          { label: 'Pembelian', path: '/admin/purchases' },
          { label: 'Batch stok' }
        ]}
      />

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={5} mb={6}>
        <StatCard
          label="Sisa stok"
          value={String(summary.totalRemaining)}
          sublabel="Dari seluruh batch"
          tone="brand"
        />
        <StatCard
          label="Nilai stok (HPP)"
          value={currency.toIDRFormat(summary.totalValue)}
          sublabel="Sisa × HPP beli"
          tone="gray"
        />
        <StatCard
          label="Potensi laba"
          value={currency.toIDRFormat(summary.potentialProfit)}
          sublabel="Jika seluruh sisa terjual"
          tone="green"
        />
      </SimpleGrid>

      <HStack mb={5} gap={3} flexWrap="wrap">
        <Select
          maxW="280px"
          bg="white"
          placeholder="Semua produk"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </Select>
        {productId && (
          <StatusBadge color="gray">{batches.length} batch</StatusBadge>
        )}
      </HStack>

      <ResponsiveTable
        columns={columns}
        rows={batches}
        getRowKey={(row) => row.id}
        mobileTitleKey="productName"
        mobileSubtitleKey="purchaseNumber"
        emptyState={
          <EmptyState
            title="Belum ada batch stok"
            description="Batch terbentuk otomatis saat Anda mencatat pembelian."
          />
        }
      />
    </Layout>
  )
}
