'use client'

import React, { memo } from 'react'

import { Badge, Box, Image, Text, VStack } from '@chakra-ui/react'

import { IProduct } from '@/interfaces'
import { currency } from '@/utils'

function ProductTile({ product, cartQty, onAdd }: Props) {
  const isOutOfStock = product.stock !== null && product.stock <= 0

  return (
    <Box
      as="button"
      w="full"
      bg="white"
      rounded="lg"
      boxShadow="sm"
      borderWidth="2px"
      borderColor={cartQty > 0 ? 'green.400' : 'transparent'}
      overflow="hidden"
      textAlign="left"
      position="relative"
      transition="all 0.15s ease"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
      _active={{ transform: 'scale(0.98)' }}
      onClick={() => !isOutOfStock && onAdd(product)}
      opacity={isOutOfStock ? 0.5 : 1}
      cursor={isOutOfStock ? 'not-allowed' : 'pointer'}
    >
      {cartQty > 0 && (
        <Badge
          position="absolute"
          top={2}
          right={2}
          colorScheme="green"
          rounded="full"
          px={2}
          fontSize="sm"
          zIndex={2}
        >
          {cartQty}
        </Badge>
      )}
      <Image
        src={product.imageUrl || '/logo.png'}
        alt={product.name}
        h="110px"
        w="full"
        objectFit="cover"
        fallbackSrc="/logo.png"
      />
      <VStack align="stretch" p={3} spacing={1}>
        <Text fontSize="sm" fontWeight="semibold" noOfLines={2} minH="40px">
          {product.name}
        </Text>
        <Text fontSize="sm" fontWeight="bold" color="green.600">
          {currency.toIDRFormat(product.price)}
        </Text>
        <Text fontSize="xs" color={isOutOfStock ? 'red.500' : 'gray.500'}>
          {isOutOfStock ? 'Stok habis' : `Stok: ${product.stock}`}
        </Text>
      </VStack>
    </Box>
  )
}

type Props = {
  product: IProduct.IProductResponse
  cartQty: number
  // eslint-disable-next-line no-unused-vars
  onAdd: (product: IProduct.IProductResponse) => void
}

export default memo(ProductTile)
