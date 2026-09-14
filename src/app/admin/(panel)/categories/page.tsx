'use client'
import React from 'react'

import {
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text
} from '@chakra-ui/react'
import Link from 'next/link'
import { FiMoreVertical } from 'react-icons/fi'

import { useGetCategories } from '@/app/admin/(panel)/categories/actions'
import { Layout } from '@/components'
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  ResponsiveTable,
  type ResponsiveColumn
} from '@/components/ui'
import { ICategory } from '@/interfaces/category'

export default function Categories() {
  const {
    data: categories,
    loading: isFetchingCategories,
    error: errorCategories
  } = useGetCategories()

  const sorted = [...(categories || [])].sort((a, b) =>
    new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1
  )

  const renderActions = (category: ICategory) => (
    <Menu placement="bottom-end">
      <MenuButton
        as={IconButton}
        aria-label="Aksi"
        icon={<FiMoreVertical />}
        variant="ghost"
        size="sm"
      />
      <MenuList>
        <MenuItem as={Link} href={`/admin/categories/${category.id}/edit`}>
          Ubah
        </MenuItem>
      </MenuList>
    </Menu>
  )

  const columns: ResponsiveColumn<ICategory>[] = [
    {
      key: 'name',
      header: 'Nama',
      render: (category) => <Text fontWeight="600">{category.name}</Text>
    },
    {
      key: 'vendor',
      header: 'Vendor',
      render: (category) => category.vendor?.name || 'Umum'
    }
  ]

  return (
    <Layout isFetching={isFetchingCategories} error={errorCategories as Error}>
      <PageHeader
        title="Kategori"
        subtitle="Kelola kategori produk"
        breadcrumbs={[
          { label: 'Dasbor', path: '/admin' },
          { label: 'Kategori' }
        ]}
        actions={
          <Link href="/admin/categories/new">
            <Button colorScheme="brand" size="sm">
              Tambah kategori
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader
          title="Daftar kategori"
          description={`${categories?.length || 0} kategori terdaftar`}
        />
        <CardBody p={0}>
          <ResponsiveTable
            columns={columns}
            rows={sorted}
            getRowKey={(category) => category.id}
            mobileTitleKey="name"
            mobileSubtitleKey="vendor"
            actions={renderActions}
            emptyState={
              <EmptyState
                title="Belum ada kategori"
                description="Tambahkan kategori untuk mengelompokkan produk."
              />
            }
          />
        </CardBody>
      </Card>
    </Layout>
  )
}
