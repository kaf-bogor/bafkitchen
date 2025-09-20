'use client'

import React, { useState } from 'react'

import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { UserProvider } from './UserProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 1, // Only retry once
        retryDelay: 1000, // 1 second delay
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        networkMode: 'always'
      },
      mutations: {
        retry: 1,
        retryDelay: 1000
      }
    }
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>
        <UserProvider>{children}</UserProvider>
      </ChakraProvider>
    </QueryClientProvider>
  )
}
