'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { Search2Icon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import Link from 'next/link'

import {
  useBatchUpdateProducts,
  useGetProducts,
  useUpdateProductApproval,
  useUpdateProductFields,
  type IProductFieldsUpdate
} from '@/app/admin/(panel)/products/actions'
import { CardProduct, Layout } from '@/components'
import { EmptyState, PageHeader, StatusBadge } from '@/components/ui'
import { IProductResponse } from '@/interfaces/product'
import { currency } from '@/utils'

const APPROVAL_OPTIONS = [
  { value: '', label: 'Semua status' },
  { value: 'pending', label: 'Menunggu persetujuan' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' }
]

const CHANNEL_FILTER_OPTIONS = [
  { value: '', label: 'Semua kanal' },
  { value: 'pos', label: 'POS' },
  { value: 'online', label: 'Online' }
]

const BATCH_FIELDS = [
  { value: 'price', label: 'Harga jual' },
  { value: 'priceBase', label: 'HPP' },
  { value: 'stock', label: 'Stok' },
  { value: 'channels', label: 'Kanal' },
  { value: 'isActive', label: 'Status aktif' },
  { value: 'approvalStatus', label: 'Approval' }
]

const CHANNEL_MAP: Record<string, string[]> = {
  pos: ['pos'],
  online: ['online'],
  both: ['pos', 'online']
}

const PER_PAGE = 24

function ChannelBadge({ channels }: { channels?: string[] }) {
  const list = channels || []
  const hasPos = list.includes('pos')
  const hasOnline = list.includes('online')
  const { label, color } =
    hasPos && hasOnline
      ? { label: 'POS + Online', color: 'green' }
      : hasPos
        ? { label: 'POS', color: 'purple' }
        : hasOnline
          ? { label: 'Online', color: 'blue' }
          : { label: '-', color: 'gray' }
  return <StatusBadge color={color}>{label}</StatusBadge>
}

function EditableCell({
  value,
  onSave,
  format
}: {
  value: number
  // eslint-disable-next-line no-unused-vars
  onSave: (value: number) => Promise<void>
  // eslint-disable-next-line no-unused-vars
  format: (value: number) => string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!editing) setDraft(String(value ?? 0))
  }, [value, editing])

  const commit = async () => {
    setEditing(false)
    const num = Number(draft)
    if (draft === '' || Number.isNaN(num) || num === value) return
    setSaving(true)
    try {
      await onSave(num)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <Input
        size="sm"
        w="110px"
        type="number"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            ;(e.target as HTMLInputElement).blur()
          }
          if (e.key === 'Escape') setEditing(false)
        }}
      />
    )
  }

  return (
    <Text
      as="button"
      type="button"
      fontSize="sm"
      cursor="pointer"
      _hover={{ color: 'brand.600', textDecoration: 'underline' }}
      onClick={() => {
        setDraft(String(value ?? 0))
        setEditing(true)
      }}
    >
      {saving ? '...' : format(value ?? 0)}
    </Text>
  )
}

