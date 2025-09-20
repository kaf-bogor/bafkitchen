'use client'
import React, { useState, useMemo } from 'react'

import { ViewIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Tag,
  HStack,
  IconButton,
  VStack,
  Select,
  Input,
  FormControl,
  FormLabel,
  SimpleGrid,
  Text,
  Flex,
  Badge,
  ButtonGroup
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'

import { getOrders } from '@/app/admin/orders/actions'
import { getStores } from '@/app/admin/stores/actions'
import { useAuth } from '@/app/UserProvider'
import Layout from '@/components/Layout'
import {
  mapOrderStatusToColor,
  mapOrderStatusToMessage
} from '@/constants/order'
import { IProductOrder } from '@/interfaces/order'
import { currency } from '@/utils'
import { exportOrdersToCSV, exportDetailedOrdersToCSV } from '@/utils/exportCSV'
import { downloadGoogleSheetsCSV, openGoogleSheetsImportInstructions } from '@/utils/exportGoogleSheets'


export default function Home() {
  const { user } = useAuth()
  const { data: orders, isFetching, error } = getOrders(!!user)
  const { data: stores } = getStores()

  // Filter states
  const [dateFilter, setDateFilter] = useState('all')
  const [customDateStart, setCustomDateStart] = useState('')
  const [customDateEnd, setCustomDateEnd] = useState('')
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
        // Check if vendorFilter matches any vendor in the order.vendors array
        if (order.vendors && order.vendors.length > 0) {
          return order.vendors.some(vendor => 
            vendor.name?.toLowerCase().includes(vendorFilter.toLowerCase())
          )
        }
        // Fallback to store name for older orders
        return order.store?.name?.toLowerCase().includes(vendorFilter.toLowerCase())
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

  // Get vendors from Firestore and products from orders
  const vendors = useMemo(() => {
    if (!stores?.length) return []
    return stores.filter(store => !store.isDeleted).map(store => store.name)
  }, [stores])

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
    if (sortBy !== column) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  // Export handlers
  const handleExportCSV = () => {
    const dateRange = dateFilter !== 'all' ? 
      dateFilter === 'custom' && customDateStart && customDateEnd ? 
        `${customDateStart} to ${customDateEnd}` :
        `Last ${dateFilter}`
      : undefined

    exportOrdersToCSV(filteredAndSortedOrders, {
      filename: `Orders_Summary_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`
    })
  }

  const handleExportDetailedCSV = () => {
    const dateRange = dateFilter !== 'all' ? 
      dateFilter === 'custom' && customDateStart && customDateEnd ? 
        `${customDateStart} to ${customDateEnd}` :
        `Last ${dateFilter}`
      : undefined

    exportDetailedOrdersToCSV(filteredAndSortedOrders, {
      filename: `Orders_Detailed_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`
    })
  }

  const handleExportGoogleSheets = () => {
    const dateRange = dateFilter !== 'all' ? 
      dateFilter === 'custom' && customDateStart && customDateEnd ? 
        `${customDateStart} to ${customDateEnd}` :
        `Last ${dateFilter}`
      : undefined

    downloadGoogleSheetsCSV(filteredAndSortedOrders, {
      includeProductDetails: false,
      title: `Orders Summary Export - ${format(new Date(), 'dd/MM/yyyy')}`,
      dateRange,
      filename: `GoogleSheets_Orders_Summary_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`
    })
    
    setTimeout(() => {
      openGoogleSheetsImportInstructions()
    }, 1000)
  }

  const handleExportDetailedGoogleSheets = () => {
    const dateRange = dateFilter !== 'all' ? 
      dateFilter === 'custom' && customDateStart && customDateEnd ? 
        `${customDateStart} to ${customDateEnd}` :
        `Last ${dateFilter}`
      : undefined

    downloadGoogleSheetsCSV(filteredAndSortedOrders, {
      includeProductDetails: true,
      title: `Orders Detailed Export - ${format(new Date(), 'dd/MM/yyyy')}`,
      dateRange,
      filename: `GoogleSheets_Orders_Detailed_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`
    })
    
    setTimeout(() => {
      openGoogleSheetsImportInstructions()
    }, 1000)
  }

  const breadcrumbs = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Order', path: '/admin/orders' }
  ]

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      isFetching={isFetching}
      error={error as Error}
    >

      {/* Filters and Controls */}
      <VStack spacing={4} mb={6} align="stretch">
        <Flex justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="bold">
            Orders ({filteredAndSortedOrders.length} total)
          </Text>
          <HStack spacing={2}>
            <ButtonGroup size="sm" isAttached variant="outline">
              <Button onClick={handleExportCSV}>
                📄 CSV Summary
              </Button>
              <Button onClick={handleExportDetailedCSV}>
                📊 CSV Detailed
              </Button>
              <Button onClick={handleExportGoogleSheets} colorScheme="green">
                📗 Sheets Summary
              </Button>
              <Button onClick={handleExportDetailedGoogleSheets} colorScheme="green">
                📈 Sheets Detailed
              </Button>
            </ButtonGroup>
            <Badge colorScheme="blue" px={3} py={1}>
              Page {currentPage} of {totalPages}
            </Badge>
          </HStack>
        </Flex>

        {/* Date and Product Filters */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
          {/* Date Filter */}
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              📅 Date Filter
            </FormLabel>
            <Select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value)
                setCurrentPage(1)
              }}
              size="sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </Select>
          </FormControl>

          {/* Product Filter */}
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              🛍️ Product Filter
            </FormLabel>
            <Select
              placeholder="All Products"
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
        </SimpleGrid>

        {/* Vendor/Store Filter - Separate Section */}
        <Box p={4} bg="gray.50" borderRadius="md" mb={4}>
          <FormControl maxW="300px">
            <FormLabel fontSize="sm" fontWeight="medium" color="blue.600">
