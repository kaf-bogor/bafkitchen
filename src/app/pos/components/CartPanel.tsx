'use client'

import React, { useRef, useState } from 'react'

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import { FaMinus, FaPlus, FaTrash, FaPause } from 'react-icons/fa'

import ProductImage from '@/components/ProductImage'
import { usePosCart } from '@/hooks/usePosCart'
import { currency } from '@/utils'

export default function CartPanel({ onCheckout }: Props) {
  const cart = usePosCart()
  const toast = useToast()
  const items = cart.products
  const total = cart.getTotalPrice()

  const holdModal = useDisclosure()
  const clearDialog = useDisclosure()
  const cancelClearRef = useRef(null)
  const [holdLabel, setHoldLabel] = useState('')

  const handleHold = () => {
    cart.holdOrder(holdLabel.trim() || `Pesanan ${cart.heldOrders.length + 1}`)
    setHoldLabel('')
    holdModal.onClose()
    toast({
      title: 'Pesanan ditahan',
      status: 'info',
      duration: 2000,
      isClosable: true
    })
  }

  return (
    <Flex
      direction="column"
      w={{ base: 'full', lg: '380px' }}
      h={{ base: '50vh', lg: 'full' }}
      bg="white"
      borderLeftWidth={{ base: 0, lg: '1px' }}
      borderTopWidth={{ base: '1px', lg: 0 }}
      borderColor="gray.200"
      flexShrink={0}
    >
      <Flex px={4} py={3} justify="space-between" align="center">
        <Text fontWeight="bold" fontSize="lg">
          Pesanan Saat Ini
        </Text>
        {items.length > 0 && (
          <IconButton
            aria-label="Bersihkan pesanan"
            icon={<FaTrash />}
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={clearDialog.onOpen}
          />
        )}
      </Flex>
      <Divider />

      <VStack
        flex={1}
        overflowY="auto"
        spacing={0}
        align="stretch"
        divider={<Divider />}
      >
        {items.length === 0 && (
          <Flex flex={1} align="center" justify="center" p={8}>
            <Text color="gray.400" textAlign="center">
              Belum ada item.
              <br />
              Ketuk produk untuk menambahkan.
            </Text>
          </Flex>
        )}
        {items.map((item) => (
          <Flex key={item.id} p={3} gap={3} align="center">
            <ProductImage
              src={item.imageUrl}
              alt={item.name}
              boxSize="48px"
              rounded="md"
              objectFit="cover"
            />
            <Box flex={1} minW={0}>
              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                {item.name}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {currency.toIDRFormat(item.price)}
              </Text>
            </Box>
            <HStack spacing={1}>
              <IconButton
                aria-label="Kurangi"
                icon={<FaMinus />}
                size="xs"
                variant="outline"
                onClick={() => cart.reduceQuantity(item.id)}
              />
              <Input
                value={item.quantity}
                onChange={(e) =>
                  cart.updateProductQuantity(item.id, Number(e.target.value))
                }
                type="number"
                size="xs"
                w="44px"
                textAlign="center"
                px={1}
              />
              <IconButton
                aria-label="Tambah"
                icon={<FaPlus />}
                size="xs"
                variant="outline"
                onClick={() => cart.addProduct(item)}
              />
            </HStack>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              w="80px"
              textAlign="right"
            >
              {currency.toIDRFormat(item.price * item.quantity)}
            </Text>
          </Flex>
        ))}
      </VStack>

      <Box p={4} borderTopWidth="1px" borderColor="gray.200" bg="gray.50">
        <Flex justify="space-between" mb={1}>
          <Text color="gray.600">Jumlah item</Text>
          <Text fontWeight="medium">{cart.getTotalQuantity()}</Text>
        </Flex>
        <Flex justify="space-between" mb={4}>
          <Text fontSize="lg" fontWeight="bold">
            Total
          </Text>
          <Text fontSize="lg" fontWeight="bold" color="green.600">
            {currency.toIDRFormat(total)}
          </Text>
        </Flex>
        <HStack spacing={3}>
          <Button
            variant="outline"
            colorScheme="orange"
            leftIcon={<FaPause />}
            isDisabled={items.length === 0}
            onClick={holdModal.onOpen}
          >
            Tahan
          </Button>
          <Button
            flex={1}
            colorScheme="green"
            size="lg"
            isDisabled={items.length === 0}
            onClick={onCheckout}
          >
            Bayar {items.length > 0 ? currency.toIDRFormat(total) : ''}
          </Button>
        </HStack>
      </Box>

      {/* Hold order modal */}
      <Modal isOpen={holdModal.isOpen} onClose={holdModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Tahan Pesanan</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Label pesanan (opsional)</FormLabel>
              <Input
                value={holdLabel}
                onChange={(e) => setHoldLabel(e.target.value)}
                placeholder={`Pesanan ${cart.heldOrders.length + 1}`}
                autoFocus
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={holdModal.onClose}>
              Batal
            </Button>
            <Button colorScheme="orange" onClick={handleHold}>
              Tahan Pesanan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Clear cart confirmation */}
      <AlertDialog
        isOpen={clearDialog.isOpen}
        leastDestructiveRef={cancelClearRef}
        onClose={clearDialog.onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Bersihkan pesanan
            </AlertDialogHeader>
            <AlertDialogBody>
              Hapus semua item dari pesanan saat ini?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelClearRef} onClick={clearDialog.onClose}>
                Batal
              </Button>
              <Button
                colorScheme="red"
                onClick={() => {
                  cart.clearCart()
                  clearDialog.onClose()
                }}
                ml={3}
              >
                Hapus
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Flex>
  )
}

type Props = {
  onCheckout: () => void
}
