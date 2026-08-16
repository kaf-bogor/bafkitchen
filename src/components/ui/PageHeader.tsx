import React from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Heading,
  HStack,
  Text
} from '@chakra-ui/react'
import Link from 'next/link'

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions
}: Props) {
  return (
    <Flex
      direction={{ base: 'column', md: 'row' }}
      justify="space-between"
      align={{ base: 'stretch', md: 'center' }}
      gap={4}
      mb={6}
    >
      <Flex direction="column" gap={1}>
        {!!breadcrumbs?.length && (
          <Breadcrumb
            spacing="8px"
            fontSize="sm"
            color="gray.500"
            separator="/"
          >
            {breadcrumbs.map(({ label, path }) => (
              <BreadcrumbItem key={label + path}>
                {path ? (
                  <BreadcrumbLink as={Link} href={path} color="gray.500">
                    {label}
                  </BreadcrumbLink>
                ) : (
                  <Text color="gray.400">{label}</Text>
                )}
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        )}
        <Heading size="lg" fontWeight="700" color="gray.800">
          {title}
        </Heading>
        {subtitle && (
          <Text color="gray.500" fontSize="sm">
            {subtitle}
          </Text>
        )}
      </Flex>

      {actions && (
        <HStack spacing={3} flexShrink={0}>
          {actions}
        </HStack>
      )}
    </Flex>
  )
}

type Props = {
  title: string
  subtitle?: string
  breadcrumbs?: {
    label: string
    path?: string
  }[]
  actions?: React.ReactNode
}
