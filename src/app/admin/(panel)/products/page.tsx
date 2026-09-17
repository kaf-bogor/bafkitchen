'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { Search2Icon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Grid,
  GridItem,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Text,
  VStack,
  useToast
} from '@chakra-ui/react'
import Link from 'next/link'

import {
  useGetProducts,
  useUpdateProductApproval
} from '@/app/admin/(panel)/products/actions'
import { CardProduct, Layout } from '@/components'
import { EmptyState, PageHeader } from '@/components/ui'

const APPROVAL_OPTIONS = [
  { value: '', label: 'Semua status' },
  { value: 'pending', label: 'Menunggu persetujuan' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' }
]

export default function ProductPage() {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const {
    data: products,
    loading: isFetching,
    error,
    refetch
  } = useGetProducts({ q: query })

  const { updateProductApproval } = useUpdateProductApproval()
  const [approvingId, setApprovingId] = useState('')

  const sortProducts = (a: any, b: any) =>
    new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1

  const filtered = useMemo(() => {
    const list = products ? [...products].sort(sortProducts) : []
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

  const PER_PAGE = 24
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE
  )

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter])

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
          <Link href="/admin/products/add">
            <Button colorScheme="brand" size="sm">
              Tambah Produk
            </Button>
          </Link>
        }
      />

      <HStack mb={5} gap={3} maxW="lg">
        <InputGroup>
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
        </Box>
      )}
    </Layout>
  )
}
