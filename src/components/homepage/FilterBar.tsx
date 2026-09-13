'use client'

import React from 'react'

import { Select, SimpleGrid } from '@chakra-ui/react'

export type FilterOption = {
  id: string
  name: string
}

export default function FilterBar({
  categories,
  vendors,
  selectedCategoryId,
  selectedVendorId,
  onCategoryChange,
  onVendorChange
}: Props) {
  return (
    <SimpleGrid columns={2} gap={2} w="full">
      <Select
        aria-label="Filter kategori"
        placeholder="Semua kategori"
        value={selectedCategoryId || ''}
        onChange={(e) => onCategoryChange(e.target.value || null)}
        h={9}
        w="full"
        borderRadius="lg"
        fontWeight="600"
        fontSize="sm"
        bg="white"
        borderColor="gray.200"
        color={selectedCategoryId ? 'gray.900' : 'gray.600'}
        _hover={{ borderColor: 'gray.300' }}
        focusBorderColor="brand.500"
      >
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filter vendor"
        placeholder="Semua vendor"
        value={selectedVendorId || ''}
        onChange={(e) => onVendorChange(e.target.value || null)}
        h={9}
        w="full"
        borderRadius="lg"
        fontWeight="600"
        fontSize="sm"
        bg="white"
        borderColor="gray.200"
        color={selectedVendorId ? 'gray.900' : 'gray.600'}
        _hover={{ borderColor: 'gray.300' }}
        focusBorderColor="brand.500"
      >
        {vendors.map((vendor) => (
          <option key={vendor.id} value={vendor.id}>
            {vendor.name}
          </option>
        ))}
      </Select>
    </SimpleGrid>
  )
}

type Props = {
  categories: FilterOption[]
  vendors: FilterOption[]
  selectedCategoryId: string | null
  selectedVendorId: string | null
  onCategoryChange: (id: string | null) => void
  onVendorChange: (id: string | null) => void
}
