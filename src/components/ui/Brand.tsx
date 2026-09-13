import React from 'react'

import { Flex, HStack, Heading, Icon } from '@chakra-ui/react'
import Link from 'next/link'
import { AiOutlineShopping } from 'react-icons/ai'

export default function Brand({
  href = '/',
  showText = true,
  size = 'md'
}: Props) {
  const boxSize = size === 'sm' ? '8' : '9'
  const iconSize = size === 'sm' ? 4 : 5

  return (
    <Link href={href} aria-label="Bazaf - beranda">
      <HStack spacing={3}>
        <Flex
          bg="brand.500"
          color="white"
          w={boxSize}
          h={boxSize}
          borderRadius="lg"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Icon as={AiOutlineShopping} boxSize={iconSize} />
        </Flex>
        {showText && (
          <Heading as="span" size="sm" fontWeight="700">
            Bazaf
          </Heading>
        )}
      </HStack>
    </Link>
  )
}

type Props = {
  href?: string
  showText?: boolean
  size?: 'sm' | 'md'
}
