'use client'

import React from 'react'

import { Button, Grid, GridItem } from '@chakra-ui/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { useAuth } from '@/app/UserProvider'
import { CardProduct, Layout } from '@/components'
import { EmptyState, PageHeader } from '@/components/ui'

import { useVendorProducts } from './actions'

export default function VendorProductsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()

  const isAdmin = user?.role === 'admin'
  const vendorId = isAdmin
    ? searchParams.get('vendorId') || ''
    : user?.vendorId || ''

  const { data: products, loading: isFetching, error } = useVendorProducts(vendorId)

  const addHref = isAdmin && vendorId
    ? `/dashboard/products/add?vendorId=${vendorId}`
    : '/dashboard/products/add'

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      <PageHeader
        title="Produk saya"
        subtitle="Kelola produk yang Anda jual"
        breadcrumbs={[
          { label: 'Dashboard vendor', path: '/dashboard' },
          { label: 'Produk' }
        ]}
        actions={
          vendorId ? (
            <Link href={addHref}>
              <Button colorScheme="brand" size="sm">
                Tambah produk
              </Button>
            </Link>
          ) : undefined
        }
      />

      {!vendorId ? (
        <EmptyState
          title={isAdmin ? 'Pilih vendor' : 'Akun belum tertaut ke vendor'}
          description={
            isAdmin
              ? 'Buka dashboard vendor lewat tombol Impersonate di menu Pengguna.'
              : 'Hubungi admin untuk menautkan akun Anda dengan vendor.'
          }
        />
      ) : !products?.length ? (
        <EmptyState
          title="Belum ada produk"
          description="Tambahkan produk pertama Anda. Produk akan ditinjau admin sebelum tampil."
          action={
            <Link href={addHref}>
              <Button colorScheme="brand" size="sm" mt={2}>
                Tambah produk
              </Button>
            </Link>
          }
        />
      ) : (
        <Grid
          templateColumns={{
            base: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
            xl: 'repeat(4, 1fr)'
          }}
          gap={6}
        >
          {products.map((product) => (
            <GridItem key={product.id}>
              <CardProduct
                product={product}
                editBasePath="/dashboard/products"
                editQuery={isAdmin && vendorId ? `?vendorId=${vendorId}` : ''}
              />
            </GridItem>
          ))}
        </Grid>
      )}
    </Layout>
  )
}
