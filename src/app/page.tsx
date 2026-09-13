'use client'

import React, { useCallback, useEffect, useState, useMemo } from 'react'

import {
  Box,
  Flex,
  Heading,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { MdRestaurantMenu } from 'react-icons/md'

import { useGetProducts } from '@/app/admin/(panel)/products/actions'
import { getVendors } from '@/app/admin/(panel)/vendors/actions'
import {
  CardProduct,
  FilterBar,
  FloatingCartBar,
  Layout
} from '@/components/homepage'
import { SearchBar } from '@/components/ui'
import { IProduct } from '@/interfaces'
import { cartStore } from '@/stores/useCart'

import type { IVendor } from '@/interfaces/vendor'

function EmptyMessage({ text }: { text: string }) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      py={16}
      textAlign="center"
      color="gray.400"
    >
      <MdRestaurantMenu size={44} />
      <Text mt={4} color="gray.500" fontSize="md">
        {text}
      </Text>
    </Flex>
  )
}

export default function Home() {
  const router = useRouter()
  const [query, setQuery] = useState<string>('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  )
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [tabIndex, setTabIndex] = useState(0)
  const [vendors, setVendors] = useState<IVendor[]>([])

  const {
    data: allProducts,
    loading: isFetching,
    error
  } = useGetProducts({
    q: query
  })

  useEffect(() => {
    ;(async () => {
      const list = await getVendors()
      setVendors(list)
    })()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setSelectedCategoryId(params.get('category'))
    setSelectedVendorId(params.get('vendor'))
    if (params.get('tab') === 'preorder') setTabIndex(1)
  }, [])

  const cartProducts = cartStore((state) => state.products)
  const addProduct = cartStore((state) => state.addProduct)
  const reduceQuantity = cartStore((state) => state.reduceQuantity)
  const updateProductQuantity = cartStore((state) => state.updateProductQuantity)

  const qtyById = useMemo(() => {
    const map = new Map<string, number>()
    for (const product of cartProducts) map.set(product.id, product.quantity)
    return map
  }, [cartProducts])

  const handleAddQty = useCallback(
    (product: IProduct.IProductResponse) => {
      addProduct(IProduct.IProduct.fromData(product))
    },
    [addProduct]
  )

  const handleRemoveQty = useCallback(
    (productId: string) => {
      reduceQuantity(productId)
    },
    [reduceQuantity]
  )

  const handleUpdateQty = useCallback(
    (productId: string, qty: number) => {
      updateProductQuantity(productId, qty)
    },
    [updateProductQuantity]
  )

  const products = useMemo(() => [...(allProducts || [])], [allProducts])

  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const product of products) {
      for (const category of product.categories || []) {
        if (!map.has(category.id)) map.set(category.id, category.name)
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products])

  const vendorOptions = useMemo(() => {
    return [...vendors]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((vendor) => ({ id: vendor.id, name: vendor.name }))
  }, [vendors])

  const filteredProducts = useMemo(() => {
    let list = products
    if (selectedCategoryId) {
      list = list.filter((p) =>
        (p.categories || []).some((c) => c.id === selectedCategoryId)
      )
    }
    if (selectedVendorId) {
      list = list.filter((p) => p.vendor?.id === selectedVendorId)
    }
    return list
  }, [products, selectedCategoryId, selectedVendorId])

  const readyProducts = useMemo(
    () => filteredProducts.filter((p) => p.availability !== 'preorder'),
    [filteredProducts]
  )

  const preorderProducts = useMemo(
    () => filteredProducts.filter((p) => p.availability === 'preorder'),
    [filteredProducts]
  )

  const updateUrl = useCallback(
    (
      nextCategory: string | null,
      nextVendor: string | null,
      nextTabIndex: number
    ) => {
      const params = new URLSearchParams()
      if (nextCategory) params.set('category', nextCategory)
      if (nextVendor) params.set('vendor', nextVendor)
      if (nextTabIndex === 1) params.set('tab', 'preorder')
      const qs = params.toString()
      router.replace(qs ? `?${qs}` : '?', { scroll: false })
    },
    [router]
  )

  const handleCategoryChange = useCallback(
    (id: string | null) => {
      setSelectedCategoryId(id)
      updateUrl(id, selectedVendorId, tabIndex)
    },
    [selectedVendorId, tabIndex, updateUrl]
  )

  const handleVendorChange = useCallback(
    (id: string | null) => {
      setSelectedVendorId(id)
      updateUrl(selectedCategoryId, id, tabIndex)
    },
    [selectedCategoryId, tabIndex, updateUrl]
  )

  const handleTabChange = useCallback(
    (index: number) => {
      setTabIndex(index)
      updateUrl(selectedCategoryId, selectedVendorId, index)
    },
    [selectedCategoryId, selectedVendorId, updateUrl]
  )

  const renderGrid = (items: IProduct.IProductResponse[]) => (
    <SimpleGrid columns={[2, 2, 3, 4]} gap={[3, 4, 5]}>
      {items.map((product) => (
        <CardProduct
          qty={qtyById.get(product.id) || 0}
          onUpdateQty={handleUpdateQty}
          onAddQty={handleAddQty}
          onRemoveQty={handleRemoveQty}
          product={product}
          key={product.id}
        />
      ))}
    </SimpleGrid>
  )

  const filterKey = `${selectedCategoryId || 'all'}-${selectedVendorId || 'all'}-${tabIndex}`

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap={3}
        align={{ base: 'stretch', md: 'center' }}
        mb={5}
      >
        <Box flex="1" minW={0}>
          <FilterBar
            categories={categoryOptions}
            vendors={vendorOptions}
            selectedCategoryId={selectedCategoryId}
            selectedVendorId={selectedVendorId}
            onCategoryChange={handleCategoryChange}
            onVendorChange={handleVendorChange}
          />
        </Box>
        <SearchBar
          onSearch={setQuery}
          placeholder="Cari produk atau vendor"
          w={{ base: 'full', md: '18rem' }}
          flexShrink={0}
        />
      </Flex>

      {query ? (
        <Box>
          <Flex align="baseline" justify="space-between" mb={5}>
            <Heading
              as="h2"
              fontSize={{ base: 'lg', md: 'xl' }}
              fontWeight="700"
              letterSpacing="-0.01em"
              color="gray.900"
              noOfLines={1}
            >
              Hasil “{query}”
            </Heading>
            <Text
              fontSize="sm"
              fontWeight="500"
              color="gray.400"
              flexShrink={0}
            >
              {filteredProducts.length} produk
            </Text>
          </Flex>
          {filteredProducts.length ? (
            renderGrid(filteredProducts)
          ) : (
            <EmptyMessage text="Produk tidak ditemukan" />
          )}
        </Box>
      ) : (
        <motion.div
          key={filterKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <Tabs
            index={tabIndex}
            onChange={handleTabChange}
            variant="softRounded"
            isLazy
          >
            <TabList mb={5} borderBottom="none" gap={1}>
              <Tab px={4} py={2}>
                Tersedia ({readyProducts.length})
              </Tab>
              <Tab px={4} py={2}>
                Pre-order ({preorderProducts.length})
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                {readyProducts.length ? (
                  renderGrid(readyProducts)
                ) : (
                  <EmptyMessage text="Belum ada produk tersedia." />
                )}
              </TabPanel>
              <TabPanel px={0}>
                {preorderProducts.length ? (
                  renderGrid(preorderProducts)
                ) : (
                  <EmptyMessage text="Belum ada produk pre-order." />
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </motion.div>
      )}

      <Box h={24} />
      <FloatingCartBar />
    </Layout>
  )
}
