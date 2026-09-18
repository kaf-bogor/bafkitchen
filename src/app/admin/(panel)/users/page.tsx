'use client'

import React, { useMemo, useState } from 'react'

import {
  Button,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Text,
  useToast
} from '@chakra-ui/react'
import Link from 'next/link'
import { FiMoreVertical } from 'react-icons/fi'

import { useDeleteUser, useGetUsers } from '@/app/admin/(panel)/users/actions'
import { DeleteAlert, Layout } from '@/components'
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
import { IUser } from '@/interfaces'

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
  const [roleFilter, setRoleFilter] = useState('')

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

  const sortedUsers = [...(users || [])].sort((a, b) =>
    new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1
  )

  const filteredUsers = useMemo(
    () =>
      roleFilter
        ? sortedUsers.filter((user) => user.role === roleFilter)
        : sortedUsers,
    [sortedUsers, roleFilter]
  )

  const renderActions = (user: IUser.IUser) => (
    <Menu placement="bottom-end">
      <MenuButton
        as={IconButton}
        aria-label="Aksi"
        icon={<FiMoreVertical />}
        variant="ghost"
        size="sm"
        isLoading={isDeleting && selectedId === user.id}
      />
      <MenuList>
        {user.vendorId && (
          <MenuItem as={Link} href={`/dashboard?vendorId=${user.vendorId}`}>
            Impersonate vendor
          </MenuItem>
        )}
        <MenuItem as={Link} href={`/admin/users/${user.id}/edit`}>
          Ubah
        </MenuItem>
        <MenuItem color="red.500" onClick={() => setSelectedId(user.id)}>
          Hapus
        </MenuItem>
      </MenuList>
    </Menu>
  )

  const columns: ResponsiveColumn<IUser.IUser>[] = [
    {
      key: 'name',
      header: 'Nama',
      render: (user) => <Text fontWeight="600">{user.name}</Text>
    },
    { key: 'email', header: 'Email', render: (user) => user.email },
    {
      key: 'role',
      header: 'Peran',
      render: (user) => {
        const role = ROLE_LABELS[user.role] || { label: user.role, color: 'gray' }
        return <StatusBadge color={role.color}>{role.label}</StatusBadge>
      }
    },
    {
      key: 'vendor',
      header: 'Vendor',
      render: (user) => user.vendorName || '-'
    },
    {
      key: 'phone',
      header: 'No. telepon',
      mobileLabel: 'No. telepon',
      render: (user) => user.phoneNumber || '-'
    }
  ]

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

      <HStack mb={5} gap={3} flexWrap="wrap">
        <Select
          maxW="220px"
          bg="white"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Semua peran</option>
          <option value="admin">Admin</option>
          <option value="user">Pengguna</option>
          <option value="customer">Pelanggan</option>
        </Select>
        <Text fontSize="sm" color="text-muted">
          {filteredUsers.length} pengguna
        </Text>
      </HStack>

      <Card>
        <CardHeader
          title="Daftar pengguna"
          description={`${filteredUsers.length} pengguna terdaftar`}
        />
        <CardBody p={0}>
          <ResponsiveTable
            columns={columns}
            rows={filteredUsers}
            getRowKey={(user) => user.id}
            mobileTitleKey="name"
            mobileSubtitleKey="email"
            actions={renderActions}
            emptyState={
              <EmptyState
                title="Belum ada pengguna"
                description="Tambahkan pengguna untuk memberikan akses."
              />
            }
          />
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
