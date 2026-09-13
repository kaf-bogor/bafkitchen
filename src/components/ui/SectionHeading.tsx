import React from 'react'

import { Box, Flex, Heading, Text } from '@chakra-ui/react'

export default function SectionHeading({
  title,
  count,
  description,
  action
}: Props) {
  return (
    <Flex justify="space-between" align="baseline" mb={4} gap={3}>
      <Box minW={0}>
        <Heading as="h2" textStyle="sectionTitle">
          {title}
        </Heading>
        {description && (
          <Text textStyle="caption" mt={1}>
            {description}
          </Text>
        )}
      </Box>
      <Flex align="center" gap={3} flexShrink={0}>
        {typeof count === 'number' && (
          <Text textStyle="caption">{count} item</Text>
        )}
        {action}
      </Flex>
    </Flex>
  )
}

type Props = {
  title: string
  count?: number
  description?: string
  action?: React.ReactNode
}
