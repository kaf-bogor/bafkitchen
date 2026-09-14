'use client'

import React from 'react'

import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  useDisclosure
} from '@chakra-ui/react'
import { FiFilter } from 'react-icons/fi'

export default function MobileFilterSheet({
  children,
  activeCount = 0
}: {
  children: React.ReactNode
  activeCount?: number
}) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Button
        display={{ base: 'inline-flex', md: 'none' }}
        size="sm"
        variant="outline"
        colorScheme="brand"
        leftIcon={<FiFilter />}
        onClick={onOpen}
        flexShrink={0}
      >
        Filter{activeCount > 0 ? ` (${activeCount})` : ''}
      </Button>

      <Drawer isOpen={isOpen} onClose={onClose} placement="bottom">
        <DrawerOverlay />
        <DrawerContent borderTopRadius="2xl" maxH="85vh">
          <DrawerHeader borderBottomWidth="1px" borderColor="border-subtle">
            Filter
          </DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody py={5}>{children}</DrawerBody>
          <DrawerFooter borderTopWidth="1px" borderColor="border-subtle">
            <Button w="full" colorScheme="brand" onClick={onClose}>
              Terapkan
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
