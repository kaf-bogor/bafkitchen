'use client'
import React from 'react'

import {
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  FormErrorMessage
} from '@chakra-ui/react'

import { IOrder } from '@/interfaces'

interface OrdererInputProps {
  order: IOrder.IOrdererInputForm
  errors: any
  // eslint-disable-next-line no-unused-vars
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export default function OrdererInput({
  order,
  errors,
  onChange
}: OrdererInputProps) {
  return (
    <VStack spacing={4} align="stretch">
      <FormControl isInvalid={!!errors.name}>
        <FormLabel>Nama lengkap</FormLabel>
        <Input
          name="name"
          value={order.name}
          onChange={onChange}
          placeholder="Masukkan nama lengkap"
        />
        <FormErrorMessage>{errors.name}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.phoneNumber}>
        <FormLabel>No. telepon</FormLabel>
        <Input
          name="phoneNumber"
          value={order.phoneNumber}
          onChange={onChange}
          placeholder="Contoh: 08123456789"
        />
        <FormErrorMessage>{errors.phoneNumber}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.notes}>
        <FormLabel>Catatan tambahan (opsional)</FormLabel>
        <Textarea
          name="notes"
          value={order.notes}
          onChange={onChange}
          placeholder="Catatan umum untuk pesanan ini (opsional)"
          rows={3}
        />
        <FormErrorMessage>{errors.notes}</FormErrorMessage>
      </FormControl>
    </VStack>
  )
}
