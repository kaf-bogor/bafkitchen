'use client'
import React, { useState } from 'react'

import { AddIcon } from '@chakra-ui/icons'
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Text,
  useDisclosure,
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
import {
  isGmailAddress,
  VENDOR_TYPE_OPTIONS,
  VendorType
} from '@/constants/vendor'
import { IVendor } from '@/interfaces/vendor'

import { useCreateVendor, useGetVendors, useUpdateVendor } from './actions'

export default function VendorsPage() {
  const toast = useToast()
  const { data: vendors, loading: isFetching, error, refetch } = useGetVendors()
  const { updateVendor, loading: isUpdating } = useUpdateVendor()
  const { createVendor, loading: isCreating } = useCreateVendor()
  const [updatingId, setUpdatingId] = useState('')

  const createModal = useDisclosure()
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formType, setFormType] = useState<VendorType>('bazaf')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  const resetForm = () => {
    setFormName('')
    setFormEmail('')
    setFormType('bazaf')
    setErrors({})
  }

  const closeCreateModal = () => {
    createModal.onClose()
    resetForm()
  }

  const handleCreate = async () => {
    const nextErrors: { name?: string; email?: string } = {}
    if (!formName.trim()) nextErrors.name = 'Nama vendor wajib diisi'
    if (!formEmail.trim()) {
      nextErrors.email = 'Email vendor wajib diisi'
    } else if (!isGmailAddress(formEmail)) {
      nextErrors.email = 'Email vendor harus menggunakan alamat @gmail.com'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    try {
      await createVendor({
        name: formName.trim(),
        email: formEmail.trim(),
        type: formType
      })
      toast({
        title: 'Vendor ditambahkan',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      closeCreateModal()
      refetch()
    } catch (err) {
      toast({
        title: 'Gagal menambahkan vendor',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

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
        actions={
          <Button
            colorScheme="brand"
            size="sm"
            leftIcon={<AddIcon />}
            onClick={createModal.onOpen}
          >
            Tambah Vendor
          </Button>
        }
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

      <Modal
        isOpen={createModal.isOpen}
        onClose={closeCreateModal}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Tambah vendor</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isInvalid={Boolean(errors.name)} isRequired>
                <FormLabel fontSize="sm">Nama vendor</FormLabel>
                <Input
                  size="sm"
                  placeholder="Nama vendor"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={Boolean(errors.email)} isRequired>
                <FormLabel fontSize="sm">Email</FormLabel>
                <Input
                  size="sm"
                  type="email"
                  placeholder="nama@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
                {!errors.email && (
                  <Text fontSize="xs" color="text-muted" mt={1}>
                    Hanya email @gmail.com yang diizinkan.
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Tipe</FormLabel>
                <Select
                  size="sm"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as VendorType)}
                >
                  {VENDOR_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={closeCreateModal}
              isDisabled={isCreating}
            >
              Batal
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleCreate}
              isLoading={isCreating}
              loadingText="Menyimpan..."
            >
              Simpan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  )
}
