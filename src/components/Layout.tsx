import React, { ReactNode, useRef } from 'react'

import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  HStack,
  IconButton,
  Stack,
  useColorModeValue,
  useDisclosure
} from '@chakra-ui/react'
import { motion } from 'framer-motion'

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

  const sidebarRef = useRef<HTMLDivElement | null>(null)

  if (user) {
    return (
      <HStack align="start" spacing={0}>
        <Stack
          pos={{ base: 'fixed', md: 'relative' }}
          bgColor="white"
          zIndex="99"
        >
          <IconButton
            size={'md'}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={'Open Menu'}
            display={{ base: 'flex', md: 'none' }}
            onClick={isOpen ? onClose : onOpen}
          />
          <Box
            ref={sidebarRef}
            display={{ base: isOpen ? 'flex' : 'none', md: 'flex' }}
          >
            <Box display={{ base: 'none', md: 'block' }}>
              {isAdmin ? <SidebarAdmin /> : <SidebarCustomer />}
            </Box>
            <Box display={{ base: 'block', md: 'none' }}>
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: isOpen ? 0 : '-100%' }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {isAdmin ? <SidebarAdmin /> : <SidebarCustomer />}
              </motion.div>
            </Box>
          </Box>
        </Stack>
        <Box as="main" w="full" minH="90vh" bg={bgColor}>
          {!!breadcrumbs?.length && (
            <Flex
              bg="white"
              borderBottomWidth="1px"
              boxShadow="xs"
              mb={6}
              ml={{ base: '32px', md: '0' }}
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
      </HStack>
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
