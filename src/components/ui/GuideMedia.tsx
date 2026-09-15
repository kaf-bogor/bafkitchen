'use client'

import React, { useState } from 'react'

import {
  AspectRatio,
  Box,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
  useDisclosure
} from '@chakra-ui/react'

import type { GuideMediaItem } from '@/constants/guide'

export default function GuideMedia({ media }: { media: GuideMediaItem }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [broken, setBroken] = useState(false)

  if (media.type === 'embed') {
    return (
      <Box
        borderRadius="lg"
        overflow="hidden"
        border="1px solid"
        borderColor="border-subtle"
      >
        <AspectRatio ratio={16 / 9}>
          <iframe src={media.src} title={media.caption || 'Video'} allowFullScreen />
        </AspectRatio>
      </Box>
    )
  }

  if (media.type === 'video') {
    return (
      <Box>
        <Box
          as="video"
          src={media.src}
          controls
          w="full"
          borderRadius="lg"
          border="1px solid"
          borderColor="border-subtle"
        />
        {media.caption && (
          <Text fontSize="xs" color="text-muted" mt={1}>
            {media.caption}
          </Text>
        )}
      </Box>
    )
  }

  if (broken) {
    return (
      <Box
        p={4}
        border="1px dashed"
        borderColor="border-strong"
        borderRadius="lg"
        bg="gray.50"
      >
        <Text fontSize="sm" color="text-muted">
          Media belum tersedia
        </Text>
        <Text fontSize="xs" color="text-subtle" mt={1} fontFamily="mono">
          {media.src}
        </Text>
      </Box>
    )
  }

  return (
    <>
      <Box
        as="button"
        type="button"
        onClick={onOpen}
        w="full"
        textAlign="left"
        cursor="zoom-in"
      >
        <Image
          src={media.src}
          alt={media.caption || 'Screenshot'}
          w="full"
          borderRadius="lg"
          border="1px solid"
          borderColor="border-subtle"
          onError={() => setBroken(true)}
        />
        {media.caption && (
          <Text fontSize="xs" color="text-muted" mt={1}>
            {media.caption}
          </Text>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
        <ModalOverlay />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalCloseButton color="white" />
          <ModalBody p={0}>
            <Image
              src={media.src}
              alt={media.caption || 'Screenshot'}
              w="full"
              borderRadius="lg"
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
