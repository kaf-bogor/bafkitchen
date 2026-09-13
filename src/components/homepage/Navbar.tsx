'use client'

import React from 'react'

import { CloseIcon, HamburgerIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  useDisclosure,
  Stack
} from '@chakra-ui/react'
import Link from 'next/link'
import { FaCartShopping } from 'react-icons/fa6'

import { useAuth } from '@/app/UserProvider'
import { Brand, UserMenu } from '@/components/ui'
import { useCart } from '@/hooks/useCart'

const CONTENT_PX = { base: 4, sm: 6, lg: 8 }

export default function Navbar() {
  const cart = useCart()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { user } = useAuth()
  const cartCount = cart.getTotalQuantity ? cart.getTotalQuantity() : 0
  const displayCount = cartCount > 99 ? '99+' : cartCount

  return (
    <Box
      as="header"
      position="fixed"
      top="0"
      insetX="0"
      zIndex={999}
      bg="rgba(255, 255, 255, 0.92)"
      backdropFilter="saturate(180%) blur(8px)"
      borderBottom="1px solid"
      borderColor="gray.100"
    >
      <Box px={CONTENT_PX}>
        <Flex
          h={16}
          w="full"
          maxW="1200px"
          mx="auto"
          alignItems="center"
          justifyContent="space-between"
          gap={3}
        >
          <HStack spacing={1} flexShrink={0} minW={0}>
            <IconButton
              size="md"
              icon={isOpen ? <CloseIcon boxSize={3.5} /> : <HamburgerIcon />}
              aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
              display={{ md: 'none' }}
              variant="ghost"
              onClick={isOpen ? onClose : onOpen}
            />
            <Brand />
          </HStack>

          <HStack spacing={{ base: 1, sm: 3 }} flexShrink={0}>
            <Link
              href="/cart"
              aria-label="Keranjang belanja"
              style={{ textDecoration: 'none' }}
            >
              <Box
                as="span"
                position="relative"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                p={2}
                borderRadius="full"
                color="gray.700"
                _hover={{ bg: 'gray.100', color: 'gray.900' }}
              >
                <FaCartShopping size={21} />
                {cartCount > 0 && (
                  <Flex
                    position="absolute"
                    top="-2px"
                    right="-2px"
                    minW="20px"
                    h="20px"
                    px="5px"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="full"
                    bg="brand.600"
                    color="white"
                    fontSize="11px"
                    fontWeight="700"
                  >
                    {displayCount}
                  </Flex>
                )}
              </Box>
            </Link>

            {user ? (
              <UserMenu redirectTo="/" />
            ) : (
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <Button
                  display={{ base: 'none', sm: 'inline-flex' }}
                  variant="subtle"
                  size="sm"
                >
                  Masuk
                </Button>
              </Link>
            )}
          </HStack>
        </Flex>
      </Box>

      {isOpen && (
        <Box as="nav" pb={4} px={CONTENT_PX} display={{ md: 'none' }} bg="white">
          <Box maxW="1200px" mx="auto">
            <Stack spacing={1}>
              <Link href="/" onClick={onClose}>
                <Box
                  px={3}
                  py={2.5}
                  borderRadius="lg"
                  fontSize="sm"
                  fontWeight="500"
                  color="gray.700"
                  _hover={{ bg: 'gray.100' }}
                >
                  Beranda
                </Box>
              </Link>
              {!user && (
                <Link href="/login" onClick={onClose}>
                  <Box
                    px={3}
                    py={2.5}
                    borderRadius="lg"
                    fontSize="sm"
                    fontWeight="500"
                    color="gray.700"
                    _hover={{ bg: 'gray.100' }}
                  >
                    Masuk
                  </Box>
                </Link>
              )}
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  )
}
