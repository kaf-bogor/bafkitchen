'use client'

import React, { useState } from 'react'

import { Search2Icon } from '@chakra-ui/icons'
import { Box, Button, Grid, GridItem, Input, InputGroup, InputLeftElement } from '@chakra-ui/react'
import Link from 'next/link'

import { useGetProducts } from '@/app/admin/(panel)/products/actions'
import { CardProduct, Layout } from '@/components'
import { EmptyState, PageHeader } from '@/components/ui'

export default function ProductPage() {
  const [query, setQuery] = useState('')

  const {
    data: products,
    loading: isFetching,
    error
  } = useGetProducts({ q: query })

  const sortProducts = (a: any, b: any) =>
    new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1

  const filtered = products
    ? [...products].sort(sortProducts)
    : []

  return (
    <Layout
      error={error as Error}
      isFetching={isFetching}
    >
      <PageHeader
        title="Produk"
        subtitle="Kelola produk yang dijual di BAF Kitchen"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Produk' }
        ]}
        actions={
          <Link href="/admin/products/add">
            <Button colorScheme="brand" size="sm">
              Tambah Produk
            </Button>
          </Link>
        }
      />

      <Box mb={5} maxW="md">
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Search2Icon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Cari produk..."
            bg="white"
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
      </Box>

      {!isFetching && filtered.length === 0 ? (
        <EmptyState
          title="Belum ada produk"
          description="Tambahkan produk pertama Anda untuk mulai menjual."
          action={
            <Link href="/admin/products/add">
              <Button colorScheme="brand" size="sm" mt={2}>
                Tambah Produk
              </Button>
            </Link>
          }
        />
      ) : (
        <Box>
          <Box fontSize="sm" color="gray.500" mb={4}>
            {filtered.length} produk ditemukan
          </Box>
          <Grid
            templateColumns={{
              base: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
              xl: 'repeat(4, 1fr)'
            }}
            gap={6}
          >
            {filtered.map((product) => (
              <GridItem key={product.id}>
                <CardProduct product={product} />
              </GridItem>
            ))}
          </Grid>
        </Box>
      )}
    </Layout>
  )
}
