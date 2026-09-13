'use client'

import React from 'react'

import { ChevronRightIcon } from '@chakra-ui/icons'
import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import Link from 'next/link'
import { FaCartShopping } from 'react-icons/fa6'

import { useCart } from '@/hooks/useCart'
import { currency } from '@/utils'

const GLASS_BLUR = 'blur(22px) saturate(180%)'

export default function FloatingCartBar() {
  const cart = useCart()
  const totalQty = cart.getTotalQuantity ? cart.getTotalQuantity() : 0
  const totalPrice = cart.getTotalPrice ? cart.getTotalPrice() : 0

  if (totalQty === 0) return null

  return (
    <Box
      position="fixed"
      bottom="calc(16px + env(safe-area-inset-bottom))"
      left="50%"
      transform="translateX(-50%)"
      w={{ base: 'calc(100% - 32px)', sm: 'auto' }}
      minW={{ sm: '400px' }}
      maxW="md"
      zIndex={998}
    >
      <Link href="/cart" style={{ textDecoration: 'none' }}>
        <Box
          position="relative"
          overflow="hidden"
          h="64px"
          px={2.5}
          borderRadius="full"
          bg="rgba(255, 255, 255, 0.6)"
          backdropFilter={GLASS_BLUR}
          sx={{ WebkitBackdropFilter: GLASS_BLUR }}
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.7)"
          boxShadow="0 16px 40px -12px rgba(16, 24, 40, 0.32), 0 2px 8px rgba(16, 24, 40, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.85)"
          transition="transform 0.2s ease, box-shadow 0.2s ease"
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow:
              '0 20px 46px -12px rgba(16, 24, 40, 0.36), 0 2px 10px rgba(16, 24, 40, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
          }}
          _active={{ transform: 'translateY(0) scale(0.99)' }}
        >
          {/* Specular highlight */}
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            h="55%"
            bgGradient="linear(to-b, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0))"
            pointerEvents="none"
          />

          <Flex
            position="relative"
            w="full"
            h="full"
            justify="space-between"
            align="center"
            gap={4}
          >
            <Flex align="center" gap={3} minW={0}>
              <Flex
                w="46px"
                h="46px"
                borderRadius="full"
                flexShrink={0}
                align="center"
                justify="center"
                color="white"
                bgGradient="linear(to-b, brand.400, brand.600)"
                boxShadow="0 6px 16px rgba(22, 163, 74, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4)"
              >
                <FaCartShopping size={18} />
              </Flex>
              <VStack align="start" spacing={0} minW={0}>
                <Text
                  fontSize="xs"
                  color="gray.600"
                  fontWeight="600"
                  lineHeight="1.2"
                >
                  {totalQty} item
                </Text>
                <Text
                  fontSize="md"
                  fontWeight="700"
                  color="gray.900"
                  letterSpacing="-0.01em"
                  lineHeight="1.25"
                  noOfLines={1}
                >
                  {currency.toIDRFormat(totalPrice)}
                </Text>
              </VStack>
            </Flex>

            <Flex
              align="center"
              gap={1}
              flexShrink={0}
              pr={2}
              color="gray.800"
              fontWeight="600"
              fontSize="sm"
            >
              <Text display={{ base: 'none', sm: 'block' }}>
                Lihat keranjang
              </Text>
              <ChevronRightIcon />
            </Flex>
          </Flex>
        </Box>
      </Link>
    </Box>
  )
}
