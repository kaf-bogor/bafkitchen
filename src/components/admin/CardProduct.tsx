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

import { IProductResponse } from '@/interfaces/product'
import { currency } from '@/utils'

export default function CardProduct({
  product,
  editable = true,
  onDelete,
  isDeleting
}: Props) {
  const { id, name, price, imageUrl } = product
  return (
    <Box
      role="group"
      maxW="330px"
      w="full"
      bg={useColorModeValue('white', 'gray.800')}
      boxShadow="sm"
      rounded="lg"
      pos="relative"
      zIndex={1}
    >
      <Image
        height={160}
        width="full"
        objectFit="cover"
        src={imageUrl}
        alt="#"
      />

      <Stack align="left" p={6}>
        <Text color="gray.500" fontSize="sm" textTransform="uppercase">
          {product.vendor?.name || 'No Vendor'}
        </Text>
        <Text fontSize="md" fontFamily="body">
          {name}
        </Text>
        <Text fontSize="sm">{currency.toIDRFormat(price)}</Text>
      </Stack>
      <Stack px={6} pb={3}>
        <ButtonGroup gap={2}>
          {editable && (
            <Button size="sm" colorScheme="blue">
              <Link href={`/admin/products/${id}/edit`}>Edit</Link>
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              colorScheme="red"
              onClick={() => onDelete(product.id)}
              isLoading={isDeleting}
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
