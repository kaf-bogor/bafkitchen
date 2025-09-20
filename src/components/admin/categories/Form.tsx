import React from 'react'

import { Button, FormControl, FormLabel, Input, Select } from '@chakra-ui/react'

import { ICategory } from '@/interfaces'
import { IVendor } from '@/interfaces/vendor'

export default function Form({
  category,
  vendors,
  onChange,
  isLoading = false,
  onSubmit
}: Props) {
  return (
    <>
      <FormControl marginBottom={2}>
        <FormLabel>Name</FormLabel>
        <Input
          placeholder="Category Name"
          value={category.name}
          onChange={onChange}
          name="name"
        />
      </FormControl>
      <FormControl>
        <FormLabel>Vendor</FormLabel>
        <Select
          placeholder="Select Vendor"
          value={category.vendorId}
          onChange={onChange}
          name="vendorId"
        >
          {vendors.map((vendor) => {
            return (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            )
          })}
        </Select>
      </FormControl>
      <FormControl mt={6}>
        <Button
          mr={3}
          w="full"
          isLoading={isLoading}
          colorScheme="blue"
          onClick={onSubmit}
          isDisabled={!category.vendorId && !category.name}
        >
          Simpan
        </Button>
      </FormControl>
    </>
  )
}

type InputCategory =
  | ICategory.ICreateCategoryRequest
  | ICategory.IUpdateCategoryRequest
type Props = {
  category: InputCategory
  vendors: IVendor[]
  onChange: (
    // eslint-disable-next-line no-unused-vars
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void
  isLoading?: boolean
  onSubmit: () => void
}
