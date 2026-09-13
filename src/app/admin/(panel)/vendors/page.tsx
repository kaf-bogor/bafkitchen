'use client'
import React, { useState } from 'react'

import {
  Button,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'

import { Layout } from '@/components'
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  StatusBadge
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
          {!vendors?.length ? (
            <EmptyState
              title="Belum ada vendor"
              description="Tambahkan vendor untuk mulai mengelola produk dan order."
            />
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Nama</Th>
                  <Th>Email</Th>
                  <Th>Tipe</Th>
                  <Th>Status</Th>
                  <Th>Dibuat</Th>
                  <Th>Aksi</Th>
                </Tr>
              </Thead>
              <Tbody>
                {vendors.map((vendor) => (
                  <Tr key={vendor.id} _hover={{ bg: 'gray.50' }}>
                    <Td>
                      <Text fontWeight="600">{vendor.name}</Text>
                    </Td>
                    <Td>{vendor.email || '-'}</Td>
                    <Td>
                      <Select
                        size="sm"
                        maxW="160px"
                        value={vendor.type || 'bazaf'}
                        isDisabled={isUpdating && updatingId === vendor.id}
                        onChange={(e) =>
                          handleTypeChange(vendor, e.target.value as VendorType)
                        }
                      >
                        {VENDOR_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </Td>
                    <Td>
                      <StatusBadge color={vendor.isActive ? 'green' : 'red'}>
                        {vendor.isActive ? 'Aktif' : 'Nonaktif'}
                      </StatusBadge>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color="text-muted">
                        {format(new Date(vendor.createdAt), 'dd MMM yyyy', {
                          locale: id
                        })}
                      </Text>
                    </Td>
                    <Td>
                      <Link href={`/dashboard?vendorId=${vendor.id}`}>
                        <Button size="xs" colorScheme="brand" variant="outline">
                          Lihat dashboard
                        </Button>
                      </Link>
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
