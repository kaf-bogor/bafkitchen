'use client'

import React, { useState } from 'react'

import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Input,
  Text,
  SkeletonCircle,
  SkeletonText
} from '@chakra-ui/react'
import Link from 'next/link'

import { useGetProducts } from '@/app/admin/products/actions'
import { CardProduct, Layout } from '@/components'

export default function ProductPage() {
  const [query, setQuery] = useState('')

  const {
    data: products,
    loading: isFetching,
    error
  } = useGetProducts({ q: query })

  const sortProducts = (a: any, b: any) =>
    new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1

  const breadcrumbs = [
    { label: 'dashboard', path: '/admin' },
    { label: 'produk', path: '/admin/product' }
  ]
  return (
    <Layout
      breadcrumbs={breadcrumbs}
      error={error as Error}
      isFetching={isFetching}
      rightHeaderComponent={
        <Link href="/admin/products/add">
          <Button colorScheme="blue" size="sm">
            Tambah Produk
          </Button>
        </Link>
      }
    >
      {isFetching && (
        <Box padding="6" boxShadow="lg" bg="white">
          <SkeletonCircle size="10" />
          <SkeletonText mt="4" noOfLines={4} spacing="4" skeletonHeight="2" />
        </Box>
      )}

      {!!products?.length && !isFetching && (
        <>
          <Flex mb={4} justifyContent="space-between" alignItems="center">
            <Flex flex="0.5">
              <Input
                placeholder="Cari produk"
                dropShadow="md"
                onChange={(e) => setQuery(e.target.value)}
              />
            </Flex>
          </Flex>
          <Text fontSize="x-large" mb={4} fontWeight="bold">
            {products.length} produk ditemukan
          </Text>
          <Grid templateColumns="repeat(4, 1fr)" gap={6}>
            {products.sort(sortProducts).map((product) => (
              <GridItem key={product.id}>
                <CardProduct product={product} />
              </GridItem>
            ))}
          </Grid>
        </>
      )}
    </Layout>
  )
}
