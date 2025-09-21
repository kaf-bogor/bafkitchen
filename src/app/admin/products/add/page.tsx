'use client'

import React from 'react'

import { useToast } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'

import { useCreateProducts } from '@/app/admin/products/actions'
import { Layout, ProductForm } from '@/components'
import { IVendor } from '@/interfaces'

export default function AddProduct() {
  const toast = useToast()
  const router = useRouter()
  const { createProduct, loading } = useCreateProducts()

  const handleCreateProduct = async (productData: any) => {
    try {
      await createProduct(productData)
      toast({
        title: 'Berhasil',
        description: 'produk berhasil dibuat',
        status: 'success',
        isClosable: true
      })
      router.push('/admin/products')
    } catch (error) {
      toast({
        title: 'Gagal',
        description: `produk gagal dibuat\n ${(error as Error).message}`,
        status: 'error',
        isClosable: true
      })
    }
  }

  const breadcrumbs = [
    { label: 'dashboard', path: '/admin' },
    { label: 'produk', path: '/admin/products' },
    { label: 'Tambah', path: '/admin/products/add' }
  ]

  return (
    <Layout breadcrumbs={breadcrumbs}>
      <ProductForm
        isPending={loading}
        onCreate={handleCreateProduct}
        product={{
          id: '',
          createdAt: '',
          updatedAt: '',
          name: '',
          description: '',
          imageUrl: '',
          price: 0,
          priceBase: 0,
          stock: 0,
          vendor: {} as IVendor.IVendor,
          categories: []
        }}
        title="Tambah Produk"
      />
    </Layout>
  )
}
