'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

import { EditIcon, Search2Icon } from '@chakra-ui/icons'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Grid,
  GridItem,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Switch,
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
  useBulkUpdateProducts,
  useGetProducts,
  useUpdateProductApproval,
  type IProductFieldsUpdate
} from '@/app/admin/(panel)/products/actions'
import { CardProduct, Layout } from '@/components'
import { EmptyState, PageHeader, StatCard, StatusBadge } from '@/components/ui'
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

const CHANNEL_MAP: Record<string, string[]> = {
  pos: ['pos'],
  online: ['online'],
  both: ['pos', 'online']
}

const DRAFT_KEY = 'admin-products-edit-draft'
const EDIT_MODE_KEY = 'admin-products-edit-mode'
const PER_PAGE = 24

type Draft = Record<string, IProductFieldsUpdate>

const channelKey = (channels?: string[]) => {
  const list = channels || []
  const hasPos = list.includes('pos')
  const hasOnline = list.includes('online')
  if (hasPos && hasOnline) return 'both'
  if (hasOnline) return 'online'
  return 'pos'
}

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

function DraftNumberInput({
  value,
  onChange
}: {
  value: number
  // eslint-disable-next-line no-unused-vars
  onChange: (value: number) => void
}) {
  const [text, setText] = useState(String(value ?? 0))

  useEffect(() => {
    setText(String(value ?? 0))
  }, [value])

  return (
    <Input
      size="sm"
      w="110px"
      type="number"
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        const num = Number(e.target.value)
        if (e.target.value !== '' && !Number.isNaN(num)) onChange(num)
      }}
      onBlur={() => {
        if (text === '') setText(String(value ?? 0))
      }}
    />
  )
}

