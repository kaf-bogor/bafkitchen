'use client'
import React from 'react'

import { Button, ButtonGroup, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'
import Link from 'next/link'

import { useGetCategories } from '@/app/admin/(panel)/categories/actions'
import { Layout } from '@/components'
import { Card, CardBody, CardHeader, EmptyState, PageHeader } from '@/components/ui'
import { ICategory } from '@/interfaces/category'

export default function Categories() {
  const {
    data: categories,
    loading: isFetchingCategories,
    error: errorCategories
  } = useGetCategories()

  const sortCategories = (a: ICategory, b: ICategory) =>
    new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1

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
          {!categories?.length ? (
            <EmptyState
              title="Belum ada kategori"
              description="Tambahkan kategori untuk mengelompokkan produk."
            />
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Nama</Th>
                  <Th>Vendor</Th>
                  <Th>Aksi</Th>
                </Tr>
              </Thead>
              <Tbody>
                {categories.sort(sortCategories).map((category: ICategory) => (
                  <Tr key={category.id} _hover={{ bg: 'gray.50' }}>
                    <Td fontWeight="600">{category.name}</Td>
                    <Td>{category.vendor?.name || '-'}</Td>
                    <Td>
                      <ButtonGroup gap={2}>
                        <Link href={`/admin/categories/${category.id}/edit`}>
                          <Button colorScheme="brand" size="sm" variant="outline">
                            Ubah
                          </Button>
                        </Link>
                        <Button colorScheme="red" size="sm" variant="outline">
                          Hapus
                        </Button>
                      </ButtonGroup>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </Layout>
  )
}
