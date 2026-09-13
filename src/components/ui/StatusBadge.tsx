import React from 'react'

import { Badge, type BadgeProps } from '@chakra-ui/react'

const toneByColor: Record<string, string> = {
  green: 'green',
  blue: 'blue',
  orange: 'orange',
  red: 'red',
  gray: 'gray',
  purple: 'purple',
  teal: 'teal',
  yellow: 'yellow'
}

export default function StatusBadge({
  color = 'gray',
  children,
  ...rest
}: Props) {
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
      {...rest}
    >
      {children}
    </Badge>
  )
}

type Props = Omit<BadgeProps, 'color' | 'colorScheme'> & {
  color?: string
  children: React.ReactNode
}
