'use client'

import React from 'react'

import { useToast } from '@chakra-ui/react'

import { useGetProduct, useUpdateProducts } from '@/app/admin/products/actions'
import { Layout, ProductForm } from '@/components'

export default function Edit({ params }: Props) {
  const {
    data: product,
    loading: isFetching,
    error,
    refetch
  } = useGetProduct(params.productId)

  const toast = useToast()
  const { updateProduct, loading } = useUpdateProducts()

  const handleUpdateProduct = async (productData: any) => {
    try {
      await updateProduct(productData)
      toast({
        title: 'Berhasil',
        description: 'produk berhasil diupdate',
        status: 'success',
        isClosable: true
      })
      refetch()
    } catch (error) {
      toast({
        title: 'Gagal',
        description: 'produk gagal diupdate',
        status: 'error',
        isClosable: true
      })
    }
  }

  const breadcrumbs = [
    { label: 'dashboard', path: '/admin' },
    { label: 'produk', path: '/admin/products' },
    { label: 'edit', path: '/admin/product' }
  ]

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      error={error as Error}
      isFetching={isFetching}
    >
      {product && (
        <ProductForm
          isPending={loading}
          product={product}
          onUpdate={handleUpdateProduct}
          title="Edit Produk"
        />
      )}
    </Layout>
  )
}

type Props = { params: { productId: string } }
