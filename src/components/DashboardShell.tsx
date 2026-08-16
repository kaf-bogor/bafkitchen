'use client'

import React, { ReactNode, useEffect } from 'react'

import { HamburgerIcon } from '@chakra-ui/icons'
import {
  Box,
  Flex,
  IconButton,
  useColorModeValue,
  useDisclosure
} from '@chakra-ui/react'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/app/UserProvider'
import { SidebarAdmin, SidebarCustomer } from '@/components'
import { Loading } from '@/components/shared'
import { UserMenu } from '@/components/ui'

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
          w="60"
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
          h="64px"
          px={{ base: 3, md: 6 }}
          align="center"
          justify="space-between"
          position="sticky"
          top="0"
          zIndex={9}
        >
          <Box display={{ base: 'block', md: 'none' }}>
            <IconButton
              icon={<HamburgerIcon />}
              aria-label="Open Menu"
              variant="ghost"
              onClick={onOpen}
            />
          </Box>
          <Box display={{ base: 'none', md: 'block' }} />
          <UserMenu />
        </Flex>

        <Box px={{ base: 3, md: 6 }} py={5} maxW="1400px" mx="auto">
          {children}
        </Box>
      </Box>
    </Box>
  )
}
