/* eslint-disable no-unused-vars */
import React, { useCallback } from 'react'

import { Box, SimpleGrid, Text, VStack } from '@chakra-ui/react'

import { CardProduct } from '@/components/homepage'
import { IProduct, ISchedule } from '@/interfaces'
import { CartState, CartActions } from '@/stores/useCart'
import { date } from '@/utils'

export default function TabContent({
  cart,
  schedules,
  day,
  onAddQty,
  onUpdateQty,
  onRemoveQty
}: Props) {
  return (
    <Box>
      <Text w="full" fontStyle="bold" mb={3}>
        <b>{date.formatDate(day)}</b>
      </Text>
      {date.getScheduleForDay(day, schedules).length > 0 ? (
        <SimpleGrid columns={[1, 2, 3, 4]} gap={6}>
          {date
            .getScheduleForDay(day, schedules)
            .flatMap((schedule) =>
              schedule.products.map((product) => (
                <CardProduct
                  qty={
                    cart.getTotalQuantity
                      ? cart.getTotalQuantity(product.id)
                      : 0
                  }
                  onUpdateQty={(qty) => onUpdateQty(product.id, qty)}
                  onAddQty={() => onAddQty(product)}
                  onRemoveQty={() => onRemoveQty(product.id)}
                  product={product}
                  key={product.id}
                />
              ))
            )}
        </SimpleGrid>
      ) : (
        <VStack align="start" gap={6}>
          <Text w="full">Tidak ada menu untuk tanggal ini`</Text>
        </VStack>
      )}
    </Box>
  )
}

type Props = {
  query: string
  day: Date
  schedules: ISchedule.ISchedule[]
  cart: CartState & CartActions
  onAddQty: (product: IProduct.IProductResponse) => void
  onUpdateQty: (productId: string, qty: number) => void
  onRemoveQty: (productId: string) => void
}
