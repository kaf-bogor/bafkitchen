'use client'

import React, { useMemo, useRef, useState } from 'react'

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  HStack,
  SimpleGrid,
  Text,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'

import {
  useDeletePurchase,
  useGetPurchases
} from '@/app/admin/(panel)/purchases/actions'
import { Layout } from '@/components'
import {
  EmptyState,
  PageHeader,
  ResponsiveTable,
  StatCard,
  type ResponsiveColumn
} from '@/components/ui'
import { IPurchase } from '@/interfaces/purchase'
import { currency } from '@/utils'

export default function PurchasesPage() {
  const toast = useToast()
  const { data: purchases, loading, error, refetch } = useGetPurchases()
  const { deletePurchase, loading: isDeleting } = useDeletePurchase()

  const [selected, setSelected] = useState<IPurchase | null>(null)
  const deleteDialog = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const totals = useMemo(
    () =>
      purchases.reduce(
        (acc, purchase) => {
          acc.cost += purchase.totalCost
          acc.margin += purchase.totalMargin
          acc.qty += purchase.totalQty
          return acc
        },
        { cost: 0, margin: 0, qty: 0 }
      ),
    [purchases]
  )

  const confirmDelete = (purchase: IPurchase) => {
    setSelected(purchase)
    deleteDialog.onOpen()
  }

  const handleDelete = async () => {
    if (!selected) return
    try {
      await deletePurchase(selected.id)
      toast({
        title: 'Nota pembelian dihapus',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      deleteDialog.onClose()
      refetch()
    } catch (err) {
      toast({
        title: 'Gagal menghapus nota',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const columns: ResponsiveColumn<IPurchase>[] = [
    {
      key: 'purchaseNumber',
      header: 'No. Nota',
      render: (row) => (
        <Text fontWeight="600">{row.purchaseNumber || '-'}</Text>
      )
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (row) => <Text fontSize="sm">{row.supplier || '-'}</Text>
    },
    {
      key: 'purchaseDate',
      header: 'Tanggal',
      render: (row) =>
        row.purchaseDate
          ? format(new Date(row.purchaseDate), 'dd MMM yyyy', { locale: id })
          : '-'
    },
    {
      key: 'items',
      header: 'Item',
      isNumeric: true,
      render: (row) => `${row.items.length} produk · ${row.totalQty} qty`
    },
    {
      key: 'totalCost',
      header: 'Total belanja',
      isNumeric: true,
      render: (row) => currency.toIDRFormat(row.totalCost)
    },
    {
      key: 'totalMargin',
      header: 'Potensi laba',
      isNumeric: true,
      render: (row) => (
        <Text fontWeight="600" color="brand.700">
          {currency.toIDRFormat(row.totalMargin)}
        </Text>
      )
    }
  ]

  return (
    <Layout error={error as Error} isFetching={loading}>
      <PageHeader
        title="Pembelian"
        subtitle="Catat belanja barang beserta HPP dan harga jualnya"
        breadcrumbs={[
          { label: 'Dasbor', path: '/admin' },
          { label: 'Pembelian' }
        ]}
        actions={
          <HStack spacing={2}>
            <Link href="/admin/purchases/batches">
              <Button variant="outline" colorScheme="brand" size="sm">
                Batch stok
              </Button>
            </Link>
            <Link href="/admin/purchases/new">
              <Button colorScheme="brand" size="sm">
                Tambah Pembelian
              </Button>
            </Link>
          </HStack>
        }
      />

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={5} mb={6}>
        <StatCard
          label="Total belanja"
          value={currency.toIDRFormat(totals.cost)}
          sublabel={`${purchases.length} nota`}
          tone="gray"
        />
        <StatCard
          label="Total qty"
          value={String(totals.qty)}
          sublabel="Barang masuk"
          tone="brand"
        />
        <StatCard
          label="Potensi laba"
          value={currency.toIDRFormat(totals.margin)}
          sublabel="(harga jual − HPP) × qty"
          tone="green"
        />
      </SimpleGrid>

      <ResponsiveTable
        columns={columns}
        rows={purchases}
        getRowKey={(row) => row.id}
        mobileTitleKey="purchaseNumber"
        mobileSubtitleKey="supplier"
        actions={(row) => (
          <HStack spacing={1} justify="flex-end">
            <Link href={`/admin/purchases/${row.id}`}>
              <Button size="xs" variant="outline" colorScheme="brand">
                Detail
              </Button>
            </Link>
            <Button
              size="xs"
              variant="ghost"
              colorScheme="red"
              onClick={() => confirmDelete(row)}
            >
              Hapus
            </Button>
          </HStack>
        )}
        emptyState={
          <EmptyState
            title="Belum ada pembelian"
            description="Catat pembelian pertama untuk mulai melacak HPP per batch."
            action={
              <Link href="/admin/purchases/new">
                <Button colorScheme="brand" size="sm" mt={2}>
                  Tambah Pembelian
                </Button>
              </Link>
            }
          />
        }
      />

      <AlertDialog
        isOpen={deleteDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Hapus nota pembelian?
            </AlertDialogHeader>
            <AlertDialogBody>
              Stok produk akan dikurangi kembali sesuai qty pada nota{' '}
              <b>{selected?.purchaseNumber}</b>. Tindakan ini tidak bisa
              dibatalkan.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={deleteDialog.onClose}>
                Batal
              </Button>
              <Button
                colorScheme="red"
                ml={3}
                isLoading={isDeleting}
                onClick={handleDelete}
              >
                Hapus
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  )
}
