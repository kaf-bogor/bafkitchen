'use client'
import React from 'react'

import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Alert,
  AlertIcon
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'

import { Layout } from '@/components'

import { useGetVendors } from './actions'

export default function VendorsPage() {
  const { data: vendors, isFetching, error } = useGetVendors()

  const breadcrumbs = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Vendors', path: '/admin/vendors' }
  ]

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      isFetching={isFetching}
      error={error as Error}
    >
      <VStack spacing={6} align="stretch">
        <Card>
          <CardHeader>
            <HStack justify="space-between" align="center">
              <Heading size="lg">Vendor Management</Heading>
              <HStack>
                <Link href="/admin/vendors/migrate">
                  <Button variant="outline" colorScheme="blue">
                    Migrate Data
                  </Button>
                </Link>
              </HStack>
            </HStack>
          </CardHeader>
          <CardBody>
            {!vendors?.length ? (
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">No vendors found</Text>
                  <Text fontSize="sm">
                    Use the &ldquo;Migrate Data&rdquo; button to import vendor
                    data from the stores collection.
                  </Text>
                </Box>
              </Alert>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Status</Th>
                    <Th>Created At</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {vendors.map((vendor) => (
                    <Tr key={vendor.id}>
                      <Td>
                        <Text fontWeight="bold">{vendor.name}</Text>
                      </Td>
                      <Td>{vendor.email}</Td>
                      <Td>
                        <Badge colorScheme={vendor.isActive ? 'green' : 'red'}>
                          {vendor.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {format(new Date(vendor.createdAt), 'dd MMM yyyy', {
                            locale: id
                          })}
                        </Text>
                      </Td>
                      <Td>
                        <Link href={`/dashboard?vendorId=${vendor.id}`}>
                          <Button
                            size="xs"
                            colorScheme="blue"
                            variant="outline"
                          >
                            View Dashboard
                          </Button>
                        </Link>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">System Status</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="start" spacing={3}>
              <HStack>
                <Text fontWeight="bold">Total Vendors:</Text>
                <Text>{vendors?.length || 0}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold">Active Vendors:</Text>
                <Text>{vendors?.filter((v) => v.isActive).length || 0}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold">Inactive Vendors:</Text>
                <Text>{vendors?.filter((v) => !v.isActive).length || 0}</Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Layout>
  )
}
