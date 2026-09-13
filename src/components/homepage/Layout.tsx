import React, { ReactNode } from 'react'

import { Search2Icon } from '@chakra-ui/icons'
import {
  Alert,
  AlertIcon,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Center,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Stack,
  Text
} from '@chakra-ui/react'
import { useDebouncedCallback } from 'use-debounce'

import { Footer, Navbar } from '@/components/homepage'

export default function Layout({
  children,
  title,
  subtitle,
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
    <Box
      bg="gray.50"
      minH="100vh"
      display="flex"
      flexDirection="column"
    >
      <Navbar />
      <Box
        as="main"
        flex="1"
        px={{ base: 4, sm: 6, lg: 8 }}
        pt={{ base: '80px', md: '92px' }}
        pb={{ base: 10, md: 16 }}
      >
        <Box maxW="1200px" mx="auto">
          {(title || subtitle) && (
            <Box mt={{ base: 4, md: 8 }} mb={6} maxW="3xl">
              <Stack spacing={2}>
                {title && (
                  <Heading
                    as="h1"
                    fontSize={{ base: '2xl', md: '3xl' }}
                    fontWeight="700"
                    letterSpacing="tight"
                    color="gray.900"
                    lineHeight="1.25"
                  >
                    {title}
                  </Heading>
                )}
                {subtitle && (
                  <Text
                    fontSize={{ base: 'md', md: 'lg' }}
                    color="gray.500"
                    lineHeight="relaxed"
                  >
                    {subtitle}
                  </Text>
                )}
              </Stack>
            </Box>
          )}

          {onSearch && (
            <Box mb={8} maxW="720px">
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none" color="gray.400">
                  <Search2Icon />
                </InputLeftElement>
                <Input
                  type="text"
                  bg="white"
                  rounded="xl"
                  onChange={(e) => {
                    debounced(e.target.value)
                  }}
                  placeholder="Cari makanan atau vendor"
                  _placeholder={{ color: 'gray.400' }}
                />
              </InputGroup>
            </Box>
          )}

          {!!breadcrumbs?.length && (
            <Flex
              mb={6}
              justifyContent="space-between"
              alignItems="center"
              gap={3}
            >
              <Breadcrumb spacing="6px" fontSize="sm" color="gray.500">
                {breadcrumbs.map(({ label, path }) => (
                  <BreadcrumbItem key={label + (path || '')}>
                    {path ? (
                      <BreadcrumbLink href={path} color="gray.500">
                        {label}
                      </BreadcrumbLink>
                    ) : (
                      <Text color="gray.400">{label}</Text>
                    )}
                  </BreadcrumbItem>
                ))}
              </Breadcrumb>
              {rightHeaderComponent && <Flex>{rightHeaderComponent}</Flex>}
            </Flex>
          )}

          {error && (
            <Alert
              status="error"
              borderRadius="xl"
              mb={4}
              bg="red.50"
              color="red.700"
              border="1px solid"
              borderColor="red.100"
            >
              <AlertIcon />
              {error.message}
            </Alert>
          )}

          {!error && (
            <Box>
              {isFetching && (
                <Center minH="40vh">
                  <Spinner thickness="3px" color="brand.500" size="lg" />
                </Center>
              )}
              {!error && !isFetching && children}
            </Box>
          )}
        </Box>
      </Box>
      <Footer />
    </Box>
  )
}

type Props = {
  children: ReactNode
  title?: string
  subtitle?: string
  error?: Error
  isFetching?: boolean
  rightHeaderComponent?: ReactNode
  onSearch?: (keyword: string) => void
  breadcrumbs?: {
    label: string
    path?: string
  }[]
}
