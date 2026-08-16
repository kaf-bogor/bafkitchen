'use client'

import React from 'react'

import { useToast } from '@chakra-ui/react'
import { useParams } from 'next/navigation'

import { useGetProduct, useUpdateProducts } from '@/app/admin/(panel)/products/actions'
import { Layout, ProductForm } from '@/components'

export default function Edit() {
  const { productId } = useParams()
  const {
    data: product,
    loading: isFetching,
    error,
    refetch
  } = useGetProduct(productId as string)

  const toast = useToast()
  const { updateProduct, loading } = useUpdateProducts()

  const handleUpdateProduct = async (productData: any) => {
    try {
      await updateProduct(productData)
      toast({
        title: 'Berhasil',
        description: 'Produk berhasil diperbarui',
        status: 'success',
        isClosable: true
      })
      refetch()
    } catch (error) {
      toast({
        title: 'Gagal',
        description: 'Produk gagal diperbarui',
        status: 'error',
        isClosable: true
      })
    }
  }

  const breadcrumbs = [
    { label: 'Dasbor', path: '/admin' },
    { label: 'Produk', path: '/admin/products' },
    { label: 'Ubah produk' }
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
          title="Ubah produk"
        />
      )}
    </Layout>
  )
}
