'use client'

import React, { useEffect, useState } from 'react'

import { Image, type ImageProps } from '@chakra-ui/react'

export const PLACEHOLDER_IMAGE = '/placeholder.png'
export const BROKEN_IMAGE = '/image-not-found.png'

interface ProductImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null
}

export default function ProductImage({ src, ...rest }: ProductImageProps) {
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setBroken(false)
  }, [src])

  const source = !src ? PLACEHOLDER_IMAGE : broken ? BROKEN_IMAGE : src

  return <Image {...rest} src={source} onError={() => setBroken(true)} />
}
