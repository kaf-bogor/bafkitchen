import React from 'react'

import {
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  Button,
  ModalFooter,
  Box,
  Flex,
  Heading,
  Text,
  VStack
} from '@chakra-ui/react'

import { IProductOrder } from '@/interfaces/order'
import { currency } from '@/utils'

export interface IListOfProductModalProps {
  isOpen: boolean
  onClose: () => void
  productOrders: IProductOrder[]
}

export default function ListOfProductModal(props: IListOfProductModalProps) {
  const { isOpen, onClose, productOrders } = props

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>List produk</ModalHeader>
          <ModalBody>
            <VStack gap={6}>
              {productOrders.map(({ product, quantity }) => (
                <Flex
                  key={product.id}
                  flex={1}
                  w="full"
                  justifyContent="space-between"
                  direction={['column', 'row']}
                  align="center"
                >
                  <Flex alignSelf={['start']}>
                    <Box boxSize={20} marginRight={5}>
                      <Image
                        src={product.imageUrl}
                        alt="Green double couch with wooden legs"
                        sizes="sm"
                      />
                    </Box>
                    <Box>
                      <Heading size="md">{product.name}</Heading>
                      <Text>Price: {currency.toIDRFormat(product.price)}</Text>
                      <Text>Quantity: {quantity}</Text>
                    </Box>
                  </Flex>
                </Flex>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
