'use client'

import React from 'react'

import { Button, Grid, GridItem } from '@chakra-ui/react'
import Link from 'next/link'

import { useGetProducts } from '@/app/admin/(panel)/products/actions'
import { CardProduct, Layout } from '@/components'
import { EmptyState, PageHeader } from '@/components/ui'

export default function VendorProductsPage() {
  const { data: products, loading: isFetching, error } = useGetProducts()

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
          <Link href="/dashboard/products/add">
            <Button colorScheme="brand" size="sm">
              Tambah produk
            </Button>
          </Link>
        }
      />

      {!products?.length ? (
        <EmptyState
          title="Belum ada produk"
          description="Tambahkan produk pertama Anda. Produk akan ditinjau admin sebelum tampil."
          action={
            <Link href="/dashboard/products/add">
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
              />
            </GridItem>
          ))}
        </Grid>
      )}
    </Layout>
  )
}
