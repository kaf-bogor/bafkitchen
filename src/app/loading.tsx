'use client'

import React from 'react'

import {
  Box,
  Flex,
  HStack,
  SimpleGrid,
  Skeleton,
  VStack
} from '@chakra-ui/react'

export default function RootLoading() {
  return (
    <Box bg="gray.200" minH="100vh">
      {/* Navbar skeleton */}
      <Flex
        position="fixed"
        top="0"
        w="full"
        h="64px"
        bg="white"
        borderBottom="1px"
        borderBottomColor="gray.300"
        px={4}
        align="center"
        justify="space-between"
        zIndex={10}
      >
        <Skeleton h="8" w="32" rounded="md" />
        <HStack spacing={3}>
          <Skeleton h="8" w="16" rounded="md" />
          <Skeleton h="8" w="8" rounded="md" />
        </HStack>
      </Flex>

      <VStack
        gap={6}
        mt="64px"
        w={['100%', '100%', '100%', '100%', 1200]}
        minH={['auto', '100vh']}
        mx="auto"
        p={[3, 3, 4, 5, 0]}
        align="stretch"
      >
        {/* Search skeleton */}
        <Skeleton h="10" w="full" mt={6} rounded="2xl" />

        {/* Day tabs skeleton */}
        <HStack spacing={2} mt={6} flexWrap="wrap">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} h="8" flex={1} minW="16" rounded="full" />
          ))}
        </HStack>

        {/* Product grid skeleton */}
        <SimpleGrid columns={[1, 2, 3, 4]} gap={6}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Box key={i} bg="white" rounded="md" overflow="hidden">
              <Skeleton h="40" />
              <Box p={3}>
                <Skeleton h="4" w="3/4" mb={2} />
                <Skeleton h="4" w="1/2" mb={3} />
                <Skeleton h="8" w="full" rounded="md" />
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  )
}
