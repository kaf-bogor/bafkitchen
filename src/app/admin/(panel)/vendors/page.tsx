'use client'
import React, { useState } from 'react'

import {
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Text,
  useToast
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'
import { FiMoreVertical } from 'react-icons/fi'

import { Layout } from '@/components'
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  ResponsiveTable,
  StatusBadge,
  type ResponsiveColumn
} from '@/components/ui'
import { VENDOR_TYPE_OPTIONS, VendorType } from '@/constants/vendor'
import { IVendor } from '@/interfaces/vendor'

import { useGetVendors, useUpdateVendor } from './actions'

export default function VendorsPage() {
  const toast = useToast()
  const { data: vendors, loading: isFetching, error, refetch } = useGetVendors()
  const { updateVendor, loading: isUpdating } = useUpdateVendor()
  const [updatingId, setUpdatingId] = useState('')

  const handleTypeChange = async (vendor: IVendor, type: VendorType) => {
    setUpdatingId(vendor.id)
    try {
      await updateVendor({
        id: vendor.id,
        name: vendor.name,
        userId: vendor.userId || '',
        type
      })
      toast({
        title: 'Berhasil',
        description: 'Tipe vendor diperbarui',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      refetch()
    } catch (err) {
      toast({
        title: 'Gagal',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setUpdatingId('')
    }
  }

  const renderActions = (vendor: IVendor) => (
    <Menu placement="bottom-end">
      <MenuButton
        as={IconButton}
        aria-label="Aksi"
        icon={<FiMoreVertical />}
        variant="ghost"
        size="sm"
      />
      <MenuList>
        <MenuItem as={Link} href={`/dashboard?vendorId=${vendor.id}`}>
          Lihat dashboard
        </MenuItem>
      </MenuList>
    </Menu>
  )

  const columns: ResponsiveColumn<IVendor>[] = [
    {
      key: 'name',
      header: 'Nama',
      render: (vendor) => <Text fontWeight="600">{vendor.name}</Text>
    },
    { key: 'email', header: 'Email', render: (vendor) => vendor.email || '-' },
    {
      key: 'type',
      header: 'Tipe',
      render: (vendor) => (
        <Select
          size="sm"
          maxW="160px"
          value={vendor.type || 'bazaf'}
          isDisabled={isUpdating && updatingId === vendor.id}
          onChange={(e) => handleTypeChange(vendor, e.target.value as VendorType)}
        >
          {VENDOR_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (vendor) => (
        <StatusBadge color={vendor.isActive ? 'green' : 'red'}>
          {vendor.isActive ? 'Aktif' : 'Nonaktif'}
        </StatusBadge>
      )
    },
    {
      key: 'created',
      header: 'Dibuat',
      render: (vendor) => (
        <Text fontSize="sm" color="text-muted">
          {format(new Date(vendor.createdAt), 'dd MMM yyyy', { locale: id })}
        </Text>
      )
    }
  ]

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      <PageHeader
        title="Vendor"
        subtitle="Kelola vendor yang menyediakan produk"
        breadcrumbs={[
          { label: 'Dasbor', path: '/admin' },
          { label: 'Vendor' }
        ]}
      />

      <Card>
        <CardHeader
          title="Daftar vendor"
          description={`${vendors?.length || 0} vendor terdaftar`}
        />
        <CardBody p={0}>
          <ResponsiveTable
            columns={columns}
            rows={vendors || []}
            getRowKey={(vendor) => vendor.id}
            mobileTitleKey="name"
            mobileSubtitleKey="email"
            actions={renderActions}
            emptyState={
              <EmptyState
                title="Belum ada vendor"
                description="Tambahkan vendor untuk mulai mengelola produk dan order."
              />
            }
          />
        </CardBody>
      </Card>
    </Layout>
  )
}
