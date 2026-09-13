import React from 'react'

import { Text, type TextProps } from '@chakra-ui/react'

import { currency } from '@/utils'

const sizeMap = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl'
} as const

export default function Price({ value, size = 'md', ...rest }: Props) {
  return (
    <Text as="span" textStyle="price" fontSize={sizeMap[size]} {...rest}>
      {currency.toIDRFormat(value)}
    </Text>
  )
}

type Props = Omit<TextProps, 'children'> & {
  value: number
  size?: keyof typeof sizeMap
}
