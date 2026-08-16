import React, { ReactNode } from 'react'

import { Box, Flex } from '@chakra-ui/react'

export default function Card({ children, ...rest }: Props) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="xl"
      boxShadow="sm"
      overflow="hidden"
      {...rest}
    >
      {children}
    </Box>
  )
}

export function CardHeader({
  title,
  description,
  actions
}: {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <Flex
      justify="space-between"
      align="center"
      gap={4}
      px={5}
      py={4}
      borderBottom="1px solid"
      borderColor="gray.100"
    >
      <Box>
        {title && (
          <Box fontSize="md" fontWeight="600" color="gray.800">
            {title}
          </Box>
        )}
        {description && (
          <Box fontSize="sm" color="gray.500" mt={0.5}>
            {description}
          </Box>
        )}
      </Box>
      {actions && <Flex flexShrink={0}>{actions}</Flex>}
    </Flex>
  )
}

export function CardBody({ children, ...rest }: Props) {
  return (
    <Box p={5} {...rest}>
      {children}
    </Box>
  )
}

type Props = {
  children: ReactNode
  [key: string]: unknown
}
