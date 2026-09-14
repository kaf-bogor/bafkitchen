'use client'

import React, { ReactNode, useEffect } from 'react'

import { CloseIcon, HamburgerIcon } from '@chakra-ui/icons'
import {
  Box,
  Flex,
  HStack,
  IconButton,
  useColorModeValue,
  useDisclosure
} from '@chakra-ui/react'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/app/UserProvider'
import { SidebarAdmin, SidebarCustomer } from '@/components'
import { Loading } from '@/components/shared'
import { Brand, UserMenu } from '@/components/ui'

export default function DashboardShell({
  children,
  isAdmin = true
}: {
  children: ReactNode
  isAdmin?: boolean
}) {
  const { user, loading } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const pathname = usePathname()

  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      const previous = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = previous
      }
    }
  }, [isOpen])

  if (loading) return <Loading />

  if (!user) return null

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Desktop: static fixed sidebar */}
      <Box
        display={{ base: 'none', md: 'block' }}
        position="fixed"
        top="0"
        left="0"
        h="100vh"
        w="60"
        zIndex={10}
        bg="white"
        overflowY="auto"
      >
        {isAdmin ? <SidebarAdmin /> : <SidebarCustomer />}
      </Box>

      {/* Mobile: backdrop + slide-in drawer */}
      <Box display={{ base: 'block', md: 'none' }}>
        <Box
          position="fixed"
          top="0"
          left="0"
          w="100vw"
          h="100vh"
          bg="blackAlpha.600"
          backdropFilter="blur(2px)"
          zIndex={99}
          onClick={onClose}
          opacity={isOpen ? 1 : 0}
          pointerEvents={isOpen ? 'auto' : 'none'}
          transition="opacity 0.3s ease"
        />
        <Box
          position="fixed"
          top="0"
          left="0"
          h="100vh"
          w={{ base: '80vw', sm: '60' }}
          maxW="320px"
          zIndex={100}
          bg="white"
          overflowY="auto"
          boxShadow="xl"
          transform={isOpen ? 'translateX(0)' : 'translateX(-100%)'}
          transition="transform 0.3s ease"
        >
          {isAdmin ? <SidebarAdmin /> : <SidebarCustomer />}
        </Box>
      </Box>

      {/* Main content */}
      <Box as="main" ml={{ base: 0, md: '240px' }} minH="100vh">
        {/* Top bar */}
        <Flex
          bg="white"
          borderBottom="1px solid"
          borderColor="gray.200"
          position="sticky"
          top="0"
          zIndex={9}
        >
          <Flex
            h="64px"
            w="full"
            maxW="1400px"
            mx="auto"
            px={{ base: 3, md: 6 }}
            align="center"
            justify="space-between"
            gap={3}
          >
            <HStack spacing={2} minW={0}>
              <IconButton
                display={{ base: 'inline-flex', md: 'none' }}
                icon={isOpen ? <CloseIcon boxSize={3.5} /> : <HamburgerIcon />}
                aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
                aria-expanded={isOpen}
                variant="ghost"
                color="gray.600"
                onClick={isOpen ? onClose : onOpen}
              />
              <Box display={{ base: 'block', md: 'none' }}>
                <Brand size="sm" />
              </Box>
            </HStack>
            <UserMenu />
          </Flex>
        </Flex>

        <Box px={{ base: 3, md: 6 }} py={5} maxW="1400px" mx="auto">
          {children}
        </Box>
      </Box>
    </Box>
  )
}
