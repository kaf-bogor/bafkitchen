'use client'

import React, { useState } from 'react'

import {
  Button,
  ButtonGroup,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast
} from '@chakra-ui/react'
import Link from 'next/link'

import { useDeleteUser, useGetUsers } from '@/app/admin/(panel)/users/actions'
import { DeleteAlert, Layout } from '@/components'
import { Card, CardBody, CardHeader, EmptyState, PageHeader, StatusBadge } from '@/components/ui'

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'red' },
  user: { label: 'Pengguna', color: 'blue' },
  customer: { label: 'Pelanggan', color: 'green' }
}

export default function User() {
  const toast = useToast()
  const { data: users, loading: isFetching, error, refetch } = useGetUsers()
  const { deleteUser, loading: isDeleting } = useDeleteUser()

  const [selectedId, setSelectedId] = useState('')

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id)
      toast({
        title: 'Berhasil',
        description: 'Pengguna berhasil dihapus',
        status: 'success',
        duration: 5000,
        isClosable: true
      })
      setSelectedId('')
      refetch()
    } catch (err) {
      toast({
        title: 'Gagal',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

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
                  <Th>Vendor</Th>
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
                      <Td>{user.vendorName || '-'}</Td>
                      <Td>{user.phoneNumber || '-'}</Td>
                      <Td>
                        <ButtonGroup gap={2}>
                          {user.vendorId && (
                            <Link href={`/dashboard?vendorId=${user.vendorId}`}>
                              <Button colorScheme="purple" size="sm" variant="outline">
                                Impersonate
                              </Button>
                            </Link>
                          )}
                          <Link href={`/admin/users/${user.id}/edit`}>
                            <Button colorScheme="brand" size="sm" variant="outline">
                              Ubah
                            </Button>
                          </Link>
                          <Button
                            colorScheme="red"
                            size="sm"
                            variant="outline"
                            isLoading={isDeleting && selectedId === user.id}
                            onClick={() => setSelectedId(user.id)}
                          >
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

      <DeleteAlert
        isOpen={!!selectedId}
        onClose={() => setSelectedId('')}
        onSubmit={handleDelete}
        title="Hapus pengguna"
        id={selectedId}
      />
    </Layout>
  )
}
