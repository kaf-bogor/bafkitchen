'use client'

import React from 'react'

import { Box, Flex, HStack, SimpleGrid, Skeleton, VStack } from '@chakra-ui/react'

export default function PosLoading() {
  return (
    <Flex direction="column" h="100vh" bg="gray.100" overflow="hidden">
      {/* TopBar skeleton */}
      <Skeleton h="14" flexShrink={0} />

      <Flex flex={1} overflow="hidden" direction={{ base: 'column', lg: 'row' }}>
        {/* Catalog skeleton */}
        <Box flex={1} p={4} overflow="hidden">
          <HStack spacing={3} mb={4}>
            <Skeleton h="10" w="320px" rounded="md" />
            <Skeleton h="8" w="56" rounded="md" />
          </HStack>
          <HStack spacing={2} mb={4} flexWrap="wrap">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} h="6" w="20" rounded="full" />
            ))}
          </HStack>
          <SimpleGrid columns={[2, 3, 4]} gap={4}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} h="40" rounded="md" />
            ))}
          </SimpleGrid>
        </Box>

        {/* Cart panel skeleton */}
        <Box
          w={{ base: 'full', lg: '380px' }}
          h="full"
          bg="white"
          borderLeft="1px"
          borderColor="gray.200"
          p={4}
          display={{ base: 'none', lg: 'block' }}
        >
          <Skeleton h="6" w="32" mb={4} />
          <VStack align="stretch" spacing={3}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} h="14" rounded="md" />
            ))}
          </VStack>
          <Skeleton h="px" my={4} />
          <Skeleton h="5" w="full" mb={2} />
          <Skeleton h="5" w="full" mb={6} />
          <HStack spacing={3}>
            <Skeleton h="12" flex={1} rounded="md" />
            <Skeleton h="12" flex={1} rounded="md" />
          </HStack>
        </Box>
      </Flex>
    </Flex>
  )
}
