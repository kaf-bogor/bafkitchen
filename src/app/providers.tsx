'use client'

import React from 'react'

import { ChakraProvider } from '@chakra-ui/react'

import { UserProvider } from './UserProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider>
      <UserProvider>{children}</UserProvider>
    </ChakraProvider>
  )
}
