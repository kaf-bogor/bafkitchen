'use client'

import React, { useMemo, useRef, useState } from 'react'

import { Search2Icon } from '@chakra-ui/icons'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  SimpleGrid,
  Text,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'
import { FiMoreVertical } from 'react-icons/fi'

import Layout from '@/components/Layout'
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  MobileFilterSheet,
  PageHeader,
  Price,
  ResponsiveTable,
  StatusBadge,
  type ResponsiveColumn
} from '@/components/ui'
import {
  invoiceStatusColors,
  invoiceStatusMessages,
  EInvoiceStatus,
  IInvoice
} from '@/interfaces/invoice'
import { exportInvoicesToCSV } from '@/utils/exportCSV'
import { exportInvoicesListToPDF } from '@/utils/exportPDF'

import { useGetInvoices, useUpdateInvoiceStatus } from './actions'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function InvoicesPage() {
  const toast = useToast()

  const {
    data: invoices,
    loading: isFetching,
    error,
    refetch
  } = useGetInvoices()
  const { updateInvoiceStatus } = useUpdateInvoiceStatus()

  const settleDialog = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [vendorFilter, setVendorFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [customDateStart, setCustomDateStart] = useState('')
  const [customDateEnd, setCustomDateEnd] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [updatingId, setUpdatingId] = useState('')
  const [pendingInvoice, setPendingInvoice] = useState<IInvoice | null>(null)

  const vendorOptions = useMemo(() => {
    const map = new Map<string, string>()
    ;(invoices || []).forEach((invoice) => {
      if (invoice.vendorId && !map.has(invoice.vendorId)) {
        map.set(invoice.vendorId, invoice.vendorName)
      }
    })
    return Array.from(map.entries())
      .map(([vendorId, name]) => ({ id: vendorId, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [invoices])

  const filteredInvoices = useMemo(() => {
    if (!invoices?.length) return []
    let filtered = [...invoices]

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(q) ||
          invoice.vendorName.toLowerCase().includes(q)
      )
    }

    if (statusFilter) {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter)
    }

    if (vendorFilter) {
      filtered = filtered.filter((invoice) => invoice.vendorId === vendorFilter)
    }

    if (dateFilter !== 'all') {
      const now = new Date()
      let startDate: Date
      let endDate: Date = now

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'custom':
          if (customDateStart && customDateEnd) {
            startDate = new Date(customDateStart)
            endDate = new Date(customDateEnd)
            endDate.setHours(23, 59, 59, 999)
          } else {
            startDate = new Date(0)
          }
          break
        default:
          startDate = new Date(0)
      }

      filtered = filtered.filter((invoice) => {
        const invoiceDate = new Date(invoice.issuedDate)
        return invoiceDate >= startDate && invoiceDate <= endDate
      })
    }

    return filtered
  }, [
    invoices,
    query,
    statusFilter,
    vendorFilter,
    dateFilter,
    customDateStart,
    customDateEnd
  ])

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedInvoices = filteredInvoices.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  )

  const resetPage = () => setCurrentPage(1)

  const handleStatusUpdate = async (
    invoiceId: string,
    newStatus: EInvoiceStatus
  ) => {
    setUpdatingId(invoiceId)
    try {
      await updateInvoiceStatus({
        invoiceId,
        status: newStatus,
        settledDate:
          newStatus === EInvoiceStatus.SETTLED
            ? new Date().toISOString()
            : undefined
      })

      toast({
        title: 'Status invoice diperbarui',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      await refetch()
    } catch (err) {
      toast({
        title: 'Gagal memperbarui status invoice',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setUpdatingId('')
    }
  }

  const confirmSettle = async () => {
    if (!pendingInvoice) return
    await handleStatusUpdate(pendingInvoice.id, EInvoiceStatus.SETTLED)
    setPendingInvoice(null)
    settleDialog.onClose()
  }

  const handleExportCSV = () => {
    exportInvoicesToCSV(filteredInvoices)
    toast({ title: 'Export CSV dibuat', status: 'success', duration: 3000 })
  }

  const handleExportPDF = () => {
    try {
      exportInvoicesListToPDF(filteredInvoices)
      toast({ title: 'Export PDF dibuat', status: 'success', duration: 3000 })
    } catch (err) {
      toast({
        title: 'Gagal export PDF',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const renderPageNumbers = () => {
    const pages: number[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else if (safePage <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i)
    } else if (safePage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
    } else {
      for (let i = safePage - 2; i <= safePage + 2; i++) pages.push(i)
    }
    return pages
  }

  const renderInvoiceActions = (invoice: IInvoice) => (
    <Menu placement="bottom-end">
      <MenuButton
        as={IconButton}
        aria-label="Aksi"
        icon={<FiMoreVertical />}
        variant="ghost"
        size="sm"
        isLoading={updatingId === invoice.id}
      />
      <MenuList>
        <MenuItem as={Link} href={`/admin/invoices/${invoice.id}`}>
          Rincian
        </MenuItem>
        {invoice.status === EInvoiceStatus.ISSUED && (
          <MenuItem
            onClick={() => {
              setPendingInvoice(invoice)
              settleDialog.onOpen()
            }}
          >
            Tandai lunas
          </MenuItem>
        )}
      </MenuList>
    </Menu>
  )

  const columns: ResponsiveColumn<IInvoice>[] = [
    {
      key: 'invoice',
      header: 'No. Invoice',
      render: (invoice) => (
        <Text fontWeight="600">{invoice.invoiceNumber}</Text>
      )
    },
    {
      key: 'issued',
      header: 'Tanggal terbit',
      render: (invoice) => (
        <Text fontSize="sm">
          {format(new Date(invoice.issuedDate), 'dd MMM yyyy', { locale: id })}
        </Text>
      )
    },
    {
      key: 'vendor',
      header: 'Vendor',
      render: (invoice) => invoice.vendorName
    },
    {
      key: 'order',
      header: 'No. Order',
      mobileLabel: 'Order',
      render: (invoice) => (
        <Link href={`/admin/orders/${invoice.orderId}`}>
          {invoice.orderId.substring(0, 8)}...
        </Link>
      )
    },
    {
      key: 'total',
      header: 'Total',
      isNumeric: true,
      render: (invoice) => <Price value={invoice.totalAmount} size="sm" />
    },
    {
      key: 'due',
      header: 'Jatuh tempo',
      render: (invoice) => {
        const isDueToday =
          new Date(invoice.dueDate).toDateString() === new Date().toDateString()
        const isOverdue =
          new Date(invoice.dueDate) < new Date() &&
          invoice.status !== EInvoiceStatus.SETTLED
        return (
          <HStack spacing={2} flexWrap="nowrap" justify="flex-end">
            <Text
              fontSize="sm"
              color={
                isDueToday ? 'orange.500' : isOverdue ? 'red.500' : 'text-body'
              }
              fontWeight={isDueToday || isOverdue ? '600' : 'normal'}
            >
              {format(new Date(invoice.dueDate), 'dd MMM yyyy', { locale: id })}
            </Text>
            {isOverdue && (
              <StatusBadge color="red" px={2} py={0.5} fontSize="2xs">
                Terlambat
              </StatusBadge>
            )}
            {isDueToday && (
              <StatusBadge color="orange" px={2} py={0.5} fontSize="2xs">
                Hari ini
              </StatusBadge>
            )}
          </HStack>
        )
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (invoice) => (
        <StatusBadge color={invoiceStatusColors[invoice.status]}>
          {invoiceStatusMessages[invoice.status]}
        </StatusBadge>
      )
    }
  ]

  const activeFilterCount = [
    statusFilter,
    vendorFilter,
    dateFilter !== 'all' ? dateFilter : ''
  ].filter(Boolean).length

  const filterFields = (
    <>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <FormControl>
          <FormLabel fontSize="sm">Pencarian</FormLabel>
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <Search2Icon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="No. invoice / vendor"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                resetPage()
              }}
            />
          </InputGroup>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm">Filter status</FormLabel>
          <Select
            size="sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              resetPage()
            }}
          >
            <option value="">Semua status</option>
            {Object.values(EInvoiceStatus).map((status) => (
              <option key={status} value={status}>
                {invoiceStatusMessages[status]}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm">Filter vendor</FormLabel>
          <Select
            size="sm"
            placeholder="Semua vendor"
            value={vendorFilter}
            onChange={(e) => {
              setVendorFilter(e.target.value)
              resetPage()
            }}
          >
            {vendorOptions.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm">Filter tanggal</FormLabel>
          <Select
            size="sm"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value)
              resetPage()
            }}
          >
            <option value="all">Semua waktu</option>
            <option value="today">Hari ini</option>
            <option value="week">7 hari terakhir</option>
            <option value="month">Bulan ini</option>
            <option value="custom">Rentang kustom</option>
          </Select>
        </FormControl>
      </SimpleGrid>

      {dateFilter === 'custom' && (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
          <FormControl>
            <FormLabel fontSize="sm">Tanggal mulai</FormLabel>
            <Input
              type="date"
              size="sm"
              value={customDateStart}
              onChange={(e) => {
                setCustomDateStart(e.target.value)
                resetPage()
              }}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm">Tanggal selesai</FormLabel>
            <Input
              type="date"
              size="sm"
              value={customDateEnd}
              onChange={(e) => {
                setCustomDateEnd(e.target.value)
                resetPage()
              }}
            />
          </FormControl>
        </SimpleGrid>
      )}
    </>
  )

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      <PageHeader
        title="Invoice"
        subtitle="Kelola invoice vendor"
        breadcrumbs={[
          { label: 'Dasbor', path: '/admin' },
          { label: 'Invoice' }
        ]}
        actions={
          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              variant="outline"
              colorScheme="brand"
              isDisabled={!filteredInvoices.length}
            >
              Export
            </MenuButton>
            <MenuList>
              <MenuItem onClick={handleExportCSV}>Export CSV</MenuItem>
              <MenuItem onClick={handleExportPDF}>Export PDF</MenuItem>
            </MenuList>
          </Menu>
        }
      />

      {/* Filters (desktop) */}
      <Card mb={5} display={{ base: 'none', md: 'block' }}>
        <CardBody>{filterFields}</CardBody>
      </Card>

      {/* Filters (mobile) */}
      <Flex display={{ base: 'flex', md: 'none' }} mb={4}>
        <MobileFilterSheet activeCount={activeFilterCount}>
          {filterFields}
        </MobileFilterSheet>
      </Flex>

      {/* Table */}
      <Card>
        <CardHeader
          title="Daftar invoice"
          description={`${filteredInvoices.length} invoice`}
        />
        <CardBody p={0}>
          <ResponsiveTable
            columns={columns}
            rows={paginatedInvoices}
            getRowKey={(invoice) => invoice.id}
            mobileTitleKey="invoice"
            mobileSubtitleKey="vendor"
            actions={renderInvoiceActions}
            emptyState={
              <EmptyState
                title="Tidak ada invoice"
                description="Belum ada invoice yang cocok dengan filter saat ini."
              />
            }
          />
        </CardBody>
      </Card>

      {/* Pagination */}
      {filteredInvoices.length > 0 && (
        <Flex
          justify="space-between"
          align="center"
          mt={5}
          gap={4}
          flexWrap="wrap"
        >
          <HStack spacing={2} flexShrink={0}>
            <Text
              fontSize="sm"
              color="text-muted"
              whiteSpace="nowrap"
              flexShrink={0}
            >
              Baris per halaman
            </Text>
            <Select
              size="sm"
              maxW="90px"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                resetPage()
              }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </HStack>

          {totalPages > 1 && (
            <ButtonGroup size="sm" variant="outline">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                isDisabled={safePage === 1}
              >
                Sebelumnya
              </Button>
              {renderPageNumbers().map((pageNum) => (
                <Button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  colorScheme={safePage === pageNum ? 'brand' : undefined}
                  variant={safePage === pageNum ? 'solid' : 'outline'}
                >
                  {pageNum}
                </Button>
              ))}
              <Button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                isDisabled={safePage === totalPages}
              >
                Berikutnya
              </Button>
            </ButtonGroup>
          )}
        </Flex>
      )}

      <AlertDialog
        isOpen={settleDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={settleDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="600">
              Tandai lunas
            </AlertDialogHeader>
            <AlertDialogBody color="text-body">
              Apakah Anda yakin invoice{' '}
              <strong>{pendingInvoice?.invoiceNumber}</strong> sudah dibayar
              lunas?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={settleDialog.onClose}>
                Batal
              </Button>
              <Button
                colorScheme="brand"
                onClick={confirmSettle}
                ml={3}
                isLoading={!!updatingId}
                loadingText="Memperbarui..."
              >
                Ya, tandai lunas
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  )
}
