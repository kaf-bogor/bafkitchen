'use client'

import React, { useMemo, useRef, useState } from 'react'

import { AddIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Stack,
  Text,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useGetCategories } from '@/app/admin/(panel)/categories/actions'
import { useGetVendors } from '@/app/admin/(panel)/vendors/actions'
import { Layout } from '@/components'
import {
  Card,
  CardBody,
  EmptyState,
  PageHeader,
  ResponsiveTable,
  StatCard,
  StatusBadge,
  type ResponsiveColumn
} from '@/components/ui'
import { IStockOpname } from '@/interfaces/stockOpname'

import {
  useCreateOpname,
  useDeleteOpname,
  useGetOpnames
} from './actions'

export default function StockOpnamePage() {
  const toast = useToast()
  const router = useRouter()
  const { data: opnames, loading, error, refetch } = useGetOpnames()
  const { data: vendors } = useGetVendors()
  const { data: categories } = useGetCategories()
  const { createOpname, loading: isCreating } = useCreateOpname()
  const { deleteOpname } = useDeleteOpname()

  const createModal = useDisclosure()
  const printModal = useDisclosure()
  const deleteDialog = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const [opnameDate, setOpnameDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [note, setNote] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [channel, setChannel] = useState('')
  const [inStock, setInStock] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<IStockOpname | null>(null)

  const stats = useMemo(() => {
    const list = opnames || []
    return {
      total: list.length,
      draft: list.filter((o) => o.status === 'draft').length,
      finalized: list.filter((o) => o.status === 'finalized').length,
      difference: list
        .filter((o) => o.status === 'finalized')
        .reduce((sum, o) => sum + (o.totalDifference || 0), 0)
    }
  }, [opnames])

  const buildFilterQuery = () => {
    const search = new URLSearchParams()
    if (vendorId) search.set('vendorId', vendorId)
    if (categoryId) search.set('categoryId', categoryId)
    if (channel) search.set('channel', channel)
    if (inStock) search.set('inStock', '1')
    return search.toString()
  }

  const handleCreate = async () => {
    try {
      const opname = await createOpname({
        opnameDate,
        note,
        filters: {
          vendorId: vendorId || undefined,
          categoryIds: categoryId ? [categoryId] : undefined,
          channel: channel || undefined,
          inStock
        }
      })
      toast({
        title: 'Sesi opname dibuat',
        description: opname?.opnameNumber,
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      createModal.onClose()
      if (opname) router.push(`/admin/inventory/opname/${opname.id}`)
    } catch (err) {
      toast({
        title: 'Gagal membuat sesi opname',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const handlePrint = () => {
    const qs = buildFilterQuery()
    window.open(`/print/opname${qs ? `?${qs}` : ''}`, '_blank')
    printModal.onClose()
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteOpname(pendingDelete.id)
      toast({ title: 'Sesi opname dihapus', status: 'success', duration: 3000 })
      setPendingDelete(null)
      deleteDialog.onClose()
      refetch()
    } catch (err) {
      toast({
        title: 'Gagal menghapus',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const filterFields = (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
      <FormControl>
        <FormLabel fontSize="sm">Vendor</FormLabel>
        <Select
          size="sm"
          placeholder="Semua vendor"
          value={vendorId}
          onChange={(e) => setVendorId(e.target.value)}
        >
          {(vendors || []).map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel fontSize="sm">Kategori</FormLabel>
        <Select
          size="sm"
          placeholder="Semua kategori"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {(categories || []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel fontSize="sm">Kanal</FormLabel>
        <Select
          size="sm"
          placeholder="Semua kanal"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        >
          <option value="pos">POS</option>
          <option value="online">Online</option>
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel fontSize="sm">Stok</FormLabel>
        <Checkbox
          size="sm"
          isChecked={inStock}
          onChange={(e) => setInStock(e.target.checked)}
        >
          Hanya produk dengan stok &gt; 0
        </Checkbox>
      </FormControl>
    </SimpleGrid>
  )

  const columns: ResponsiveColumn<IStockOpname>[] = [
    {
      key: 'number',
      header: 'No. Opname',
      render: (row) => <Text fontWeight="600">{row.opnameNumber}</Text>
    },
    {
      key: 'date',
      header: 'Tanggal',
      render: (row) =>
        row.opnameDate
          ? format(new Date(row.opnameDate), 'dd MMM yyyy', { locale: id })
          : '-'
    },
    {
      key: 'products',
      header: 'Jumlah produk',
      isNumeric: true,
      render: (row) => row.totalProducts
    },
    {
      key: 'difference',
      header: 'Total selisih',
      isNumeric: true,
      render: (row) => (
        <Text
          fontWeight="600"
          color={
            row.status === 'draft'
              ? 'text-muted'
              : row.totalDifference < 0
                ? 'red.500'
                : row.totalDifference > 0
                  ? 'green.600'
                  : 'text-body'
          }
        >
          {row.status === 'draft'
            ? '-'
            : `${row.totalDifference > 0 ? '+' : ''}${row.totalDifference}`}
        </Text>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge color={row.status === 'finalized' ? 'green' : 'orange'}>
          {row.status === 'finalized' ? 'Selesai' : 'Draft'}
        </StatusBadge>
      )
    }
  ]

  const renderActions = (row: IStockOpname) => (
    <HStack spacing={1} justify="flex-end">
      <Link href={`/admin/inventory/opname/${row.id}`}>
        <IconButton
          aria-label="Lihat sesi"
          icon={<ViewIcon />}
          size="sm"
          variant="outline"
          colorScheme="brand"
        />
      </Link>
      {row.status === 'draft' && (
        <IconButton
          aria-label="Hapus sesi"
          icon={<DeleteIcon />}
          size="sm"
          variant="outline"
          colorScheme="red"
          onClick={() => {
            setPendingDelete(row)
            deleteDialog.onOpen()
          }}
        />
      )}
    </HStack>
  )

  return (
    <Layout error={error as Error} isFetching={loading}>
      <PageHeader
        title="Stok Opname"
        subtitle="Hitung stok fisik dan sesuaikan dengan sistem"
        breadcrumbs={[
          { label: 'Dasbor', path: '/admin' },
          { label: 'Stok Opname' }
        ]}
        actions={
          <HStack spacing={2}>
            <Button
              size="sm"
              variant="outline"
              colorScheme="brand"
              onClick={printModal.onOpen}
            >
              Cetak checklist
            </Button>
            <Button
              size="sm"
              colorScheme="brand"
              leftIcon={<AddIcon />}
              onClick={createModal.onOpen}
            >
              Buat opname
            </Button>
          </HStack>
        }
      />

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={5} mb={6}>
        <StatCard label="Total sesi" value={String(stats.total)} tone="brand" />
        <StatCard label="Draft" value={String(stats.draft)} tone="orange" />
        <StatCard
          label="Selesai"
          value={String(stats.finalized)}
          tone="green"
        />
        <StatCard
          label="Total selisih"
          value={String(stats.difference)}
          sublabel="Sesi selesai"
          tone="gray"
        />
      </SimpleGrid>

      <Card>
        <CardBody p={0}>
          <ResponsiveTable
            columns={columns}
            rows={opnames}
            getRowKey={(row) => row.id}
            mobileTitleKey="number"
            mobileSubtitleKey="date"
            actions={renderActions}
            emptyState={
              <EmptyState
                title="Belum ada sesi opname"
                description="Buat sesi untuk mulai menghitung stok fisik."
                action={
                  <Button
                    colorScheme="brand"
                    size="sm"
                    mt={2}
                    onClick={createModal.onOpen}
                  >
                    Buat opname
                  </Button>
                }
              />
            }
          />
        </CardBody>
      </Card>

      <Modal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        isCentered
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Buat sesi opname</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Tanggal opname</FormLabel>
                <Input
                  type="date"
                  size="sm"
                  value={opnameDate}
                  onChange={(e) => setOpnameDate(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Catatan</FormLabel>
                <Input
                  size="sm"
                  placeholder="Opsional"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </FormControl>
              <Text fontSize="sm" fontWeight="600">
                Filter produk
              </Text>
              {filterFields}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={createModal.onClose}
              isDisabled={isCreating}
            >
              Batal
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleCreate}
              isLoading={isCreating}
              loadingText="Membuat..."
            >
              Buat & mulai hitung
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={printModal.isOpen}
        onClose={printModal.onClose}
        isCentered
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Cetak checklist stok</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <Text fontSize="sm" color="text-muted">
                Checklist berisi stok sistem dan kolom kosong untuk diisi saat
                pengecekan fisik.
              </Text>
              {filterFields}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={printModal.onClose}>
              Batal
            </Button>
            <Button colorScheme="brand" onClick={handlePrint}>
              Buka halaman cetak
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={deleteDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="600">
              Hapus sesi opname
            </AlertDialogHeader>
            <AlertDialogBody color="text-body">
              Hapus sesi <strong>{pendingDelete?.opnameNumber}</strong>? Tindakan
              ini tidak bisa dibatalkan.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={deleteDialog.onClose}>
                Batal
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Hapus
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  )
}
