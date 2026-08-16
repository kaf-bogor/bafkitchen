'use client'

import React from 'react'

import { Box, SimpleGrid, Skeleton, SkeletonText } from '@chakra-ui/react'

export default function AdminLoading() {
  return (
    <Box p={3}>
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
  )
}
