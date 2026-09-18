'use client'
import React, { useState, useMemo, useRef } from 'react'

import { ViewIcon } from '@chakra-ui/icons'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
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
import { useSearchParams } from 'next/navigation'

import { useAuth } from '@/app/UserProvider'
import Layout from '@/components/Layout'
import {
  Card,
  CardBody,
  EmptyState,
  MobileFilterSheet,
  PageHeader,
  ResponsiveTable,
  StatusBadge,
  type ResponsiveColumn
} from '@/components/ui'
import {
  mapOrderStatusToColor,
  mapOrderStatusToMessage
} from '@/constants/order'
import { IOrder, IProductOrder } from '@/interfaces/order'
import { currency } from '@/utils'
import { exportOrdersToCSV, exportDetailedOrdersToCSV } from '@/utils/exportCSV'
import {
  downloadGoogleSheetsCSV,
  openGoogleSheetsImportInstructions
} from '@/utils/exportGoogleSheets'

import { getOrders, useGenerateOrderInvoice } from './actions'
import { useGetVendors } from '../vendors/actions'

export default function Home() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const { data: orders, loading: isFetching, error, refetch } = getOrders(!!user)
  const { data: vendorsData } = useGetVendors()
  const { generateInvoice, loading: isGeneratingInvoice } = useGenerateOrderInvoice()
  const toast = useToast()

  const invoiceDialog = useDisclosure()
  const invoiceCancelRef = useRef<HTMLButtonElement>(null)
  const [pendingInvoiceOrder, setPendingInvoiceOrder] = useState<IOrder | null>(
    null
  )

  const handleGenerateInvoice = async () => {
    if (!pendingInvoiceOrder) return
    try {
      const invoice = await generateInvoice(pendingInvoiceOrder.id)
      toast({
        title: 'Invoice diterbitkan',
        description: invoice.invoiceNumber,
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      setPendingInvoiceOrder(null)
      invoiceDialog.onClose()
      refetch()
    } catch (err) {
      toast({
        title: 'Gagal menerbitkan invoice',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  // Filter states
  const initialDate = searchParams.get('fulfillmentDate')
  const [dateFilter, setDateFilter] = useState(initialDate ? 'custom' : 'all')
  const [customDateStart, setCustomDateStart] = useState(initialDate || '')
  const [customDateEnd, setCustomDateEnd] = useState(initialDate || '')
  const [vendorFilter, setVendorFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const ordersPerPage = 50

  const getTotalQuantity = (items: IProductOrder[] = []) => {
    if (!items || !Array.isArray(items)) return 0
    return items.reduce((acc, item) => {
      return acc + (item?.quantity || 0)
    }, 0)
  }

  const getTotalPrice = (items: IProductOrder[] = []) => {
    if (!items || !Array.isArray(items)) return 0
    return items.reduce((acc, item) => {
      const quantity = item?.quantity || 0
      const price = item?.product?.price || 0
      return acc + quantity * price
    }, 0)
  }

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    if (!orders?.length) return []

    let filtered = [...orders]

    // Date filtering
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

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= startDate && orderDate <= endDate
      })
    }

    // Vendor filtering
    if (vendorFilter) {
      filtered = filtered.filter((order) => {
        if (order.vendors && order.vendors.length > 0) {
          return order.vendors.some((vendor) =>
            vendor.name?.toLowerCase().includes(vendorFilter.toLowerCase())
          )
        }
        return false
      })
    }

    // Product filtering
    if (productFilter) {
      filtered = filtered.filter((order) =>
        order.productOrders?.some((po) =>
          po.product?.name?.toLowerCase().includes(productFilter.toLowerCase())
        )
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0

      if (sortBy === 'date') {
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sortBy === 'total') {
        const totalA = getTotalPrice(a.productOrders || [])
        const totalB = getTotalPrice(b.productOrders || [])
        comparison = totalA - totalB
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [
    orders,
    dateFilter,
    customDateStart,
    customDateEnd,
    vendorFilter,
    productFilter,
    sortBy,
    sortOrder
  ])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedOrders.length / ordersPerPage)
  const paginatedOrders = filteredAndSortedOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  )

  // Get vendors and products
  const vendors = useMemo(() => {
    if (!vendorsData?.length) return []
    return vendorsData.filter((vendor) => vendor.isActive).map((vendor) => vendor.name)
  }, [vendorsData])

  const uniqueProducts = useMemo(() => {
    if (!orders?.length) return []
    const products = new Set()
    orders.forEach((order) => {
      order.productOrders?.forEach((po) => {
        if (po.product?.name) {
          products.add(po.product.name)
        }
      })
    })
    return Array.from(products)
  }, [orders])

  // Sort handlers
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return ''
    return sortOrder === 'asc' ? ' ↑' : ' ↓'
  }

  // Export handlers
  const handleExportCSV = () => {
    exportOrdersToCSV(
      filteredAndSortedOrders,
      `Orders_Summary_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`
    )
  }

  const handleExportDetailedCSV = () => {
    exportDetailedOrdersToCSV(
      filteredAndSortedOrders,
      `Orders_Detailed_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`
    )
  }

  const handleExportGoogleSheets = () => {
    const dateRange =
      dateFilter !== 'all'
        ? dateFilter === 'custom' && customDateStart && customDateEnd
          ? `${customDateStart} s.d. ${customDateEnd}`
          : `Terakhir ${dateFilter}`
        : undefined

    downloadGoogleSheetsCSV(filteredAndSortedOrders, {
      includeProductDetails: false,
      title: `Export Ringkasan Order - ${format(new Date(), 'dd/MM/yyyy')}`,
      dateRange,
      filename: `GoogleSheets_Orders_Summary_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`
    })

    setTimeout(() => {
      openGoogleSheetsImportInstructions()
    }, 1000)
  }

  const handleExportDetailedGoogleSheets = () => {
    const dateRange =
      dateFilter !== 'all'
        ? dateFilter === 'custom' && customDateStart && customDateEnd
          ? `${customDateStart} s.d. ${customDateEnd}`
          : `Terakhir ${dateFilter}`
        : undefined

    downloadGoogleSheetsCSV(filteredAndSortedOrders, {
      includeProductDetails: true,
      title: `Export Detail Order - ${format(new Date(), 'dd/MM/yyyy')}`,
      dateRange,
      filename: `GoogleSheets_Orders_Detailed_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`
    })

    setTimeout(() => {
      openGoogleSheetsImportInstructions()
    }, 1000)
  }

  const columns: ResponsiveColumn<IOrder>[] = [
    {
      key: 'order',
      header: 'No. Order',
      render: (order) => (
        <Text fontWeight="600">{order.orderNumber || order.id}</Text>
      )
    },
    {
      key: 'date',
      header: (
        <Box as="span" cursor="pointer" onClick={() => handleSort('date')}>
          Tanggal dibuat{getSortIcon('date')}
        </Box>
      ),
      mobileLabel: 'Tanggal',
      render: (order) => (
        <>
          <Text fontSize="sm">
            {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: id })}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {format(new Date(order.createdAt), 'HH:mm', { locale: id })}
          </Text>
        </>
      )
    },
    {
      key: 'vendor',
      header: 'Vendor',
      render: (order) =>
        order.vendors && order.vendors.length > 0
          ? order.vendors.map((vendor) => vendor.name).join(', ')
          : 'Tanpa vendor'
    },
    {
      key: 'customer',
      header: 'Nama pelanggan',
      render: (order) => order.customer?.name || 'Tidak diketahui'
    },
    {
      key: 'phone',
      header: 'No. telepon',
      render: (order) => order.customer?.phoneNumber || '-'
    },
    {
      key: 'qty',
      header: 'Jumlah',
      render: (order) => getTotalQuantity(order.productOrders || [])
    },
    {
      key: 'total',
      header: (
        <Box as="span" cursor="pointer" onClick={() => handleSort('total')}>
          Total{getSortIcon('total')}
        </Box>
      ),
      isNumeric: true,
      render: (order) => (
        <Text fontWeight="600">
          {currency.toIDRFormat(getTotalPrice(order.productOrders || []))}
        </Text>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (order) => (
        <StatusBadge color={mapOrderStatusToColor[order.status]}>
          {mapOrderStatusToMessage[order.status] || order.status}
        </StatusBadge>
      )
    }
  ]

  const renderActions = (order: IOrder) => (
    <Menu placement="bottom-end">
      <MenuButton
        as={IconButton}
        aria-label="Aksi order"
        icon={<ViewIcon />}
        size="sm"
        colorScheme="brand"
        variant="outline"
      />
      <MenuList>
        <MenuItem as={Link} href={`/admin/orders/${order.id}`}>
          Lihat detail
        </MenuItem>
        {order.status !== 'Invoice Issued' &&
          order.status !== 'Invoice Settled' && (
            <MenuItem
              onClick={() => {
                setPendingInvoiceOrder(order)
                invoiceDialog.onOpen()
              }}
            >
              Buatkan invoice
            </MenuItem>
          )}
      </MenuList>
    </Menu>
  )

  const activeFilterCount = [
    dateFilter !== 'all' ? dateFilter : '',
    productFilter,
    vendorFilter
  ].filter(Boolean).length

  const filterFields = (
    <>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        <FormControl>
          <FormLabel fontSize="sm">Filter tanggal</FormLabel>
          <Select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value)
              setCurrentPage(1)
            }}
            size="sm"
          >
            <option value="all">Semua waktu</option>
            <option value="today">Hari ini</option>
            <option value="week">7 hari terakhir</option>
            <option value="month">Bulan ini</option>
            <option value="custom">Rentang kustom</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm">Filter produk</FormLabel>
          <Select
            placeholder="Semua produk"
            value={productFilter}
            onChange={(e) => {
              setProductFilter(e.target.value)
              setCurrentPage(1)
            }}
            size="sm"
          >
            {uniqueProducts.map((product) => (
              <option key={String(product)} value={String(product)}>
                {String(product)}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm">Filter vendor</FormLabel>
          <Select
            placeholder="Semua vendor"
            value={vendorFilter}
            onChange={(e) => {
              setVendorFilter(e.target.value)
              setCurrentPage(1)
            }}
            size="sm"
          >
            {vendors.map((vendor) => (
              <option key={vendor} value={vendor}>
                {vendor}
              </option>
            ))}
          </Select>
        </FormControl>
      </SimpleGrid>

      {dateFilter === 'custom' && (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
          <FormControl>
            <FormLabel fontSize="sm">Tanggal mulai</FormLabel>
            <Input
              type="date"
              value={customDateStart}
              onChange={(e) => setCustomDateStart(e.target.value)}
              size="sm"
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm">Tanggal selesai</FormLabel>
            <Input
              type="date"
              value={customDateEnd}
              onChange={(e) => setCustomDateEnd(e.target.value)}
              size="sm"
            />
          </FormControl>
        </SimpleGrid>
      )}
    </>
  )

  return (
    <Layout isFetching={isFetching} error={error as Error}>
      <PageHeader
        title="Order"
        subtitle="Kelola dan pantau seluruh pesanan"
        breadcrumbs={[
          { label: 'Dasbor', path: '/admin' },
          { label: 'Order' }
        ]}
        actions={
          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              variant="outline"
              colorScheme="brand"
            >
              Export
            </MenuButton>
            <MenuList>
              <MenuItem onClick={handleExportCSV}>CSV Ringkasan</MenuItem>
              <MenuItem onClick={handleExportDetailedCSV}>CSV Detail</MenuItem>
              <MenuItem onClick={handleExportGoogleSheets}>
                Sheets Ringkasan
              </MenuItem>
              <MenuItem onClick={handleExportDetailedGoogleSheets}>
                Sheets Detail
              </MenuItem>
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

      <Card>
        <CardBody p={0}>
          {filteredAndSortedOrders.length === 0 ? (
            <EmptyState
              title="Belum ada order"
              description="Order yang masuk akan tampil di sini."
            />
          ) : (
            <>
              <ResponsiveTable
                columns={columns}
                rows={paginatedOrders}
                getRowKey={(order) => order.id}
                mobileTitleKey="order"
                mobileSubtitleKey="customer"
                actions={renderActions}
              />

              {totalPages > 1 && (
                <Flex justify="center" mt={6} mb={4}>
                  <ButtonGroup size="sm" isAttached variant="outline">
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      isDisabled={currentPage === 1}
                    >
                      Sebelumnya
                    </Button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <Button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          colorScheme={currentPage === pageNum ? 'brand' : undefined}
                          variant={currentPage === pageNum ? 'solid' : 'outline'}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}

                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      isDisabled={currentPage === totalPages}
                    >
                      Berikutnya
                    </Button>
                  </ButtonGroup>
                </Flex>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <AlertDialog
        isOpen={invoiceDialog.isOpen}
        leastDestructiveRef={invoiceCancelRef}
        onClose={invoiceDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="600">
              Buatkan invoice
            </AlertDialogHeader>
            <AlertDialogBody color="text-body">
              Terbitkan invoice untuk order{' '}
              <strong>
                {pendingInvoiceOrder?.orderNumber || pendingInvoiceOrder?.id}
              </strong>
              ? Status order akan berubah menjadi{' '}
              <strong>Invoice diterbitkan</strong>.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={invoiceCancelRef}
                onClick={invoiceDialog.onClose}
                isDisabled={isGeneratingInvoice}
              >
                Batal
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleGenerateInvoice}
                ml={3}
                isLoading={isGeneratingInvoice}
                loadingText="Menerbitkan..."
              >
                Ya, buatkan
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  )
}
