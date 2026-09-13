'use client'

import React from 'react'

import { useToast } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'

import { useCreateProducts } from '@/app/admin/(panel)/products/actions'
import { Layout, ProductForm } from '@/components'
import { PageHeader } from '@/components/ui'
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
    { label: 'Dasbor', path: '/admin' },
    { label: 'Produk', path: '/admin/products' },
    { label: 'Tambah' }
  ]

  return (
    <Layout>
      <PageHeader
        title="Tambah produk"
        subtitle="Lengkapi informasi produk untuk mulai menjual"
        breadcrumbs={breadcrumbs}
      />
      <ProductForm
        isPending={loading}
        onCreate={handleCreateProduct}
        product={{
          id: '',
          createdAt: '',
          updatedAt: '',
          name: '',
          sku: '',
          unit: 'pcs',
          isActive: true,
          description: '',
          imageUrl: '',
          price: 0,
          priceBase: 0,
          stock: 0,
          availability: 'ready',
          preorderStart: null,
          preorderEnd: null,
          channels: ['pos'],
          availabilityType: 'always',
          weeklyDays: [],
          specificDates: [],
          preorderLeadDays: null,
          preorderCutoffTime: null,
          preorderMinQty: null,
          preorderMaxQty: null,
          preorderCapacity: null,
          fulfillmentType: 'takeaway',
          vendor: {} as IVendor.IVendor,
          categories: []
        }}
        title="Tambah Produk"
      />
    </Layout>
  )
}
