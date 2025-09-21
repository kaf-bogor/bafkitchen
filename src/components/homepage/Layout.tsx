/* eslint-disable no-unused-vars */
import React, { ReactNode, useState } from 'react'

import { Search2Icon } from '@chakra-ui/icons'
import {
  Alert,
  AlertIcon,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Center,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Stack,
  VStack
} from '@chakra-ui/react'
import { useDebouncedCallback } from 'use-debounce'

import { Footer, Navbar } from '@/components/homepage'

export default function Layout({
  children,
  breadcrumbs,
  error,
  isFetching,
  rightHeaderComponent,
  onSearch
}: Props) {
  const debounced = useDebouncedCallback((value) => {
    onSearch?.(value)
  }, 300)

  return (
    <Box bg="gray.200" minH="100vh">
      <Navbar />
      <VStack
        gap={6}
        mt="64px"
        w={['100%', '100%', '100%', '100%', 1200]}
        minH={['auto', '100vh']}
        mx="auto"
        p={[3, 3, 4, 5, 0]}
      >
        {onSearch && (
          <Stack spacing={4} w="full" mt={6}>
            <InputGroup w="full" rounded="2xl" boxShadow="sm" bg="white">
              <InputLeftElement pointerEvents="none">
                <Search2Icon color="gray.700" />
              </InputLeftElement>
              <Input
                onChange={(e) => {
                  debounced(e.target.value)
                }}
                type="text"
                placeholder="Cari makanan atau vendor"
                color="gray.700"
                _placeholder={{ color: 'gray.700' }}
              />
            </InputGroup>
          </Stack>
        )}
        <Box w="full" minH="50vh">
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

          {error && (
            <Box mb={3}>
              <Alert status="error" mb={3} height="48px">
                <AlertIcon />
                {error.message}
              </Alert>
            </Box>
          )}
          {!error && (
            <Box mt={6}>
              {isFetching && (
                <Center>
                  <Spinner size="xl" color="green.300" />
                </Center>
              )}

              {!error && !isFetching && children}
            </Box>
          )}
        </Box>
      </VStack>
      <Footer />
    </Box>
  )
}

type Props = {
  children: ReactNode
  error?: Error
  isFetching?: boolean
  rightHeaderComponent?: ReactNode
  onSearch?: (keyword: string) => void
  breadcrumbs?: {
    label: string
    path: string
  }[]
}
