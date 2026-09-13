import React from 'react'

import { Flex, Icon, Text, VStack } from '@chakra-ui/react'
import { MdInbox } from 'react-icons/md'

export default function EmptyState({
  title,
  description,
  action,
  icon
}: Props) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      py={16}
      px={6}
      bg="white"
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.100"
    >
      <VStack spacing={3} textAlign="center" maxW="sm">
        <Flex
          bg="gray.50"
          p={4}
          borderRadius="full"
          color="gray.400"
          border="1px solid"
          borderColor="gray.100"
        >
          <Icon as={icon || MdInbox} boxSize={7} />
        </Flex>
        <Text fontWeight="600" color="gray.700">
          {title}
        </Text>
        {description && (
          <Text fontSize="sm" color="gray.500" lineHeight="1.6">
            {description}
          </Text>
        )}
        {action}
      </VStack>
    </Flex>
  )
}

type Props = {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ElementType
}
