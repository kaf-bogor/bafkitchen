'use client'

import React from 'react'

import {
  Box,
  HStack,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  Tabs,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  VStack
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import {
  useGetProduct,
  useGetProductPurchases,
  useUpdateProducts
} from '@/app/admin/(panel)/products/actions'
import { Layout, ProductForm } from '@/components'
import { Card, CardBody, CardHeader } from '@/components/ui'
import { currency } from '@/utils'

export default function Edit() {
  const { productId } = useParams()
  const {
    data: product,
    loading: isFetching,
    error,
    refetch
  } = useGetProduct(productId as string)

  const {
    data: purchases,
    loading: isFetchingPurchases
  } = useGetProductPurchases(productId as string)

  const toast = useToast()
  const { updateProduct, loading } = useUpdateProducts()

  const handleUpdateProduct = async (productData: any) => {
    try {
      await updateProduct(productData)
      toast({
        title: 'Berhasil',
        description: 'Produk berhasil diperbarui',
        status: 'success',
        isClosable: true
      })
      refetch()
    } catch (error) {
      toast({
        title: 'Gagal',
        description: 'Produk gagal diperbarui',
        status: 'error',
        isClosable: true
      })
    }
  }

  const breadcrumbs = [
    { label: 'Dasbor', path: '/admin' },
    { label: 'Produk', path: '/admin/products' },
    { label: 'Ubah produk' }
  ]

  const activities = [...(product?.activities || [])].reverse()

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      error={error as Error}
      isFetching={isFetching}
    >
      {product && (
        <VStack align="stretch" spacing={6}>
          <ProductForm
            isPending={loading}
            product={product}
            onUpdate={handleUpdateProduct}
            title="Ubah produk"
          />

          <Card>
            <CardHeader
              title="Riwayat"
              description="Riwayat pembelian dan perubahan produk"
            />
            <CardBody>
              <Tabs colorScheme="brand" isLazy>
                <TabList>
                  <Tab>Riwayat Pembelian</Tab>
                  <Tab>Riwayat Aktivitas</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel px={0}>
                    {isFetchingPurchases ? (
                      <HStack justify="center" py={6}>
                        <Spinner size="sm" />
                      </HStack>
                    ) : !purchases?.length ? (
                      <Text fontSize="sm" color="text-muted">
                        Belum ada riwayat pembelian.
                      </Text>
                    ) : (
                      <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Tanggal</Th>
                              <Th>No. Nota</Th>
                              <Th>Supplier</Th>
                              <Th isNumeric>Qty</Th>
                              <Th isNumeric>HPP</Th>
                              <Th isNumeric>Harga jual</Th>
                              <Th isNumeric>Subtotal</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {purchases.map((purchase) => (
                              <Tr key={purchase.id}>
                                <Td>
                                  {purchase.purchaseDate
                                    ? format(
                                        new Date(purchase.purchaseDate),
                                        'dd MMM yyyy',
                                        { locale: id }
                                      )
                                    : '-'}
                                </Td>
                                <Td>
                                  <Link
                                    href={`/admin/purchases/${purchase.purchaseId}`}
                                  >
                                    <Text
                                      as="span"
                                      color="brand.600"
                                      fontWeight="600"
                                    >
                                      {purchase.purchaseNumber || '-'}
                                    </Text>
                                  </Link>
                                </Td>
                                <Td>{purchase.supplier || '-'}</Td>
                                <Td isNumeric>{purchase.qty}</Td>
                                <Td isNumeric>
                                  {currency.toIDRFormat(purchase.costPrice)}
                                </Td>
                                <Td isNumeric>
                                  {currency.toIDRFormat(purchase.sellPrice)}
                                </Td>
                                <Td isNumeric>
                                  {currency.toIDRFormat(purchase.subtotal)}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    )}
                  </TabPanel>

                  <TabPanel px={0}>
                    {activities.length === 0 ? (
                      <Text fontSize="sm" color="text-muted">
                        Belum ada riwayat perubahan.
                      </Text>
                    ) : (
                      <VStack align="stretch" spacing={4}>
                        {activities.map((activity) => (
                          <Box
                            key={activity.id}
                            borderBottom="1px solid"
                            borderColor="border-subtle"
                            pb={3}
                            _last={{ borderBottom: 'none', pb: 0 }}
                          >
                            <HStack justify="space-between" align="start" gap={3}>
                              <Box>
                                <Text
                                  fontSize="sm"
                                  fontWeight="600"
                                  color="text-strong"
                                >
                                  {activity.userName ||
                                    activity.userEmail ||
                                    'Sistem'}
                                </Text>
                                {activity.action && (
                                  <Text fontSize="xs" color="text-muted">
                                    {activity.action}
                                  </Text>
                                )}
                              </Box>
                              <Text
                                fontSize="xs"
                                color="text-muted"
                                whiteSpace="nowrap"
                              >
                                {format(
                                  new Date(activity.timestamp),
                                  'dd MMM yyyy, HH:mm',
                                  { locale: id }
                                )}
                              </Text>
                            </HStack>
                            <VStack align="stretch" spacing={1} mt={2}>
                              {activity.changes.map((change, index) =>
                                change.field === 'imageUrl' ? (
                                  <Text
                                    key={`${activity.id}-${index}`}
                                    fontSize="sm"
                                    color="text-body"
                                  >
                                    Gambar diperbarui
                                  </Text>
                                ) : (
                                  <Text
                                    key={`${activity.id}-${index}`}
                                    fontSize="sm"
                                    color="text-body"
                                  >
                                    <Text as="span" fontWeight="500">
                                      {change.label}
                                    </Text>
                                    {': '}
                                    <Text as="span" color="red.500">
                                      {change.from}
                                    </Text>
                                    {' → '}
                                    <Text as="span" color="green.600">
                                      {change.to}
                                    </Text>
                                  </Text>
                                )
                              )}
                            </VStack>
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>
        </VStack>
      )}
    </Layout>
  )
}
