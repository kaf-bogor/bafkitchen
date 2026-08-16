'use client'
import React from 'react'

import { Button, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react'
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

import { useGetVendors } from './actions'

export default function VendorsPage() {
  const { data: vendors, loading: isFetching, error } = useGetVendors()

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      <PageHeader
        title="Vendor Management"
        subtitle="Kelola vendor yang menyediakan produk"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Vendors' }
        ]}
      />

      <Card>
        <CardHeader
          title="Daftar Vendor"
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
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Status</Th>
                  <Th>Created At</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {vendors.map((vendor) => (
                  <Tr key={vendor.id}>
                    <Td>
                      <Text fontWeight="600">{vendor.name}</Text>
                    </Td>
                    <Td>{vendor.email}</Td>
                    <Td>
                      <StatusBadge color={vendor.isActive ? 'green' : 'red'}>
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </StatusBadge>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color="gray.500">
                        {format(new Date(vendor.createdAt), 'dd MMM yyyy', {
                          locale: id
                        })}
                      </Text>
                    </Td>
                    <Td>
                      <Link href={`/dashboard?vendorId=${vendor.id}`}>
                        <Button size="xs" colorScheme="brand" variant="outline">
                          View Dashboard
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