export default function ProductPage() {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft] = useState<Draft>({})
  const [hydrated, setHydrated] = useState(false)

  const discardDialog = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

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
  const { bulkUpdateProducts, loading: isSaving } = useBulkUpdateProducts()
  const [approvingId, setApprovingId] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('admin-products-view')
    if (saved === 'grid' || saved === 'table') setViewMode(saved)
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      if (parsed && typeof parsed === 'object') {
        setDraft(parsed)
        if (Object.keys(parsed).length) {
          setEditMode(localStorage.getItem(EDIT_MODE_KEY) === 'true')
        }
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    localStorage.setItem(EDIT_MODE_KEY, String(editMode))
  }, [draft, editMode, hydrated])

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (Object.keys(draft).length) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [draft])

  const changeView = (mode: 'grid' | 'table') => {
    setViewMode(mode)
    localStorage.setItem('admin-products-view', mode)
  }

  const changeCount = Object.keys(draft).length

  const setField = (
    product: IProductResponse,
    field: keyof IProductFieldsUpdate,
    value: unknown
  ) => {
    setDraft((prev) => {
      const next = { ...prev }
      const entry: Record<string, unknown> = { ...(prev[product.id] || {}) }
      let same = false
      if (field === 'price') same = value === product.price
      else if (field === 'priceBase') same = value === product.priceBase
      else if (field === 'stock') same = value === product.stock
      else if (field === 'isActive') same = value === product.isActive
      else if (field === 'channels') {
        const a = ((value as string[]) || []).slice().sort().join(',')
        const b = (product.channels || []).slice().sort().join(',')
        same = a === b
      }
      if (same) delete entry[field]
      else entry[field] = value
      if (Object.keys(entry).length) next[product.id] = entry as IProductFieldsUpdate
      else delete next[product.id]
      return next
    })
  }

  const handleSave = async () => {
    const items = Object.entries(draft).map(([id, fields]) => ({ id, fields }))
    if (!items.length) return
    try {
      const res = await bulkUpdateProducts(items)
      setDraft({})
      toast({
        title: 'Perubahan tersimpan',
        description: `${res.updated} produk diperbarui`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      refetch()
    } catch (err) {
      toast({
        title: 'Gagal menyimpan perubahan',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const doDiscard = () => {
    setDraft({})
    discardDialog.onClose()
  }

  const toggleEditMode = () => {
    if (editMode) {
      setEditMode(false)
      return
    }
    setViewMode('table')
    localStorage.setItem('admin-products-view', 'table')
    setEditMode(true)
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

  const assetValueOf = (product: IProductResponse) => {
    const stock = draft[product.id]?.stock ?? product.stock ?? 0
    const priceBase = draft[product.id]?.priceBase ?? product.priceBase ?? 0
    return stock * priceBase
  }

  const totalAsset = useMemo(
    () => filtered.reduce((sum, product) => sum + assetValueOf(product), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, draft]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE
  )

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

  const renderStatusCell = (product: IProductResponse) => {
    const approval = product.approvalStatus || 'approved'
    const active = draft[product.id]?.isActive ?? product.isActive
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
        {editMode ? (
          <HStack spacing={2}>
            <Switch
              size="sm"
              isChecked={active}
              onChange={(e) => setField(product, 'isActive', e.target.checked)}
            />
            <Text fontSize="xs" color="gray.600">
              {active ? 'Aktif' : 'Nonaktif'}
            </Text>
          </HStack>
        ) : (
          <StatusBadge color={active ? 'green' : 'gray'}>
            {active ? 'Aktif' : 'Nonaktif'}
          </StatusBadge>
        )}
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
            {!editMode && (
              <>
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
              </>
            )}
            <Button
              size="sm"
              variant={editMode ? 'solid' : 'outline'}
              colorScheme={editMode ? 'brand' : 'gray'}
              leftIcon={<EditIcon />}
              onClick={toggleEditMode}
            >
              {editMode ? 'Keluar mode edit' : 'Mode edit'}
            </Button>
            <Link href="/admin/products/add">
              <Button colorScheme="brand" size="sm">
                Tambah Produk
              </Button>
            </Link>
          </HStack>
        }
      />

      <Box mb={5} maxW={{ base: 'full', sm: 'sm' }}>
        <StatCard
          label="Total nilai aset (HPP)"
          value={currency.toIDRFormat(totalAsset)}
          sublabel={`${filtered.length} produk · stok × HPP`}
          tone="brand"
        />
      </Box>

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

      {editMode && (
        <HStack
          position="sticky"
          top={2}
          zIndex={10}
          bg="yellow.50"
          border="1px solid"
          borderColor="yellow.300"
          borderRadius="lg"
          p={3}
          mb={4}
          justify="space-between"
          flexWrap="wrap"
          gap={2}
        >
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" fontWeight="600">
              Mode edit · {changeCount} perubahan belum disimpan
            </Text>
            <Text fontSize="xs" color="gray.600">
              Edit nilai langsung di tabel, lalu klik Simpan. Perubahan
              tersimpan otomatis di perangkat ini.
            </Text>
          </VStack>
          <HStack spacing={2}>
            <Button
              size="sm"
              colorScheme="brand"
              onClick={handleSave}
              isLoading={isSaving}
              isDisabled={!changeCount}
            >
              Simpan
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={discardDialog.onOpen}
              isDisabled={!changeCount}
            >
              Batal
            </Button>
            <Button size="sm" variant="ghost" onClick={toggleEditMode}>
              Keluar
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
          <Box
            overflowX="auto"
            bg="white"
            borderRadius="xl"
            border="1px solid"
            borderColor="border-subtle"
          >
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Produk</Th>
                  <Th>Kanal</Th>
                  <Th>Vendor</Th>
                  <Th isNumeric>Harga jual</Th>
                  <Th isNumeric>HPP</Th>
                  <Th isNumeric>Stok</Th>
                  <Th isNumeric>Nilai aset</Th>
                  <Th>Status</Th>
                  <Th>Aksi</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginated.map((product) => {
                  const approval = product.approvalStatus || 'approved'
                  const changed = Boolean(draft[product.id])
                  return (
                    <Tr
                      key={product.id}
                      bg={changed ? 'yellow.50' : undefined}
                      _hover={{ bg: changed ? 'yellow.100' : 'gray.50' }}
                    >
                      <Td>
                        <HStack spacing={2}>
                          {changed && (
                            <Box
                              w="6px"
                              h="6px"
                              borderRadius="full"
                              bg="orange.400"
                              flexShrink={0}
                            />
                          )}
                          <Box>
                            <Text fontWeight="600">{product.name}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {product.sku || '-'}
                            </Text>
                          </Box>
                        </HStack>
                      </Td>
                      <Td>
                        {editMode ? (
                          <Select
                            size="sm"
                            w="140px"
                            value={channelKey(
                              draft[product.id]?.channels ?? product.channels
                            )}
                            onChange={(e) =>
                              setField(
                                product,
                                'channels',
                                CHANNEL_MAP[e.target.value] || ['pos']
                              )
                            }
                          >
                            <option value="pos">POS</option>
                            <option value="online">Online</option>
                            <option value="both">POS + Online</option>
                          </Select>
                        ) : (
                          <ChannelBadge channels={product.channels} />
                        )}
                      </Td>
                      <Td>
                        <Text fontSize="sm">{product.vendor?.name || '-'}</Text>
                      </Td>
                      <Td isNumeric>
                        {editMode ? (
                          <DraftNumberInput
                            value={draft[product.id]?.price ?? product.price}
                            onChange={(v) => setField(product, 'price', v)}
                          />
                        ) : (
                          <Text fontSize="sm">
                            {currency.toIDRFormat(product.price ?? 0)}
                          </Text>
                        )}
                      </Td>
                      <Td isNumeric>
                        {editMode ? (
                          <DraftNumberInput
                            value={
                              draft[product.id]?.priceBase ?? product.priceBase
                            }
                            onChange={(v) => setField(product, 'priceBase', v)}
                          />
                        ) : (
                          <Text fontSize="sm">
                            {currency.toIDRFormat(product.priceBase ?? 0)}
                          </Text>
                        )}
                      </Td>
                      <Td isNumeric>
                        {editMode ? (
                          <DraftNumberInput
                            value={draft[product.id]?.stock ?? product.stock}
                            onChange={(v) => setField(product, 'stock', v)}
                          />
                        ) : (
                          <Text fontSize="sm">{product.stock ?? 0}</Text>
                        )}
                      </Td>
                      <Td isNumeric>
                        <Text fontSize="sm">
                          {currency.toIDRFormat(assetValueOf(product))}
                        </Text>
                      </Td>
                      <Td>{renderStatusCell(product)}</Td>
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
                            <Button
                              size="xs"
                              variant="outline"
                              colorScheme="brand"
                            >
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

      <AlertDialog
        isOpen={discardDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={discardDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Buang perubahan?
            </AlertDialogHeader>
            <AlertDialogBody>
              {changeCount} perubahan yang belum disimpan akan dihapus dan tidak
              bisa dikembalikan.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={discardDialog.onClose}>
                Lanjutkan edit
              </Button>
              <Button colorScheme="red" onClick={doDiscard} ml={3}>
                Buang
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  )
}
