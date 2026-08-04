import React, { ReactNode, useEffect } from 'react'

import { HamburgerIcon } from '@chakra-ui/icons'
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  IconButton,
  useColorModeValue,
  useDisclosure
} from '@chakra-ui/react'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/app/UserProvider'
import { SidebarAdmin, SidebarCustomer } from '@/components'
import { Error as ErrorComponent, Loading } from '@/components/shared'

export default function Layout({
  children,
  breadcrumbs,
  error,
  isAdmin = true,
  isFetching,
  rightHeaderComponent
}: Props) {
  const { user } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const pathname = usePathname()

  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  if (user) {
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
          {/* Mobile top bar with burger button */}
          <Flex
            display={{ base: 'flex', md: 'none' }}
            bg="white"
            borderBottomWidth="1px"
            h="57px"
            px={3}
            align="center"
            position="sticky"
            top="0"
            zIndex={9}
          >
            <IconButton
              icon={<HamburgerIcon />}
              aria-label="Open Menu"
              variant="ghost"
              onClick={onOpen}
            />
          </Flex>

          {!!breadcrumbs?.length && (
            <Flex
              bg="white"
              borderBottomWidth="1px"
              boxShadow="xs"
              mb={6}
              p={3}
              justifyContent="space-between"
              alignItems="center"
            >
              <Breadcrumb>
                {breadcrumbs.map(({ label, path }) => (
                  <BreadcrumbItem key={path}>
                    <BreadcrumbLink href={path}>{label}</BreadcrumbLink>
                  </BreadcrumbItem>
                ))}
              </Breadcrumb>
              <Flex>{rightHeaderComponent}</Flex>
            </Flex>
          )}

          {error && <ErrorComponent error={error} />}
          {!error && (
            <Flex
              flex={1}
              flexGrow={0}
              direction="column"
              m={3}
              p={3}
              bg="white"
              boxShadow="md"
              borderRadius="md"
              overflowX="auto"
            >
              {isFetching && <Loading />}
              {!error && !isFetching && children}
            </Flex>
          )}
        </Box>
      </Box>
    )
  }
}

type Props = {
  children: ReactNode
  error?: Error
  isFetching?: boolean
  rightHeaderComponent?: ReactNode
  isAdmin?: boolean
  breadcrumbs?: {
    label: string
    path: string
  }[]
}
