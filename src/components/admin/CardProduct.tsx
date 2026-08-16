'use client'

import React from 'react'

import {
  Box,
  Button,
  ButtonGroup,
  useColorModeValue,
  Text,
  Stack,
  Image
} from '@chakra-ui/react'
import Link from 'next/link'

import { StatusBadge } from '@/components/ui'
import { IProductResponse } from '@/interfaces/product'
import { currency, date } from '@/utils'

export default function CardProduct({
  product,
  editable = true,
  onDelete,
  isDeleting
}: Props) {
  const { id, name, price, imageUrl } = product
  const isPreorder = product.availability === 'preorder'
  return (
    <Box
      role="group"
      maxW="330px"
      w="full"
      bg={useColorModeValue('white', 'gray.800')}
      border="1px solid"
      borderColor="gray.200"
      boxShadow="sm"
      rounded="xl"
      overflow="hidden"
      pos="relative"
      zIndex={1}
      transition="all 0.2s"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
    >
      <Box position="relative">
        <Image
          height={160}
          width="full"
          objectFit="cover"
          src={imageUrl || '/placeholder.png'}
          alt={name}
        />
        <Box position="absolute" top={3} left={3}>
          <StatusBadge color={isPreorder ? 'orange' : 'green'}>
            {isPreorder ? 'Pre-order' : 'Ready'}
          </StatusBadge>
        </Box>
      </Box>

      <Stack align="left" p={5}>
        <Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
          {product.vendor?.name || 'No Vendor'}
        </Text>
        <Text fontSize="md" fontWeight="600" fontFamily="body" noOfLines={1}>
          {name}
        </Text>
        <Text fontSize="sm" fontWeight="600" color="brand.700">
          {currency.toIDRFormat(price)}
        </Text>
        {isPreorder && product.preorderStart && product.preorderEnd && (
          <Text fontSize="xs" color="orange.600">
            {date.formatDateRange(product.preorderStart, product.preorderEnd)}
          </Text>
        )}
      </Stack>
      <Stack px={5} pb={4}>
        <ButtonGroup gap={2} w="full">
          {editable && (
            <Button
              as={Link}
              href={`/admin/products/${id}/edit`}
              size="sm"
              colorScheme="brand"
              flex="1"
            >
              Ubah
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              colorScheme="red"
              variant="outline"
              onClick={() => onDelete(product.id)}
              isLoading={isDeleting}
              flex="1"
            >
              Hapus
            </Button>
          )}
        </ButtonGroup>
      </Stack>
    </Box>
  )
}

interface Props {
  product: IProductResponse
  editable?: boolean
  // eslint-disable-next-line no-unused-vars
  onDelete?: (productId: string) => void
  isDeleting?: boolean
}
