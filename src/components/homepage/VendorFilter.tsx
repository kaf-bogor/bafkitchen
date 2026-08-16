'use client'

import React, { useMemo } from 'react'

import { Box, Button, Flex, Tag, Text } from '@chakra-ui/react'

import type { IVendor } from '@/interfaces/vendor'

export default function VendorFilter({
  vendors,
  selectedVendorId,
  onChange
}: Props) {
  const activeCount = vendors.filter((v) => v.isActive).length
  const sorted = useMemo(
    () => [...vendors].sort((a, b) => a.name.localeCompare(b.name)),
    [vendors]
  )

  return (
    <Box w="full">
      <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>
        Filter Vendor
      </Text>
      <Flex flexWrap="wrap" gap={2}>
        <Button
          size="sm"
          variant={selectedVendorId ? 'outline' : 'solid'}
          colorScheme={selectedVendorId ? 'gray' : 'green'}
          rounded="full"
          onClick={() => onChange(null)}
        >
          Semua
          <Tag ml={2} size="sm" rounded="full" variant="subtle">
            {activeCount || sorted.length}
          </Tag>
        </Button>
        {sorted.map((vendor) => {
          const selected = selectedVendorId === vendor.id
          return (
            <Button
              key={vendor.id}
              size="sm"
              variant={selected ? 'solid' : 'outline'}
              colorScheme={selected ? 'green' : 'gray'}
              rounded="full"
              onClick={() => onChange(selected ? null : vendor.id)}
            >
              {vendor.name}
            </Button>
          )
        })}
      </Flex>
    </Box>
  )
}

type Props = {
  vendors: IVendor[]
  selectedVendorId: string | null
  onChange: (vendorId: string | null) => void
}
