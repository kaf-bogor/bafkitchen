'use client'

import React, { useState, memo } from 'react'

import { AddIcon, MinusIcon } from '@chakra-ui/icons'
import { Box, Button, Flex, Input, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'

import ProductImage from '@/components/ProductImage'
import { IProduct } from '@/interfaces'
import { currency, date, discount as discountUtil } from '@/utils'

function CardProduct({
  product,
  qty,
  onAddQty,
  onRemoveQty,
  onUpdateQty
}: Props) {
  const { name, price, vendor, imageUrl, discounts } = product

  const safeVendor = vendor || { name: 'Bazaf' }
  const [cartState, setCartState] = useState<CartState>('default')
  const isPreorder = product.availability === 'preorder'
  const availabilityLabel = isPreorder ? 'Pre-order' : 'Tersedia'

  const pricing = discountUtil.getLinePricing(
    price,
    qty > 0 ? qty : 1,
    discounts
  )
  const teaser = discountUtil.getTeaserDiscount(discounts)
  const hasDiscount = pricing.amount > 0
  const badgeLabel = hasDiscount
    ? discountUtil.discountLabel(pricing.discount!)
    : teaser && (teaser.minQuantity || 1) > 1
      ? `Diskon mulai ${teaser.minQuantity} pcs`
      : null

  return (
    <Box
      as="article"
      role="group"
      display="flex"
      flexDir="column"
      h="full"
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.100"
      overflow="hidden"
      transition="border-color 0.2s, box-shadow 0.2s"
      _hover={{
        borderColor: 'gray.200',
        boxShadow: '0 12px 28px -14px rgba(16, 24, 40, 0.18)'
      }}
    >
      <Box position="relative">
        <ProductImage
          height={{ base: 160, sm: 176 }}
          width="full"
          objectFit="cover"
          src={imageUrl}
          alt={name}
        />
        <Flex position="absolute" top={3} left={3}>
          <Flex
            alignItems="center"
            gap={1.5}
            bg="whiteAlpha.900"
            py={1}
            px={2.5}
            borderRadius="full"
            boxShadow="sm"
          >
            <Box
              w={1.5}
              h={1.5}
              borderRadius="full"
              bg={isPreorder ? 'orange.500' : 'green.500'}
            />
            <Text fontSize="xs" fontWeight="600" color="gray.700">
              {availabilityLabel}
            </Text>
          </Flex>
        </Flex>
        {badgeLabel && (
          <Flex
            position="absolute"
            top={3}
            right={3}
            bg="red.500"
            color="white"
            py={1}
            px={2.5}
            borderRadius="full"
            boxShadow="sm"
          >
            <Text fontSize="xs" fontWeight="700">
              {badgeLabel}
            </Text>
          </Flex>
        )}
      </Box>

      <Stack p={4} spacing={1.5} flex="1" align="stretch">
        <Link
          href={`/s/${safeVendor.name}`}
          style={{ alignSelf: 'flex-start' }}
        >
          <Text
            fontSize="xs"
            fontWeight="600"
            letterSpacing="wider"
            textTransform="uppercase"
            color="gray.400"
            _hover={{ color: 'brand.600' }}
            transition="color 0.2s"
          >
            {safeVendor.name}
          </Text>
        </Link>
        <Text
          fontSize="md"
          fontWeight="600"
          color="gray.800"
          lineHeight="1.35"
          noOfLines={2}
        >
          {name}
        </Text>
        {isPreorder && product.preorderStart && product.preorderEnd && (
          <Text fontSize="xs" color="gray.500" lineHeight="1.4">
            {date.formatDateRange(product.preorderStart, product.preorderEnd)}
          </Text>
        )}
        {hasDiscount ? (
          <Flex mt="auto" pt={1} align="baseline" gap={2} wrap="wrap">
            <Text
              fontSize="lg"
              fontWeight="700"
              color="brand.700"
              letterSpacing="-0.01em"
            >
              {currency.toIDRFormat(pricing.unitPrice)}
            </Text>
            <Text fontSize="sm" color="gray.400" textDecoration="line-through">
              {currency.toIDRFormat(price)}
            </Text>
          </Flex>
        ) : (
          <Text
            mt="auto"
            pt={1}
            fontSize="lg"
            fontWeight="700"
            color="brand.700"
            letterSpacing="-0.01em"
          >
            {currency.toIDRFormat(price)}
          </Text>
        )}
      </Stack>

      <Box p={3} pt={0}>
        {cartState === 'default' && qty === 0 ? (
          <Button
            w="full"
            bg="brand.600"
            color="white"
            fontWeight="600"
            _hover={{ bg: 'brand.700' }}
            _active={{ bg: 'brand.800' }}
            onClick={() => setCartState('setQuantity')}
          >
            Tambah
          </Button>
        ) : (
          <Flex gap={2} align="stretch">
            <Button
              variant="outline"
              flexShrink={0}
              w={11}
              px={0}
              color="gray.500"
              _hover={{
                bg: 'red.50',
                color: 'red.500',
                borderColor: 'red.200'
              }}
              _active={{ bg: 'red.100' }}
              onClick={() => onRemoveQty(product.id)}
              aria-label="Kurangi jumlah"
            >
              <MinusIcon boxSize={3.5} />
            </Button>
            <Input
              variant="outline"
              className="no-spinner"
              flex="1"
              minW={0}
              value={qty}
              onChange={(e) => onUpdateQty(product.id, Number(e.target.value))}
              type="number"
              textAlign="center"
              fontWeight="600"
              fontSize="md"
              color="gray.800"
              min={1}
              maxLength={2}
              px={1}
            />
            <Button
              variant="outline"
              flexShrink={0}
              w={11}
              px={0}
              color="brand.700"
              _hover={{
                bg: 'green.50',
                color: 'brand.700',
                borderColor: 'green.300'
              }}
              _active={{ bg: 'green.100' }}
              onClick={() => onAddQty(product)}
              aria-label="Tambah jumlah"
            >
              <AddIcon boxSize={3.5} />
            </Button>
          </Flex>
        )}
      </Box>
    </Box>
  )
}

type Props = {
  product: IProduct.IProductResponse
  qty: number
  // eslint-disable-next-line no-unused-vars
  onUpdateQty: (productId: string, qty: number) => void
  onAddQty: (product: IProduct.IProductResponse) => void
  onRemoveQty: (productId: string) => void
}

type CartState = 'default' | 'setQuantity'

export default memo(CardProduct)
