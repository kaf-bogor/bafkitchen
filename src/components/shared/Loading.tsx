import React from 'react'

import { Center, Spinner } from '@chakra-ui/react'

export default function Loading() {
  return (
    <Center minH="50vh">
      <Spinner thickness="3px" color="brand.500" size="lg" />
    </Center>
  )
}
