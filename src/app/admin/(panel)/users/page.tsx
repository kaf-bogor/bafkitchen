'use client'

import React from 'react'

import { Button, ButtonGroup, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'
import Link from 'next/link'

import { useGetUsers } from '@/app/admin/(panel)/users/actions'
import { Layout } from '@/components'
import { Card, CardBody, CardHeader, EmptyState, PageHeader, StatusBadge } from '@/components/ui'

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'red' },
  user: { label: 'Pengguna', color: 'blue' },
  customer: { label: 'Pelanggan', color: 'green' }
}

export default function User() {
  const { data: users, loading: isFetching, error } = useGetUsers()

  const sortByCreatedAt = (a: any, b: any) =>
    new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      <PageHeader
        title="Pengguna"
        subtitle="Kelola pengguna dan hak akses"
        breadcrumbs={[
          { label: 'Dasbor', path: '/admin' },
          { label: 'Pengguna' }
        ]}
        actions={
          <Link href="/admin/users/add">
            <Button colorScheme="brand" size="sm">
              Tambah pengguna
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader
          title="Daftar pengguna"
          description={`${users?.length || 0} pengguna terdaftar`}
        />
        <CardBody p={0}>
          {!users?.length ? (
            <EmptyState
              title="Belum ada pengguna"
              description="Tambahkan pengguna untuk memberikan akses."
            />
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Nama</Th>
                  <Th>Email</Th>
                  <Th>Peran</Th>
                  <Th>No. telepon</Th>
                  <Th>Aksi</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.sort(sortByCreatedAt).map((user) => {
                  const role = ROLE_LABELS[user.role] || {
                    label: user.role,
                    color: 'gray'
                  }
                  return (
                    <Tr key={user.id} _hover={{ bg: 'gray.50' }}>
                      <Td fontWeight="600">{user.name}</Td>
                      <Td>{user.email}</Td>
                      <Td>
                        <StatusBadge color={role.color}>{role.label}</StatusBadge>
                      </Td>
                      <Td>{user.phoneNumber || '-'}</Td>
                      <Td>
                        <ButtonGroup gap={2}>
                          <Link href={`/admin/users/${user.id}/edit`}>
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
                  )
                })}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </Layout>
  )
}
