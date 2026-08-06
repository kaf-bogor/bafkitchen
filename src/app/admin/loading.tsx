'use client'

import React from 'react'

import {
  Box,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  VStack
} from '@chakra-ui/react'

export default function AdminLoading() {
  return (
    <Box minH="100vh" bg="gray.50">
      {/* Sidebar skeleton (desktop) */}
      <Box
        display={{ base: 'none', md: 'block' }}
        position="fixed"
        top="0"
        left="0"
        h="100vh"
        w="60"
        zIndex={10}
        bg="white"
        borderRight="1px"
        borderColor="gray.200"
        p={3}
      >
        <Skeleton h="8" w="36" my={3} />
        <VStack align="stretch" spacing={2} mt={4}>
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} h="10" rounded="md" />
          ))}
        </VStack>
      </Box>

      {/* Main content skeleton */}
      <Box ml={{ base: 0, md: '240px' }} minH="100vh">
        {/* Mobile top bar */}
        <Skeleton display={{ base: 'block', md: 'none' }} h="57px" />

        <Box
          m={3}
          p={6}
          bg="white"
          boxShadow="md"
          borderRadius="md"
          minH="60vh"
        >
          <Skeleton h="6" w="48" mb={6} />
          <SimpleGrid columns={[1, 2, 3, 4]} gap={6} mb={8}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} h="24" rounded="md" />
            ))}
          </SimpleGrid>
          <Skeleton h="72" rounded="md" mb={4} />
          <SkeletonText noOfLines={4} spacing={4} skeletonHeight={4} />
        </Box>
      </Box>
    </Box>
  )
}