export default function ProductPage() {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const batchModal = useDisclosure()
  const [batchField, setBatchField] = useState('price')
  const [batchValue, setBatchValue] = useState('')

  const {
    data: products,
    loading: isFetching,
    error,
    refetch
  } = useGetProducts({
    q: query,
    channel: channelFilter || undefined
  })

  const { updateProductApproval } = useUpdateProductApproval()
  const { updateProductFields } = useUpdateProductFields()
  const { batchUpdateProducts } = useBatchUpdateProducts()
  const [approvingId, setApprovingId] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('admin-products-view')
    if (saved === 'grid' || saved === 'table') setViewMode(saved)
  }, [])

  const changeView = (mode: 'grid' | 'table') => {
    setViewMode(mode)
    localStorage.setItem('admin-products-view', mode)
  }

  const filtered = useMemo(() => {
    const list = products
      ? [...products].sort((a, b) =>
          new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1
        )
      : []
    if (!statusFilter) return list
    return list.filter(
      (product) => (product.approvalStatus || 'approved') === statusFilter
    )
  }, [products, statusFilter])

  const pendingCount = useMemo(
    () =>
      (products || []).filter(
        (product) => (product.approvalStatus || 'approved') === 'pending'
      ).length,
    [products]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE
  )

  const pageIds = paginated.map((product) => product.id)
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id))
  const someSelected = pageIds.some((id) => selectedIds.includes(id))

  const toggleAll = () => {
    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : Array.from(new Set([...prev, ...pageIds]))
    )
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter, channelFilter])

  const handleApproval = async (
    id: string,
    status: 'approved' | 'rejected'
  ) => {
    setApprovingId(id)
    try {
      await updateProductApproval(id, status)
      toast({
        title: status === 'approved' ? 'Produk disetujui' : 'Produk ditolak',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      refetch()
    } catch (err) {
      toast({
        title: 'Gagal memperbarui status produk',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setApprovingId('')
    }
  }

  const handleFieldSave = async (
    id: string,
    field: 'price' | 'priceBase' | 'stock',
    value: number
  ) => {
    try {
      await updateProductFields(id, { [field]: value })
      toast({
        title: 'Tersimpan',
        status: 'success',
        duration: 1500,
        isClosable: true
      })
      refetch()
    } catch (err) {
      toast({
        title: 'Gagal menyimpan',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const applyBatch = async () => {
    if (!selectedIds.length) return
    const fields: IProductFieldsUpdate = {}
    if (batchField === 'price') fields.price = Number(batchValue)
    if (batchField === 'priceBase') fields.priceBase = Number(batchValue)
    if (batchField === 'stock') fields.stock = Number(batchValue)
    if (batchField === 'channels')
      fields.channels = CHANNEL_MAP[batchValue] || ['pos']
    if (batchField === 'isActive') fields.isActive = batchValue === 'true'
    if (batchField === 'approvalStatus')
      fields.approvalStatus = batchValue as IProductFieldsUpdate['approvalStatus']

    try {
      await batchUpdateProducts(selectedIds, fields)
      toast({
        title: 'Berhasil',
        description: `${selectedIds.length} produk diperbarui`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      setSelectedIds([])
      setBatchValue('')
      batchModal.onClose()
      refetch()
    } catch (err) {
      toast({
        title: 'Gagal update massal',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const renderApprovalCell = (product: IProductResponse) => {
    const approval = product.approvalStatus || 'approved'
    return (
      <VStack align="start" spacing={1}>
        <StatusBadge
          color={
            approval === 'approved'
              ? 'green'
              : approval === 'pending'
                ? 'orange'
                : 'red'
          }
        >
          {approval === 'approved'
            ? 'Disetujui'
            : approval === 'pending'
              ? 'Menunggu'
              : 'Ditolak'}
        </StatusBadge>
        <StatusBadge color={product.isActive ? 'green' : 'gray'}>
          {product.isActive ? 'Aktif' : 'Nonaktif'}
        </StatusBadge>
      </VStack>
    )
  }

  return (
    <Layout error={error as Error} isFetching={isFetching}>
      <PageHeader
        title="Produk"
        subtitle={
          pendingCount > 0
            ? `${pendingCount} produk menunggu persetujuan`
            : 'Kelola produk yang dijual di Bazaf'
        }
        breadcrumbs={[
          { label: 'Dasbor', path: '/admin' },
          { label: 'Produk' }
        ]}
        actions={
          <HStack spacing={2}>
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'solid' : 'outline'}
              colorScheme={viewMode === 'grid' ? 'brand' : 'gray'}
              onClick={() => changeView('grid')}
            >
              Grid
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'solid' : 'outline'}
              colorScheme={viewMode === 'table' ? 'brand' : 'gray'}
              onClick={() => changeView('table')}
            >
              Tabel
            </Button>
            <Link href="/admin/products/add">
              <Button colorScheme="brand" size="sm">
                Tambah Produk
              </Button>
            </Link>
          </HStack>
        }
      />

      <HStack mb={5} gap={3} flexWrap="wrap">
        <InputGroup maxW="sm">
          <InputLeftElement pointerEvents="none">
            <Search2Icon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Cari produk..."
            bg="white"
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
        <Select
          maxW="200px"
          bg="white"
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
        >
          {CHANNEL_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          maxW="220px"
          bg="white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {APPROVAL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </HStack>

      {selectedIds.length > 0 && (
        <HStack
          bg="brand.50"
          border="1px solid"
          borderColor="brand.200"
          borderRadius="lg"
          p={3}
          mb={4}
          justify="space-between"
          flexWrap="wrap"
          gap={2}
        >
          <Text fontSize="sm" fontWeight="600">
            {selectedIds.length} produk dipilih
          </Text>
          <HStack spacing={2}>
            <Button size="sm" colorScheme="brand" onClick={batchModal.onOpen}>
              Edit massal
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
              Batal
            </Button>
          </HStack>
        </HStack>
      )}

      {!isFetching && filtered.length === 0 ? (
        <EmptyState
          title="Belum ada produk"
          description="Tambahkan produk pertama Anda untuk mulai menjual."
          action={
            <Link href="/admin/products/add">
              <Button colorScheme="brand" size="sm" mt={2}>
                Tambah Produk
              </Button>
            </Link>
          }
        />
      ) : viewMode === 'table' ? (
        <Box>
          <Box fontSize="sm" color="gray.500" mb={4}>
            {filtered.length} produk ditemukan
          </Box>
          <Box overflowX="auto" bg="white" borderRadius="xl" border="1px solid" borderColor="border-subtle">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th w="40px">
                    <Checkbox
                      isChecked={allSelected}
                      isIndeterminate={!allSelected && someSelected}
                      onChange={toggleAll}
                    />
                  </Th>
                  <Th>Produk</Th>
                  <Th>Kanal</Th>
                  <Th>Vendor</Th>
                  <Th isNumeric>Harga jual</Th>
                  <Th isNumeric>HPP</Th>
                  <Th isNumeric>Stok</Th>
                  <Th>Status</Th>
                  <Th>Aksi</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginated.map((product) => {
                  const approval = product.approvalStatus || 'approved'
                  return (
                    <Tr key={product.id} _hover={{ bg: 'gray.50' }}>
                      <Td>
                        <Checkbox
                          isChecked={selectedIds.includes(product.id)}
                          onChange={() => toggleOne(product.id)}
                        />
                      </Td>
                      <Td>
                        <Text fontWeight="600">{product.name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {product.sku || '-'}
                        </Text>
                      </Td>
                      <Td>
                        <ChannelBadge channels={product.channels} />
                      </Td>
                      <Td>
                        <Text fontSize="sm">{product.vendor?.name || '-'}</Text>
                      </Td>
                      <Td isNumeric>
                        <EditableCell
                          value={product.price}
                          format={currency.toIDRFormat}
                          onSave={(v) => handleFieldSave(product.id, 'price', v)}
                        />
                      </Td>
                      <Td isNumeric>
                        <EditableCell
                          value={product.priceBase}
                          format={currency.toIDRFormat}
                          onSave={(v) =>
                            handleFieldSave(product.id, 'priceBase', v)
                          }
                        />
                      </Td>
                      <Td isNumeric>
                        <EditableCell
                          value={product.stock}
                          format={(v) => String(v)}
                          onSave={(v) => handleFieldSave(product.id, 'stock', v)}
                        />
                      </Td>
                      <Td>{renderApprovalCell(product)}</Td>
                      <Td>
                        <HStack spacing={1}>
                          {approval === 'pending' && (
                            <>
                              <Button
                                size="xs"
                                colorScheme="brand"
                                isLoading={approvingId === product.id}
                                onClick={() =>
                                  handleApproval(product.id, 'approved')
                                }
                              >
                                Setujui
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="red"
                                variant="outline"
                                onClick={() =>
                                  handleApproval(product.id, 'rejected')
                                }
                              >
                                Tolak
                              </Button>
                            </>
                          )}
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Button size="xs" variant="outline" colorScheme="brand">
                              Ubah
                            </Button>
                          </Link>
                        </HStack>
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </Box>
        </Box>
      ) : (
        <Box>
          <Box fontSize="sm" color="gray.500" mb={4}>
            {filtered.length} produk ditemukan
          </Box>
          <Grid
            templateColumns={{
              base: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
              xl: 'repeat(4, 1fr)'
            }}
            gap={6}
          >
            {paginated.map((product) => (
              <GridItem key={product.id}>
                <VStack align="stretch" spacing={3}>
                  <CardProduct product={product} />
                  {(product.approvalStatus || 'approved') === 'pending' && (
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        colorScheme="brand"
                        flex="1"
                        isLoading={approvingId === product.id}
                        onClick={() => handleApproval(product.id, 'approved')}
                      >
                        Setujui
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        flex="1"
                        isDisabled={approvingId === product.id}
                        onClick={() => handleApproval(product.id, 'rejected')}
                      >
                        Tolak
                      </Button>
                    </HStack>
                  )}
                </VStack>
              </GridItem>
            ))}
          </Grid>
        </Box>
      )}

      {totalPages > 1 && (
        <HStack justify="center" spacing={3} mt={6}>
          <Button
            size="sm"
            variant="outline"
            isDisabled={safePage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Sebelumnya
          </Button>
          <Text fontSize="sm" color="gray.500">
            Halaman {safePage} dari {totalPages}
          </Text>
          <Button
            size="sm"
            variant="outline"
            isDisabled={safePage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Berikutnya
          </Button>
        </HStack>
      )}

      <Modal isOpen={batchModal.isOpen} onClose={batchModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit massal ({selectedIds.length} produk)</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel>Field</FormLabel>
                <Select
                  value={batchField}
                  onChange={(e) => {
                    setBatchField(e.target.value)
                    setBatchValue('')
                  }}
                >
                  {BATCH_FIELDS.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Nilai</FormLabel>
                {batchField === 'channels' ? (
                  <Select
                    value={batchValue}
                    onChange={(e) => setBatchValue(e.target.value)}
                    placeholder="Pilih kanal"
                  >
                    <option value="pos">POS saja</option>
                    <option value="online">Online saja</option>
                    <option value="both">POS + Online</option>
                  </Select>
                ) : batchField === 'isActive' ? (
                  <Select
                    value={batchValue}
                    onChange={(e) => setBatchValue(e.target.value)}
                    placeholder="Pilih status"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </Select>
                ) : batchField === 'approvalStatus' ? (
                  <Select
                    value={batchValue}
                    onChange={(e) => setBatchValue(e.target.value)}
                    placeholder="Pilih approval"
                  >
                    <option value="approved">Disetujui</option>
                    <option value="pending">Menunggu</option>
                    <option value="rejected">Ditolak</option>
                  </Select>
                ) : (
                  <Input
                    type="number"
                    value={batchValue}
                    onChange={(e) => setBatchValue(e.target.value)}
                    placeholder="Masukkan nilai"
                  />
                )}
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={batchModal.onClose}>
              Batal
            </Button>
            <Button
              colorScheme="brand"
              onClick={applyBatch}
              isDisabled={batchValue === ''}
            >
              Terapkan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  )
}
