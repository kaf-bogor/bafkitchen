'use client'

import React, { useCallback, useEffect, useState, useMemo } from 'react'

import { Box, SimpleGrid, Text, Divider, VStack, Flex } from '@chakra-ui/react'

import { useGetProducts } from '@/app/admin/(panel)/products/actions'
import { getVendors } from '@/app/admin/(panel)/vendors/actions'
import { CardProduct, Layout, VendorFilter } from '@/components/homepage'
import { useCart } from '@/hooks/useCart'
import { IProduct } from '@/interfaces'

import type { IVendor } from '@/interfaces/vendor'

export default function Home() {
  const [query, setQuery] = useState<string>('')
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [vendors, setVendors] = useState<IVendor[]>([])

  const { data: allProducts, loading: isFetching, error } = useGetProducts({
    q: query
  })

  useEffect(() => {
    ;(async () => {
      const list = await getVendors()
      setVendors(list)
    })()
  }, [])

  const cart = useCart()

  const handleAddQty = useCallback(
    (product: IProduct.IProductResponse) => {
      cart.addProduct(IProduct.IProduct.fromData(product))
    },
    [cart]
  )

  const handleRemoveQty = useCallback(
    (productId: string) => {
      cart.reduceQuantity(productId)
    },
    [cart]
  )

  const handleUpdateQty = useCallback(
    (productId: string, qty: number) => {
      cart.updateProductQuantity(productId, qty)
    },
    [cart]
  )

  const products = useMemo(() => {
    let result = [...(allProducts || [])]
    if (selectedVendorId) {
      result = result.filter((p) => p.vendor?.id === selectedVendorId)
    }
    return result
  }, [allProducts, selectedVendorId])

  const readyProducts = useMemo(
    () => products.filter((p) => p.availability !== 'preorder'),
    [products]
  )

  const preorderProducts = useMemo(
    () => products.filter((p) => p.availability === 'preorder'),
    [products]
  )

  const renderGrid = (items: IProduct.IProductResponse[]) => (
    <SimpleGrid columns={[2, 2, 3, 4]} gap={[3, 4, 6]}>
      {items.map((product) => (
        <CardProduct
          qty={cart.getTotalQuantity ? cart.getTotalQuantity(product.id) : 0}
          onUpdateQty={(qty) => handleUpdateQty(product.id, qty)}
          onAddQty={() => handleAddQty(product)}
          onRemoveQty={() => handleRemoveQty(product.id)}
          product={product}
          key={product.id}
        />
      ))}
    </SimpleGrid>
  )

  return (
    <Layout isFetching={isFetching} error={error as Error} onSearch={setQuery}>
      <VStack align="stretch" gap={4} w="full">
        <VendorFilter
          vendors={vendors}
          selectedVendorId={selectedVendorId}
          onChange={setSelectedVendorId}
        />

        {!query && products.length > 0 && (
          <Flex
            gap={2}
            flexWrap="wrap"
            borderWidth="1px"
            rounded="xl"
            p={2}
            bg="white"
            w="full"
          >
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="green.700"
              px={2}
              py={1}
              rounded="lg"
              bg="green.50"
            >
              Ready ({readyProducts.length})
            </Text>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="orange.600"
              px={2}
              py={1}
              rounded="lg"
              bg="orange.50"
            >
              Pre-order ({preorderProducts.length})
            </Text>
          </Flex>
        )}

        {query ? (
          products.length ? (
            renderGrid(products)
          ) : (
            <Text>Produk tidak ditemukan</Text>
          )
        ) : (
          <VStack align="stretch" gap={8} w="full">
            {readyProducts.length > 0 && (
              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={3}>
                  Siap Saji
                </Text>
                {renderGrid(readyProducts)}
              </Box>
            )}

            {preorderProducts.length > 0 && (
              <Box>
                <Divider mb={6} />
                <Text fontSize="lg" fontWeight="bold" mb={3}>
                  Pre-Order
                </Text>
                {renderGrid(preorderProducts)}
              </Box>
            )}

            {products.length === 0 && (
              <Text color="gray.500">Belum ada produk tersedia.</Text>
            )}
          </VStack>
        )}
      </VStack>
    </Layout>
  )
}
