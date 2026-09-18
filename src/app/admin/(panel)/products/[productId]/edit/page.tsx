'use client'

import React from 'react'

import { Box, HStack, Text, useToast, VStack } from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useParams } from 'next/navigation'

import { useGetProduct, useUpdateProducts } from '@/app/admin/(panel)/products/actions'
import { Layout, ProductForm } from '@/components'
import { Card, CardBody, CardHeader } from '@/components/ui'

export default function Edit() {
  const { productId } = useParams()
  const {
    data: product,
    loading: isFetching,
    error,
    refetch
  } = useGetProduct(productId as string)

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
              title="Riwayat perubahan"
              description={`${activities.length} perubahan tercatat`}
            />
            <CardBody>
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
                        <Text fontSize="sm" fontWeight="600" color="text-strong">
                          {activity.userName || activity.userEmail || 'Sistem'}
                        </Text>
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
                        {activity.changes.map((change, index) => (
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
                        ))}
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </CardBody>
          </Card>
        </VStack>
      )}
    </Layout>
  )
}
