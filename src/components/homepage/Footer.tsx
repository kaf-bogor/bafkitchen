'use client'

import React from 'react'

import { Box, Container, Flex, HStack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { MdOutlineDashboard } from 'react-icons/md'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <Box
      as="footer"
      borderTop="1px solid"
      borderColor="gray.100"
      bg="white"
      color="gray.500"
    >
      <Container
        as={Flex}
        maxW="1200px"
        py={5}
        px={{ base: 4, sm: 6, lg: 8 }}
        direction={{ base: 'column', sm: 'row' }}
        gap={2}
        justify={{ base: 'center', sm: 'space-between' }}
        align="center"
      >
        <Text fontSize="sm">© {year} Bazaf</Text>
        <HStack spacing={1}>
          <Link
            href="/admin"
            aria-label="Panel admin"
            style={{ color: 'inherit' }}
          >
            <Box
              p={2}
              borderRadius="lg"
              color="gray.400"
              _hover={{ bg: 'gray.100', color: 'gray.600' }}
            >
              <MdOutlineDashboard size={18} />
            </Box>
          </Link>
        </HStack>
      </Container>
    </Box>
  )
}
