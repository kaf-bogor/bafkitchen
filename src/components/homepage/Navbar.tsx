'use client'

import React from 'react'

import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  IconButton,
  useDisclosure,
  useColorModeValue,
  Stack,
  Tag,
  Text
} from '@chakra-ui/react'
import Link from 'next/link'
import { FaCartShopping } from 'react-icons/fa6'

import { useAuth } from '@/app/UserProvider'
import { useCart } from '@/hooks/useCart'

interface navLinkProps {
  children: React.ReactNode
}

// eslint-disable-next-line no-unused-vars
const NavLink = (props: navLinkProps) => {
  const { children } = props
  return (
    <Box
      px={2}
      py={1}
      rounded={'md'}
      _hover={{
        textDecoration: 'none',
        bg: useColorModeValue('gray.200', 'gray.700')
      }}
    >
      {children}
    </Box>
  )
}

export default function Navbar() {
  const cart = useCart()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { user } = useAuth()

  return (
    <Box
      bg={useColorModeValue('white', 'white')}
      px={4}
      w="full"
      boxShadow="sm"
      position="fixed"
      borderBottom="1px"
      borderBottomColor="gray.300"
      top="0"
      zIndex={999}
    >
      <Flex
        h={16}
        w={['100%', '100%', '100%', '100%', 1180]}
        mx="auto"
        alignItems={'center'}
        justifyContent={'space-between'}
      >
        <IconButton
          size={'md'}
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label={'Open Menu'}
          display={{ md: 'none' }}
          onClick={isOpen ? onClose : onOpen}
        />
        <HStack spacing={8} alignItems={'center'}>
          <Link href={`/`}>
              <Image src="/logo.png" alt="BAF Kitchen" height="56px" />
            </Link>
        </HStack>
        <Flex alignItems={'center'}>
          <Flex display={{ base: 'none', md: 'flex' }} mr={2}>
            {user ? (
              <Text ml={3}>{user.displayName}</Text>
            ) : (
              <Link href="/login">
                <Button colorScheme="green" variant="outline" size="sm" ml={4}>
                  Login
                </Button>
              </Link>
            )}
          </Flex>
          <Flex position="relative">
            <Link href="/cart">
              <Tag
                rounded="full"
                colorScheme="red"
                position="absolute"
                top={-2}
                right={-3}
                size="sm"
              >
                {cart.getTotalQuantity && cart.getTotalQuantity()}
              </Tag>
              <FaCartShopping color="green" size={24} />
            </Link>
          </Flex>
        </Flex>
      </Flex>

      {isOpen ? (
        <Box pb={4} display={{ md: 'none' }}>
          <Stack as={'nav'} spacing={4}></Stack>
          <NavLink>
            {user ? (
              <Text ml={3}>{user.displayName}</Text>
            ) : (
              <Link href="/login">
                <Text w="full">Login</Text>
              </Link>
            )}
          </NavLink>
        </Box>
      ) : null}
    </Box>
  )
}

