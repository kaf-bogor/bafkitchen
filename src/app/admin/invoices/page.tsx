'use client'
import React, { useState } from 'react'

import {
  Button,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Tag,
  useToast,
  HStack,
  VStack,
  Text,
  Badge,
  ButtonGroup,
  Flex,
  Select,
  Input,
  FormControl,
  FormLabel,
  SimpleGrid
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'

import Layout from '@/components/Layout'
import { invoiceStatusColors, invoiceStatusMessages, EInvoiceStatus } from '@/interfaces/invoice'
import { currency } from '@/utils'

import { useGetInvoices, useUpdateInvoiceStatus } from './actions'

export default function InvoicesPage() {
  const toast = useToast()
  
  const { data: invoices, loading: isFetching, error } = useGetInvoices()
  const { updateInvoiceStatus, loading: isUpdating } = useUpdateInvoiceStatus()
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('')
  const [vendorFilter, setVendorFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [customDateStart, setCustomDateStart] = useState('')
  const [customDateEnd, setCustomDateEnd] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const invoicesPerPage = 50

  const breadcrumbs = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Invoices', path: '/admin/invoices' }
  ]

  // Filter and paginate invoices
  const filteredInvoices = React.useMemo(() => {
    if (!invoices?.length) return []

    let filtered = [...invoices]

    // Status filtering
    if (statusFilter) {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    // Vendor filtering
    if (vendorFilter) {
      filtered = filtered.filter(invoice => 
        invoice.vendorName.toLowerCase().includes(vendorFilter.toLowerCase())
      )
    }

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

      filtered = filtered.filter((invoice) => {
        const invoiceDate = new Date(invoice.issuedDate)
        return invoiceDate >= startDate && invoiceDate <= endDate
      })
    }

    return filtered
  }, [invoices, statusFilter, vendorFilter, dateFilter, customDateStart, customDateEnd])

  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage)
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * invoicesPerPage,
    currentPage * invoicesPerPage
  )

  // Get unique vendors for filtering
  const uniqueVendors = React.useMemo(() => {
    if (!invoices?.length) return []
    return Array.from(new Set(invoices.map(invoice => invoice.vendorName))).sort()
  }, [invoices])

  const handleStatusUpdate = async (invoiceId: string, newStatus: EInvoiceStatus) => {
    try {
      await updateInvoiceStatus({
        invoiceId,
        status: newStatus,
        settledDate: newStatus === EInvoiceStatus.SETTLED ? new Date().toISOString() : undefined
      })
      
      toast({
        title: 'Invoice status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (error) {
      toast({
        title: 'Failed to update invoice status',
        description: (error as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

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
            Invoices ({filteredInvoices.length} total)
          </Text>
          <Badge colorScheme="blue" px={3} py={1}>
            Page {currentPage} of {totalPages}
          </Badge>
        </Flex>

        {/* Filters */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
          {/* Status Filter */}
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              📊 Status Filter
            </FormLabel>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              size="sm"
            >
              <option value="">All Statuses</option>
              {Object.values(EInvoiceStatus).map((status) => (
                <option key={status} value={status}>
                  {invoiceStatusMessages[status]}
                </option>
              ))}
            </Select>
          </FormControl>

          {/* Vendor Filter */}
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              🏪 Vendor Filter
            </FormLabel>
            <Select
              placeholder="All Vendors"
              value={vendorFilter}
              onChange={(e) => {
                setVendorFilter(e.target.value)
                setCurrentPage(1)
              }}
              size="sm"
            >
              {uniqueVendors.map((vendor) => (
                <option key={vendor} value={vendor}>
                  {vendor}
                </option>
              ))}
            </Select>
          </FormControl>

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
        </SimpleGrid>

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

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Invoice Number</Th>
            <Th>Issued Date</Th>
            <Th>Vendor</Th>
            <Th>Order ID</Th>
            <Th>Total Amount</Th>
            <Th>Due Date</Th>
            <Th>Status</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {paginatedInvoices.map((invoice) => {
            const isDueToday = new Date(invoice.dueDate).toDateString() === new Date().toDateString()
            const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== EInvoiceStatus.SETTLED

            return (
              <Tr key={invoice.id}>
                <Th>
                  <Text fontWeight="bold">{invoice.invoiceNumber}</Text>
                </Th>
                <Th>
                  <Text fontSize="sm">
                    {format(new Date(invoice.issuedDate), 'dd MMM yyyy', { locale: id })}
                  </Text>
                </Th>
                <Th>{invoice.vendorName}</Th>
                <Th>
                  <Link href={`/admin/orders/${invoice.orderId}`} style={{ color: 'blue' }}>
                    {invoice.orderId.substring(0, 8)}...
                  </Link>
                </Th>
                <Th>
                  {currency.toIDRFormat(invoice.totalAmount)}
                </Th>
                <Th>
                  <Text 
                    fontSize="sm" 
                    color={isDueToday ? 'orange.500' : isOverdue ? 'red.500' : 'inherit'}
                    fontWeight={isDueToday || isOverdue ? 'bold' : 'normal'}
                  >
                    {format(new Date(invoice.dueDate), 'dd MMM yyyy', { locale: id })}
                  </Text>
                  {isDueToday && (
                    <Badge colorScheme="orange" size="sm" mt={1}>
                      Due Today
                    </Badge>
                  )}
                  {isOverdue && (
                    <Badge colorScheme="red" size="sm" mt={1}>
                      Overdue
                    </Badge>
                  )}
                </Th>
                <Th>
                  <Tag
                    size="sm"
                    colorScheme={invoiceStatusColors[invoice.status]}
                  >
                    {invoiceStatusMessages[invoice.status]}
                  </Tag>
                </Th>
                <Th>
                  <HStack spacing={2}>
                    <Link href={`/admin/invoices/${invoice.id}`}>
                      <Button size="xs" colorScheme="blue" variant="outline">
                        View
                      </Button>
                    </Link>
                    {invoice.status === EInvoiceStatus.ISSUED && (
                      <Button
                        size="xs"
                        colorScheme="green"
                        onClick={() => handleStatusUpdate(invoice.id, EInvoiceStatus.SETTLED)}
                        isLoading={isUpdating}
                      >
                        Mark Settled
                      </Button>
                    )}
                  </HStack>
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