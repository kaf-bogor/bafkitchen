'use client'

import React from 'react'

import { useToast } from '@chakra-ui/react'
import { useParams } from 'next/navigation'

import {
  useGetProduct,
  useUpdateProducts
} from '@/app/admin/(panel)/products/actions'
import { useAuth } from '@/app/UserProvider'
import { Layout, ProductForm } from '@/components'
import { PageHeader } from '@/components/ui'

export default function EditVendorProduct() {
  const { productId } = useParams()
  const { user } = useAuth()
  const {
    data: product,
    loading: isFetching,
    error,
    refetch
  } = useGetProduct(productId as string)

  const toast = useToast()
  const { updateProduct, loading } = useUpdateProducts()

  const lockedVendor = user?.vendorId
    ? { id: user.vendorId, name: user.vendorName || '' }
    : undefined

  const handleUpdateProduct = async (productData: any) => {
    try {
      await updateProduct(productData)
      toast({
        title: 'Berhasil',
        description: 'Produk diperbarui dan menunggu persetujuan admin.',
        status: 'success',
        isClosable: true
      })
      refetch()
    } catch (err) {
      toast({
        title: 'Gagal',
        description: (err as Error).message,
        status: 'error',
        isClosable: true
      })
    }
  }

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      <PageHeader
        title="Ubah produk"
        subtitle="Perubahan akan ditinjau ulang oleh admin"
        breadcrumbs={[
          { label: 'Dashboard vendor', path: '/dashboard' },
          { label: 'Produk', path: '/dashboard/products' },
          { label: 'Ubah' }
        ]}
      />
      {product && (
        <ProductForm
          isPending={loading}
          product={product}
          onUpdate={handleUpdateProduct}
          lockedVendor={lockedVendor}
          title="Ubah produk"
        />
      )}
    </Layout>
  )
}
