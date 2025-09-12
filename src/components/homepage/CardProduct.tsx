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
  InputGroup
} from '@chakra-ui/react'
import Link from 'next/link'

import { IProduct } from '@/interfaces'
import { currency } from '@/utils'

function CardProduct({
  product,
  qty,
  onAddQty,
  onRemoveQty,
  onUpdateQty
}: Props) {
  const { name, price, store, imageUrl } = product
  
  // Safeguard against undefined store
  const safeStore = store || { name: 'Unknown Store' }
  const [cartState, setCartState] = useState<CartState>('default')

  const cartQty = useMemo(() => qty, [qty])

  return (
    <Center>
      <Box
        role="group"
        w="full"
        bg="white"
        boxShadow="md"
        rounded="lg"
        pos="relative"
        zIndex={1}
      >
        <Image
          roundedTopLeft="lg"
          roundedTopRight="lg"
          height={160}
          width="full"
          objectFit="cover"
          src={imageUrl}
          alt="#"
        />

        <Stack align="left" p={6}>
          <Link href={`/s/${safeStore.name}`}>
            <Text color="gray.500" fontSize="sm" textTransform="uppercase">
              {safeStore.name}
            </Text>
          </Link>
          <Text fontSize="md" fontFamily="body" noOfLines={1}>
            {name}
          </Text>
          <Text fontSize="sm">{currency.toIDRFormat(price)}</Text>
        </Stack>
        <Stack p={3} align="center" justify="center">
          {cartState === 'default' && qty === 0 && (
            <Button
              w="50%"
              colorScheme="green"
              onClick={() => setCartState('setQuantity')}
            >
              Tambah
            </Button>
          )}
          {(cartState === 'setQuantity' || qty > 0) && (
            <InputGroup bg="gray.200" w="50%" rounded="2xl">
              <Button
                bg="white"
                roundedTopRight="0"
                roundedBottomRight="0"
                borderWidth="1px"
                borderColor="green"
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
                borderTopColor="green"
                borderBottomColor="green"
              />
              <Button
                bg="white"
                roundedTopLeft="0"
                roundedBottomLeft="0"
                borderWidth="1px"
                borderColor="green"
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
