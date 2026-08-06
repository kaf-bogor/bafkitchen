'use client'

import React, { useMemo } from 'react'

import {
  Box,
  Divider,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  VStack
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

import CardStats from '@/components/admin/CardStats'
import { IOrder } from '@/interfaces'
import { currency } from '@/utils'

export default function DailySummaryModal({ isOpen, onClose, orders }: Props) {
  const summary = useMemo(() => {
    const revenue = orders.reduce((acc, o) => acc + (o.total || 0), 0)
    const itemsSold = orders.reduce(
      (acc, o) =>
        acc +
        (o.productOrders || []).reduce((a, po) => a + (po.quantity || 0), 0),
      0
    )

    const byMethod: Record<string, { count: number; total: number }> = {}
    orders.forEach((o) => {
      const method = o.payment?.method || 'Lainnya'
      if (!byMethod[method]) byMethod[method] = { count: 0, total: 0 }
      byMethod[method].count += 1
      byMethod[method].total += o.total || 0
    })

    const productMap = new Map<string, { name: string; qty: number }>()
    orders.forEach((o) => {
      ;(o.productOrders || []).forEach((po) => {
        const key = po.productId || po.product?.id
        if (!key) return
        const existing = productMap.get(key)
        productMap.set(key, {
          name: po.product?.name || '-',
          qty: (existing?.qty || 0) + (po.quantity || 0)
        })
      })
    })
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    return { revenue, itemsSold, byMethod, topProducts }
  }, [orders])

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Ringkasan Penjualan POS —{' '}
          {format(new Date(), 'dd MMMM yyyy', { locale: id })}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <SimpleGrid columns={3} gap={4} mb={6}>
            <CardStats label="Transaksi" value={orders.length} />
            <CardStats
              label="Pendapatan"
              value={currency.toIDRFormat(summary.revenue)}
            />
            <CardStats label="Item Terjual" value={summary.itemsSold} />
          </SimpleGrid>

          <Text fontWeight="bold" mb={2}>
            Per Metode Pembayaran
          </Text>
          <VStack align="stretch" spacing={1} mb={4}>
            {Object.keys(summary.byMethod).length === 0 && (
              <Text color="gray.400">Belum ada transaksi hari ini</Text>
            )}
            {Object.entries(summary.byMethod).map(([method, data]) => (
              <Flex key={method} justify="space-between">
                <Text>
                  {method} ({data.count}x)
                </Text>
                <Text fontWeight="medium">
                  {currency.toIDRFormat(data.total)}
                </Text>
              </Flex>
            ))}
          </VStack>

          <Divider my={3} />

          <Text fontWeight="bold" mb={2}>
            Produk Terlaris
          </Text>
          <VStack align="stretch" spacing={1}>
            {summary.topProducts.length === 0 && (
              <Text color="gray.400">Belum ada produk terjual hari ini</Text>
            )}
            {summary.topProducts.map((p, idx) => (
              <Flex key={idx} justify="space-between">
                <Text>
                  {idx + 1}. {p.name}
                </Text>
                <Text fontWeight="medium">{p.qty} terjual</Text>
              </Flex>
            ))}
          </VStack>
          <Box h={2} />
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

type Props = {
  isOpen: boolean
  onClose: () => void
  orders: IOrder.IOrder[]
}
