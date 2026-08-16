'use client'

import React, { useState, useMemo, memo } from 'react'

import { AddIcon, MinusIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Center,
  Text,
  Stack,
  Image,
  Input,
  InputGroup,
  Badge
} from '@chakra-ui/react'
import Link from 'next/link'

import { IProduct } from '@/interfaces'
import { currency, date } from '@/utils'

function CardProduct({
  product,
  qty,
  onAddQty,
  onRemoveQty,
  onUpdateQty
}: Props) {
  const { name, price, vendor, imageUrl } = product

  // Safeguard against undefined vendor
  const safeVendor = vendor || { name: 'Baf Kitchen' }
  const [cartState, setCartState] = useState<CartState>('default')

  const cartQty = useMemo(() => qty, [qty])
  const isPreorder = product.availability === 'preorder'

  return (
    <Center>
      <Box
        role="group"
        w="full"
        bg="white"
        boxShadow="sm"
        rounded="xl"
        overflow="hidden"
        pos="relative"
        zIndex={1}
        transition="all 0.2s"
        _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
      >
        <Box position="relative">
          <Image
            height={160}
            width="full"
            objectFit="cover"
            src={imageUrl || '/placeholder.png'}
            alt={name}
          />
          <Badge
            position="absolute"
            top={3}
            left={3}
            colorScheme={isPreorder ? 'orange' : 'green'}
            variant="solid"
            textTransform="uppercase"
            fontSize="xs"
            px={2}
            py={1}
            rounded="full"
          >
            {isPreorder ? 'Pre-order' : 'Ready'}
          </Badge>
        </Box>

        <Stack align="left" p={4} spacing={1}>
          <Link href={`/s/${safeVendor.name}`}>
            <Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
              {safeVendor.name}
            </Text>
          </Link>
          <Text fontSize="md" fontWeight="semibold" fontFamily="body" noOfLines={1}>
            {name}
          </Text>
          <Text fontSize="sm" color="green.700" fontWeight="medium">
            {currency.toIDRFormat(price)}
          </Text>
          {isPreorder && product.preorderStart && product.preorderEnd && (
            <Text fontSize="xs" color="orange.600">
              {date.formatDateRange(product.preorderStart, product.preorderEnd)}
            </Text>
          )}
        </Stack>
        <Stack p={3} align="center" justify="center">
          {cartState === 'default' && qty === 0 && (
            <Button
              w="full"
              size="sm"
              colorScheme="green"
              onClick={() => setCartState('setQuantity')}
            >
              Tambah
            </Button>
          )}
          {(cartState === 'setQuantity' || qty > 0) && (
            <InputGroup bg="gray.100" w="full" rounded="xl" size="sm">
              <Button
                bg="white"
                roundedTopRight="0"
                roundedBottomRight="0"
                borderWidth="1px"
                borderColor="green.500"
                onClick={onRemoveQty}
              >
                <MinusIcon color="red.700" />
              </Button>
              <Input
                onChange={(e) => onUpdateQty(Number(e.target.value))}
                textAlign="center"
                maxLength={2}
                value={cartQty}
                px="4px"
                rounded="0"
                type="number"
                bg="white"
                borderTopWidth="1px"
                borderBottomWidth="1px"
                borderTopColor="green.500"
                borderBottomColor="green.500"
              />
              <Button
                bg="white"
                roundedTopLeft="0"
                roundedBottomLeft="0"
                borderWidth="1px"
                borderColor="green.500"
                onClick={onAddQty}
              >
                <AddIcon color="green" />
              </Button>
            </InputGroup>
          )}
        </Stack>
      </Box>
    </Center>
  )
}

type Props = {
  product: IProduct.IProductResponse
  qty: number
  // eslint-disable-next-line no-unused-vars
  onUpdateQty: (qty: number) => void
  onAddQty: () => void
  onRemoveQty: () => void
}

type CartState = 'default' | 'setQuantity'

export default memo(CardProduct)