Vendor Name
            </FormLabel>
            <Select
              placeholder="All Vendors"
              value={vendorFilter}
              onChange={(e) => {
                setVendorFilter(e.target.value)
                setCurrentPage(1)
              }}
              size="sm"
              bg="white"
            >
              {vendors.map((vendor) => (
                <option key={vendor} value={vendor}>
                  {vendor}
                </option>
              ))}
            </Select>
            {vendorFilter && (
              <Text fontSize="xs" color="gray.600" mt={1}>
                Showing orders from: <strong>{vendorFilter}</strong>
              </Text>
            )}
          </FormControl>
        </Box>

        {/* Custom Date Range */}
        {dateFilter === 'custom' && (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">Start Date</FormLabel>
              <Input
                type="date"
                value={customDateStart}
                onChange={(e) => setCustomDateStart(e.target.value)}
                size="sm"
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">End Date</FormLabel>
              <Input
                type="date"
                value={customDateEnd}
                onChange={(e) => setCustomDateEnd(e.target.value)}
                size="sm"
              />
            </FormControl>
          </SimpleGrid>
        )}
      </VStack>

      <Table variant={'simple'}>
        <Thead>
          <Tr>
            <Th>Order ID</Th>
            <Th 
              cursor="pointer" 
              _hover={{ bg: 'gray.50' }}
              onClick={() => handleSort('date')}
            >
              <HStack spacing={1}>
                <Text>Date Created</Text>
                <Text fontSize="sm">{getSortIcon('date')}</Text>
              </HStack>
            </Th>
            <Th>Vendor Name</Th>
            <Th>Customer Name</Th>
            <Th>Customer Phone</Th>
            <Th>Total Quantity</Th>
            <Th 
              cursor="pointer" 
              _hover={{ bg: 'gray.50' }}
              onClick={() => handleSort('total')}
            >
              <HStack spacing={1}>
                <Text>Total Amount</Text>
                <Text fontSize="sm">{getSortIcon('total')}</Text>
              </HStack>
            </Th>
            <Th>Status</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {paginatedOrders.map((order) => {
            return (
              <Tr key={order.id}>
                <Th>{order.orderNumber || order.id}</Th>
                <Th>
                  <Text fontSize="sm">
                    {format(new Date(order.createdAt), 'dd MMM yyyy', {
                      locale: id
                    })}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {format(new Date(order.createdAt), 'HH:mm', { locale: id })}
                  </Text>
                </Th>
                <Th>
                  {order.vendors && order.vendors.length > 0 
                    ? order.vendors.map(vendor => vendor.name).join(', ')
                    : order.store?.name || 'Unknown Vendor'
                  }
                </Th>
                <Th>{order.customer?.name || 'Unknown Customer'}</Th>
                <Th>{order.customer?.phoneNumber || 'N/A'}</Th>
                <Th>{getTotalQuantity(order.productOrders || [])}</Th>
                <Th>
                  {currency.toIDRFormat(
                    getTotalPrice(order.productOrders || [])
                  )}
                </Th>
                <Th>
                  <Tag
                    size="xs"
                    p={2}
                    colorScheme={mapOrderStatusToColor[order.status]}
                  >
                    {mapOrderStatusToMessage[order.status] || order.status}
                  </Tag>
                </Th>
                <Th>
                  <Link href={`/admin/orders/${order.id}`} passHref>
                    <IconButton
                      aria-label="View order details"
                      icon={<ViewIcon />}
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                    />
                  </Link>
                </Th>
              </Tr>
            )
          })}
        </Tbody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <Flex justify="center" mt={6}>
          <ButtonGroup size="sm" isAttached variant="outline">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              isDisabled={currentPage === 1}
            >
              Previous
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
                  colorScheme={currentPage === pageNum ? 'blue' : undefined}
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
              Next
            </Button>
          </ButtonGroup>
        </Flex>
      )}
    </Layout>
  )
}
