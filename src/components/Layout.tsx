import React, { ReactNode } from 'react'

import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Heading
} from '@chakra-ui/react'
import Link from 'next/link'

import { Error as ErrorComponent, Loading } from '@/components/shared'

export default function Layout({
  children,
  breadcrumbs,
  title,
  error,
  isFetching,
  rightHeaderComponent
}: Props) {
  return (
    <Box>
      {(title || breadcrumbs?.length) && (
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', md: 'center' }}
          gap={3}
          mb={5}
        >
          <Flex direction="column" gap={1}>
            {!!breadcrumbs?.length && (
              <Breadcrumb spacing="8px" fontSize="sm" color="gray.500" separator="/">
                {breadcrumbs.map(({ label, path }) => (
                  <BreadcrumbItem key={label + (path || '')}>
                    {path ? (
                      <BreadcrumbLink as={Link} href={path} color="gray.500">
                        {label}
                      </BreadcrumbLink>
                    ) : (
                      <Box as="span" color="gray.400">
                        {label}
                      </Box>
                    )}
                  </BreadcrumbItem>
                ))}
              </Breadcrumb>
            )}
            {title && (
              <Heading size="lg" fontWeight="700" color="gray.800">
                {title}
              </Heading>
            )}
          </Flex>
          {rightHeaderComponent && <Flex flexShrink={0}>{rightHeaderComponent}</Flex>}
        </Flex>
      )}

      {error && <ErrorComponent error={error} />}
      {!error && (
        <Box>
          {isFetching && <Loading />}
          {!error && !isFetching && children}
        </Box>
      )}
    </Box>
  )
}

type Props = {
  children: ReactNode
  title?: string
  error?: Error
  isFetching?: boolean
  rightHeaderComponent?: ReactNode
  breadcrumbs?: {
    label: string
    path?: string
  }[]
}
