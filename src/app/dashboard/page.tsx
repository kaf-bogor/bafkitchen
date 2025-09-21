'use client'

import React, { useState } from 'react'

import {
  Box,
  Button,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Tag,
  VStack,
  Text,
  Badge,
  Flex,
  Select,
  FormControl,
  FormLabel,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { Layout } from '@/components'
import { invoiceStatusColors, invoiceStatusMessages, EInvoiceStatus } from '@/interfaces/invoice'
import { currency } from '@/utils'

import { useGetInvoicesByVendor, useGetInvoices } from '../admin/invoices/actions'
import { useGetVendors } from '../admin/vendors/actions'

export default function VendorDashboard() {
  const searchParams = useSearchParams()
  const vendorIdParam = searchParams.get('vendorId')
  
  const [selectedVendorId, setSelectedVendorId] = useState<string>(vendorIdParam || '')
  const [statusFilter, setStatusFilter] = useState('')

  // Get all invoices to extract vendor options
  const { data: allInvoices } = useGetInvoices()
  
  // Get vendors from new vendors collection (with fallback to stores via invoices)
  const { data: vendorsFromCollection } = useGetVendors()
  
  // Get invoices for selected vendor
  const { data: vendorInvoices, loading: isFetching, error } = useGetInvoicesByVendor(selectedVendorId)

  const breadcrumbs = [{ label: 'Vendor Dashboard', path: '/dashboard' }]

  // Get unique vendors - prioritize vendors collection, fallback to invoices
  const vendors = React.useMemo(() => {
    // First try to use vendors from the vendors collection
    if (vendorsFromCollection?.length) {
      return vendorsFromCollection
        .filter(vendor => vendor.isActive)
        .map(vendor => ({
          id: vendor.id,
          name: vendor.name
        }))
    }
    
    // Fallback: extract vendors from invoices (current system)
    if (!allInvoices?.length) return []
    const vendorMap = new Map()
    allInvoices.forEach(invoice => {
      if (!vendorMap.has(invoice.vendorId)) {
        vendorMap.set(invoice.vendorId, {
          id: invoice.vendorId,
          name: invoice.vendorName
        })
      }
    })
    return Array.from(vendorMap.values())
  }, [vendorsFromCollection, allInvoices])

  // Filter invoices by status
  const filteredInvoices = React.useMemo(() => {
    if (!vendorInvoices?.length) return []
    
    if (!statusFilter) return vendorInvoices
    
    return vendorInvoices.filter(invoice => invoice.status === statusFilter)
  }, [vendorInvoices, statusFilter])

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!vendorInvoices?.length) return {
      totalInvoices: 0,
      totalAmount: 0,
      pendingAmount: 0,
      settledAmount: 0,
      overdueCount: 0
    }

    const now = new Date()
    let totalAmount = 0
    let pendingAmount = 0
    let settledAmount = 0
    let overdueCount = 0

    vendorInvoices.forEach(invoice => {
      totalAmount += invoice.totalAmount
      
      if (invoice.status === EInvoiceStatus.SETTLED) {
        settledAmount += invoice.totalAmount
      } else {
        pendingAmount += invoice.totalAmount
        
        if (new Date(invoice.dueDate) < now) {
          overdueCount++
        }
      }
    })

    return {
      totalInvoices: vendorInvoices.length,
      totalAmount,
      pendingAmount,
      settledAmount,
      overdueCount
    }
  }, [vendorInvoices])

  return (
    <Layout breadcrumbs={breadcrumbs} isAdmin={false} isFetching={isFetching} error={error as Error}>
      <VStack spacing={6} align="stretch">
        {/* Header and Vendor Selection */}
        <Card>
          <CardHeader>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <Heading size="lg">Vendor Dashboard</Heading>
              <FormControl maxW="300px">
                <FormLabel fontSize="sm">Select Vendor:</FormLabel>
                <Select
                  placeholder="Choose a vendor"
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                >
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Flex>
          </CardHeader>
        </Card>

        {selectedVendorId && (
          <>
            {/* Statistics Cards */}
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Invoices</StatLabel>
                    <StatNumber>{stats.totalInvoices}</StatNumber>
                    <StatHelpText>All time</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Amount</StatLabel>
                    <StatNumber color="blue.600">{currency.toIDRFormat(stats.totalAmount)}</StatNumber>
                    <StatHelpText>All invoices</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Pending Amount</StatLabel>
                    <StatNumber color="orange.600">{currency.toIDRFormat(stats.pendingAmount)}</StatNumber>
                    <StatHelpText>Awaiting payment</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Settled Amount</StatLabel>
                    <StatNumber color="green.600">{currency.toIDRFormat(stats.settledAmount)}</StatNumber>
                    <StatHelpText>Paid invoices</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Alerts for overdue invoices */}
            {stats.overdueCount > 0 && (
              <Box p={4} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
                <Text color="red.600" fontWeight="bold">
                  ⚠️ You have {stats.overdueCount} overdue invoice{stats.overdueCount > 1 ? 's' : ''}
                </Text>
              </Box>
            )}

            {/* Filters */}
            <Box>
              <FormControl maxW="200px">
                <FormLabel fontSize="sm">Filter by Status:</FormLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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
            </Box>

            {/* Invoices Table */}
            <Card>
              <CardHeader>
                <Heading size="md">Your Invoices ({filteredInvoices.length})</Heading>
              </CardHeader>
              <CardBody>
                {filteredInvoices.length === 0 ? (
                  <Text textAlign="center" color="gray.500" py={8}>
                    No invoices found for the selected criteria.
                  </Text>
                ) : (
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Invoice Number</Th>
                        <Th>Issued Date</Th>
                        <Th>Order ID</Th>
                        <Th>Amount</Th>
                        <Th>Due Date</Th>
                        <Th>Status</Th>
                        <Th>Action</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredInvoices.map((invoice) => {
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
                            <Th>
                              <Link href={`/admin/orders/${invoice.orderId}`} style={{ color: 'blue' }}>
                                {invoice.orderId.substring(0, 8)}...
                              </Link>
                            </Th>
                            <Th>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="bold">{currency.toIDRFormat(invoice.totalAmount)}</Text>
                                {invoice.commission && (
                                  <Text fontSize="xs" color="gray.600">
                                    Net: {currency.toIDRFormat(invoice.totalAmount - invoice.commission.amount)}
                                  </Text>
                                )}
                              </VStack>
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
                              <Link href={`/admin/invoices/${invoice.id}`}>
                                <Button size="xs" colorScheme="blue" variant="outline">
                                  View Details
                                </Button>
                              </Link>
                            </Th>
                          </Tr>
                        )
                      })}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </>
        )}

        {!selectedVendorId && (
          <Card>
            <CardBody>
              <VStack spacing={4} py={8}>
                <Text fontSize="lg" color="gray.500">
                  Welcome to the Vendor Dashboard
                </Text>
                <Text textAlign="center" color="gray.600">
                  Please select a vendor from the dropdown above to view their invoices and payment information.
                </Text>
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Layout>
  )
}
