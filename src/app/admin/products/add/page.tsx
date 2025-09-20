'use client'

import React from 'react'

import { useToast } from '@chakra-ui/react'

import { useCreateProducts } from '@/app/admin/products/actions'
import { Layout, ProductForm } from '@/components'
import { IVendor } from '@/interfaces'

export default function AddProduct() {
  const toast = useToast()
  const { mutate, isPending } = useCreateProducts({
    onSuccess() {
      toast({
        title: 'Berhasil',
        description: 'produk berhasil dibuat',
        status: 'success',
        isClosable: true
      })
    },
    onError(error) {
      toast({
        title: 'Gagal',
        description: `produk gagal dibuat\n ${error.message}`,
        status: 'error',
        isClosable: true
      })
    }
  })

  const breadcrumbs = [
    { label: 'dashboard', path: '/admin' },
    { label: 'produk', path: '/admin/products' },
    { label: 'Tambah', path: '/admin/products/add' }
  ]

  return (
    <Layout breadcrumbs={breadcrumbs}>
      <ProductForm
        isPending={isPending}
        onCreate={mutate}
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
