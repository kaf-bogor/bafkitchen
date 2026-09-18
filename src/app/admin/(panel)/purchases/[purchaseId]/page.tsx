'use client'

import React from 'react'

import {
  Box,
  HStack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { useGetPurchase } from '@/app/admin/(panel)/purchases/actions'
import { Layout } from '@/components'
import {
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  StatCard
} from '@/components/ui'
import { currency } from '@/utils'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <HStack justify="space-between" align="start">
      <Text fontSize="sm" color="text-muted">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="500" textAlign="right">
        {value}
      </Text>
    </HStack>
  )
}

export default function PurchaseDetailPage() {
  const params = useParams<{ purchaseId: string }>()
  const purchaseId = params?.purchaseId || ''
  const { data: purchase, loading, error } = useGetPurchase(purchaseId)

  return (
    <Layout error={error as Error} isFetching={loading}>
      <PageHeader
        title={purchase?.purchaseNumber || 'Detail pembelian'}
        subtitle={
          purchase?.purchaseDate
            ? format(new Date(purchase.purchaseDate), 'EEEE, dd MMMM yyyy', {
                locale: id
              })
            : undefined
        }
        breadcrumbs={[
          { label: 'Dasbor', path: '/admin' },
          { label: 'Pembelian', path: '/admin/purchases' },
          { label: purchase?.purchaseNumber || 'Detail' }
        ]}
        actions={
          <Link href="/admin/purchases">
            <Text fontSize="sm" color="brand.600" fontWeight="600">
              ← Kembali
            </Text>
          </Link>
        }
      />

      {purchase && (
        <VStack align="stretch" spacing={6}>
          <Box display={{ base: 'block', lg: 'none' }}>
            <VStack align="stretch" spacing={4}>
              <StatCard
                label="Total belanja"
                value={currency.toIDRFormat(purchase.totalCost)}
                sublabel={`${purchase.totalQty} qty`}
                tone="gray"
              />
              <StatCard
                label="Potensi laba"
                value={currency.toIDRFormat(purchase.totalMargin)}
                sublabel="(harga jual − HPP) × qty"
                tone="green"
              />
            </VStack>
          </Box>

          <Box display={{ base: 'none', lg: 'block' }}>
            <HStack spacing={5}>
              <Box flex="1">
                <StatCard
                  label="Total belanja"
                  value={currency.toIDRFormat(purchase.totalCost)}
                  sublabel={`${purchase.totalQty} qty`}
                  tone="gray"
                />
              </Box>
              <Box flex="1">
                <StatCard
                  label="Potensi laba"
                  value={currency.toIDRFormat(purchase.totalMargin)}
                  sublabel="(harga jual − HPP) × qty"
                  tone="green"
                />
              </Box>
            </HStack>
          </Box>

          <Card>
            <CardHeader title="Informasi nota" />
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <InfoRow label="Supplier" value={purchase.supplier || '-'} />
                <InfoRow
                  label="Tanggal"
                  value={
                    purchase.purchaseDate
                      ? format(
                          new Date(purchase.purchaseDate),
                          'dd MMM yyyy',
                          { locale: id }
                        )
                      : '-'
                  }
                />
                <InfoRow label="Catatan" value={purchase.note || '-'} />
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Produk"
              description={`${purchase.items.length} produk dalam nota ini`}
            />
            <CardBody p={0}>
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Produk</Th>
                      <Th isNumeric>Qty</Th>
                      <Th isNumeric>HPP beli</Th>
                      <Th isNumeric>Harga jual</Th>
                      <Th isNumeric>Subtotal</Th>
                      <Th isNumeric>Laba/unit</Th>
                      <Th isNumeric>Total laba</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {purchase.items.map((item) => (
                      <Tr key={item.id}>
                        <Td>
                          <Text fontWeight="600">
                            {item.productName || '-'}
                          </Text>
                        </Td>
                        <Td isNumeric>{item.qty}</Td>
                        <Td isNumeric>
                          {currency.toIDRFormat(item.costPrice)}
                        </Td>
                        <Td isNumeric>
                          {currency.toIDRFormat(item.sellPrice)}
                        </Td>
                        <Td isNumeric>
                          {currency.toIDRFormat(item.subtotal)}
                        </Td>
                        <Td isNumeric>
                          {currency.toIDRFormat(item.margin)}
                        </Td>
                        <Td isNumeric>
                          <Text fontWeight="600" color="brand.700">
                            {currency.toIDRFormat(item.margin * item.qty)}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        </VStack>
      )}
    </Layout>
  )
}
