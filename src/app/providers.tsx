'use client'

import React from 'react'

import { ChakraProvider } from '@chakra-ui/react'

import theme from '@/theme'

import { UserProvider } from './UserProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      <UserProvider>{children}</UserProvider>
    </ChakraProvider>
  )
}
