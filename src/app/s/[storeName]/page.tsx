/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import React, { useCallback, useEffect, useState } from 'react'

import { FormLabel, Grid, Stack, useToast } from '@chakra-ui/react'
import { Select as MultiSelect } from 'chakra-react-select'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { getCategories } from '@/app/admin/categories/actions'
// import { Layout } from '@/app/s/[storeName]/components/Layout'
import { useGetProducts } from '@/app/admin/products/actions'
import { useProductList } from '@/app/s/[storeName]/use-product-list'
import { useStore } from '@/app/s/[storeName]/useStore'
// import { ProductCard } from '@/components'
import { CardProduct, Layout } from '@/components/homepage'
import { IProduct } from '@/interfaces'
import { cartStore } from '@/stores/useCart'
import { params as paramsUtils } from '@/utils'

export default function Stores({ params }: { params: { storeName: string } }) {
  const toast = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const cart = useStore(cartStore, (state) => state, 'bafkitchen')
  const categoryIds = searchParams.get('categories')?.split(',')
  const [categoryOptions, setCategoryOptions] = useState<
    IProduct.ICategoryInput[]
  >([])
  const [query] = useState<string>('')
  const { data: products, loading: isFetching, error } = useGetProducts({ q: query })

  const storeName = decodeURI(params.storeName)

  const { validateCurrentPage } = useProductList(toast, router, storeName)

  const { data: categories } = getCategories()

  useEffect(() => {
    if (categories?.length) {
      const options: IProduct.ICategoryInput[] = categories
        .filter((category) => category.vendor?.name === storeName)
        .map((category) => ({ label: category.name, value: category.id }))
      setCategoryOptions(options)
    }
  }, [categories])

  const initInputCategories = categoryIds
    ? categoryOptions.filter((category) =>
        categoryIds?.includes(category.value)
      )
    : []

  const [inputCategories, setInputCategories] =
    useState<IProduct.ICategoryInput[]>(initInputCategories)

  useEffect(() => {
    validateCurrentPage()
  }, [])

  useEffect(() => {
    if (initInputCategories.length > 0) {
      setInputCategories(initInputCategories)
    }
  }, [initInputCategories.length])

  useEffect(() => {
    const categoryIds = inputCategories.map((category) => category.value)
    const query = paramsUtils.createQueryString(searchParams, {
      key: 'categories',
      value: categoryIds.join(',')
    })

    router.push(`${pathname}${query}`)
  }, [inputCategories.length])

  useEffect(() => {
    // const categoryIds = searchParams.get('categories')?.split(',')
    // const searchQuery = searchParams.get('search') || undefined
  }, [searchParams.get('categories'), searchParams.get('search')])

  const handleUpdateQty = useCallback(
    (productId: string, qty: number) => {
      cart.updateProductQuantity(productId, qty)
    },
    [cart]
  )

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

  return (
    <Layout storeName={storeName} error={error as Error}>
      <Stack gap={6}>
        <FormLabel>Filter berdasarkan kategori</FormLabel>
        <MultiSelect
          isMulti
          size="sm"
          placeholder="Pilih kategori"
          onChange={(value) =>
            setInputCategories(value as IProduct.ICategoryInput[])
          }
          value={inputCategories}
          options={categoryOptions}
          chakraStyles={{
            container(provided) {
              return { ...provided, background: 'white' }
            }
          }}
        />
        {!!products?.length && !isFetching && (
          <Grid gap={4} templateColumns="repeat(4, 1fr)">
            {products.map((product: IProduct.IProductResponse) => (
              <CardProduct
                qty={
                  cart.getTotalQuantity ? cart.getTotalQuantity(product.id) : 0
                }
                key={product.id}
                product={product}
                onUpdateQty={(qty) => handleUpdateQty(product.id, qty)}
                onAddQty={() => handleAddQty(product)}
                onRemoveQty={() => handleRemoveQty(product.id)}
              />
            ))}
          </Grid>
        )}
      </Stack>
    </Layout>
  )
}
