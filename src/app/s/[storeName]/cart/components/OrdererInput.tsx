/* eslint-disable no-unused-vars */
import React from 'react'

import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea
} from '@chakra-ui/react'
import { FormikErrors } from 'formik'

import { IOrder } from '@/interfaces'

export default function OrdererInput({
  order,
  onChange,
  errors
}: IOrdererInputProps) {
  return (
    <>
      <FormControl isInvalid={!!errors?.name} mb={5}>
        <FormLabel>Nama:</FormLabel>
        <Input
          name="name"
          defaultValue={order.name}
          placeholder="Nama"
          onChange={onChange}
          type="text"
        />
        <FormErrorMessage>{errors?.name}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors?.phoneNumber} mb={5}>
        <FormLabel>Nomor Handphone:</FormLabel>
        <Input
          name="phoneNumber"
          defaultValue={order.phoneNumber}
          placeholder="No. Handphone"
          onChange={onChange}
          type="number"
        />
        <FormErrorMessage>{errors?.phoneNumber}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors?.namaSantri} mb={5}>
        <FormLabel>Nama Santri:</FormLabel>
        <Input
          name="namaSantri"
          defaultValue={order.namaSantri}
          placeholder="Nama Santri"
          onChange={onChange}
          type="text"
        />
        <FormErrorMessage>{errors?.namaSantri}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors?.kelas} mb={5}>
        <FormLabel>Kelas:</FormLabel>
        <Input
          name="kelas"
          defaultValue={order.kelas}
          placeholder="Kelas"
          onChange={onChange}
          type="text"
        />
        <FormErrorMessage>{errors?.kelas}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors?.notes} mb={5}>
        <FormLabel>Catatan (Opsional):</FormLabel>
        <Textarea
          name="notes"
          defaultValue={order.notes}
          placeholder="Tambahkan catatan khusus untuk pesanan..."
          onChange={onChange}
          rows={3}
        />
        <FormErrorMessage>{errors?.notes}</FormErrorMessage>
      </FormControl>
    </>
  )
}

interface IOrdererInputProps {
  order: IOrder.IOrdererInputForm
  errors: FormikErrors<IOrder.IOrdererInputForm>
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
}
