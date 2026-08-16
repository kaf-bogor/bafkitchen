import React from 'react'

import { Badge } from '@chakra-ui/react'

const toneByColor: Record<string, string> = {
  green: 'success',
  blue: 'info',
  orange: 'warning',
  red: 'error',
  gray: 'gray',
  purple: 'purple',
  teal: 'teal',
  yellow: 'warning'
}

export default function StatusBadge({ color = 'gray', children }: Props) {
  const tone = toneByColor[color] || 'gray'
  return (
    <Badge
      colorScheme={tone}
      variant="subtle"
      borderRadius="full"
      px={2.5}
      py={1}
      fontWeight="600"
      fontSize="xs"
      whiteSpace="nowrap"
    >
      {children}
    </Badge>
  )
}

type Props = {
  color?: string
  children: React.ReactNode
}
