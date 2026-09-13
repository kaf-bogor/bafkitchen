import React from 'react'

import { SimpleGrid, type SimpleGridProps } from '@chakra-ui/react'

export default function ProductGrid({ children, ...rest }: SimpleGridProps) {
  return (
    <SimpleGrid columns={[2, 2, 3, 4]} gap={[3, 4, 5]} {...rest}>
      {children}
    </SimpleGrid>
  )
}
