'use client'

import React from 'react'

import {
  Button,
  Divider,
  Flex,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { FaTrash, FaPlay } from 'react-icons/fa'

import { usePosCart } from '@/hooks/usePosCart'
import { currency } from '@/utils'

export default function HeldOrdersModal({ isOpen, onClose }: Props) {
  const { heldOrders, resumeHeldOrder, deleteHeldOrder } = usePosCart()

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Pesanan Ditahan ({heldOrders.length})</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {heldOrders.length === 0 && (
            <Text color="gray.400" textAlign="center" py={6}>
              Tidak ada pesanan yang ditahan
            </Text>
          )}
          <VStack spacing={0} align="stretch" divider={<Divider />}>
            {heldOrders.map((held) => (
              <Flex key={held.id} py={3} align="center" gap={3}>
                <VStack align="start" spacing={0} flex={1} minW={0}>
                  <Text fontWeight="semibold" noOfLines={1}>
                    {held.label}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {format(new Date(held.createdAt), 'dd MMM yyyy HH:mm', {
                      locale: id
                    })}{' '}
                    — {held.items.reduce((acc, i) => acc + i.quantity, 0)} item
                    — {currency.toIDRFormat(held.totalPrice)}
                  </Text>
                </VStack>
                <HStack>
                  <Button
                    size="sm"
                    colorScheme="green"
                    leftIcon={<FaPlay />}
                    onClick={() => {
                      resumeHeldOrder(held.id)
                      onClose()
                    }}
                  >
                    Lanjutkan
                  </Button>
                  <IconButton
                    aria-label="Hapus pesanan ditahan"
                    icon={<FaTrash />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => deleteHeldOrder(held.id)}
                  />
                </HStack>
              </Flex>
            ))}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

type Props = {
  isOpen: boolean
  onClose: () => void
}
