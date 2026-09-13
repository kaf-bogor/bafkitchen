'use client'

import React from 'react'

import { Search2Icon } from '@chakra-ui/icons'
import {
  Input,
  InputGroup,
  InputLeftElement,
  type InputGroupProps
} from '@chakra-ui/react'
import { useDebouncedCallback } from 'use-debounce'

export default function SearchBar({
  onSearch,
  placeholder = 'Cari produk',
  delay = 300,
  ...rest
}: Props) {
  const debounced = useDebouncedCallback((value: string) => {
    onSearch(value)
  }, delay)

  return (
    <InputGroup size="md" {...rest}>
      <InputLeftElement pointerEvents="none" color="gray.400">
        <Search2Icon />
      </InputLeftElement>
      <Input
        type="search"
        bg="surface"
        rounded="xl"
        onChange={(e) => debounced(e.target.value)}
        placeholder={placeholder}
        _placeholder={{ color: 'gray.400' }}
      />
    </InputGroup>
  )
}

type Props = Omit<InputGroupProps, 'onChange' | 'children'> & {
  onSearch: (value: string) => void
  placeholder?: string
  delay?: number
}
