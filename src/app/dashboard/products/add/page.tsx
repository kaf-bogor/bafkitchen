'use client'

import React from 'react'

import { useToast } from '@chakra-ui/react'
import { useRouter, useSearchParams } from 'next/navigation'

import { useCreateProducts } from '@/app/admin/(panel)/products/actions'
import { useGetVendor } from '@/app/admin/(panel)/vendors/actions'
import { useAuth } from '@/app/UserProvider'
import { Layout, ProductForm } from '@/components'
import { EmptyState, PageHeader } from '@/components/ui'
import { IVendor } from '@/interfaces'

export default function AddVendorProduct() {
  const toast = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { createProduct, loading } = useCreateProducts()

  const isAdmin = user?.role === 'admin'
  const vendorId = isAdmin
    ? searchParams.get('vendorId') || ''
    : user?.vendorId || ''

  const { data: vendor } = useGetVendor(vendorId)

  const lockedVendor = vendorId
    ? { id: vendorId, name: vendor?.name || user?.vendorName || '' }
    : undefined

  const handleCreateProduct = async (productData: any) => {
    try {
      await createProduct(productData)
      toast({
        title: 'Produk dikirim',
        description: 'Produk menunggu persetujuan admin sebelum tampil.',
        status: 'success',
        isClosable: true
      })
      router.push('/dashboard/products')
    } catch (error) {
      toast({
        title: 'Gagal',
        description: (error as Error).message,
        status: 'error',
        isClosable: true
      })
    }
  }

  return (
    <Layout>
      <PageHeader
        title="Tambah produk"
        subtitle="Produk akan ditinjau admin sebelum tampil di toko"
        breadcrumbs={[
          { label: 'Dashboard vendor', path: '/dashboard' },
          { label: 'Produk', path: '/dashboard/products' },
          { label: 'Tambah' }
        ]}
      />

      {lockedVendor ? (
        <ProductForm
          isPending={loading}
          onCreate={handleCreateProduct}
          lockedVendor={lockedVendor}
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
          title="Tambah produk"
        />
      ) : (
        <EmptyState
          title="Akun belum tertaut ke vendor"
          description="Hubungi admin untuk menautkan akun Anda dengan vendor."
        />
      )}
    </Layout>
  )
}
