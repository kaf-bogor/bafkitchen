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
        <FormLabel>Full Name *</FormLabel>
        <Input
          name="name"
          value={order.name}
          onChange={onChange}
          placeholder="Enter your full name"
        />
        <FormErrorMessage>{errors.name}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.phoneNumber}>
        <FormLabel>Phone Number *</FormLabel>
        <Input
          name="phoneNumber"
          value={order.phoneNumber}
          onChange={onChange}
          placeholder="Enter your phone number"
        />
        <FormErrorMessage>{errors.phoneNumber}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.namaSantri}>
        <FormLabel>Nama Santri *</FormLabel>
        <Input
          name="namaSantri"
          value={order.namaSantri}
          onChange={onChange}
          placeholder="Enter santri name"
        />
        <FormErrorMessage>{errors.namaSantri}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.kelas}>
        <FormLabel>Kelas *</FormLabel>
        <Input
          name="kelas"
          value={order.kelas}
          onChange={onChange}
          placeholder="Enter class"
        />
        <FormErrorMessage>{errors.kelas}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.notes}>
        <FormLabel>Notes</FormLabel>
        <Textarea
          name="notes"
          value={order.notes}
          onChange={onChange}
          placeholder="Any additional notes (optional)"
          rows={3}
        />
        <FormErrorMessage>{errors.notes}</FormErrorMessage>
      </FormControl>
    </VStack>
  )
}
