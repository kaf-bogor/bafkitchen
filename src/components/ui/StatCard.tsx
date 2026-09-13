import React from 'react'

import { Box, Flex, Icon, Text } from '@chakra-ui/react'

export default function StatCard({
  label,
  value,
  sublabel,
  icon,
  tone = 'brand'
}: Props) {
  const toneColors: Record<Tone, { bg: string; color: string }> = {
    brand: { bg: 'brand.50', color: 'brand.600' },
    green: { bg: 'green.50', color: 'green.600' },
    blue: { bg: 'blue.50', color: 'blue.600' },
    orange: { bg: 'orange.50', color: 'orange.600' },
    red: { bg: 'red.50', color: 'red.600' },
    purple: { bg: 'purple.50', color: 'purple.600' },
    gray: { bg: 'gray.100', color: 'gray.600' }
  }
  const { bg, color } = toneColors[tone]

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="xl"
      p={5}
      transition="border-color 0.2s"
      _hover={{ borderColor: 'gray.300' }}
    >
      <Flex justify="space-between" align="start" gap={4}>
        <Flex direction="column" gap={1.5} minW="0">
          <Text color="gray.500" fontSize="sm" fontWeight="500">
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="700" color="gray.900" noOfLines={1}>
            {value}
          </Text>
          {sublabel && (
            <Text color="gray.500" fontSize="sm">
              {sublabel}
            </Text>
          )}
        </Flex>
        {icon && (
          <Flex
            bg={bg}
            color={color}
            p={2.5}
            borderRadius="lg"
            flexShrink={0}
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={icon} boxSize={5} />
          </Flex>
        )}
      </Flex>
    </Box>
  )
}

type Tone = 'brand' | 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'gray'

type Props = {
  label: string
  value: string | number
  sublabel?: string
  icon?: React.ElementType
  tone?: Tone
}
