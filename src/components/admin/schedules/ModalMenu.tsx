import React from 'react'

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormControl,
  FormLabel,
  ModalFooter,
  Button,
  Select
} from '@chakra-ui/react'

import { IProduct } from '@/interfaces'

export default function ModalMenu({
  isOpen,
  isLoading,
  isDisabled,
  onClose,
  date,
  products,
  onSubmit,
  onChange
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{date}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Tambah menu</FormLabel>
            <Select
              placeholder="Pilih"
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onChange(e.target.value)
              }
            >
              {products &&
                products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.vendor.name} - {product.name}
                  </option>
                ))}
            </Select>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={onSubmit}
            isDisabled={isDisabled}
            isLoading={isLoading}
          >
            Tambah
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

type Props = {
  isOpen: boolean
  onClose: () => void
  date: string
  products: IProduct.IProductResponse[]
  onSubmit: () => void
  // eslint-disable-next-line no-unused-vars
  onChange: (productId: string) => void
  isLoading: boolean
  isDisabled: boolean
}
