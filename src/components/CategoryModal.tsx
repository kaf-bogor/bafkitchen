import React, { useEffect, useState } from 'react'

import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select
} from '@chakra-ui/react'

import { ICreateCategoryRequest } from '@/interfaces/category'
import { IStore } from '@/interfaces/store'

export interface MyModalProps {
  isOpen: boolean
  onClose: () => void
  // eslint-disable-next-line no-unused-vars
  onSubmit: (request: ICreateCategoryRequest) => () => void
  data?: {
    name: string
    id: string
    storeId: string
  }
  stores: IStore[]
  title: string
}

export default function CategoryFormModal(props: MyModalProps) {
  const { isOpen, onClose, onSubmit, data } = props

  const [input, setInput] = useState({
    name: '',
    storeId: ''
  } as ICreateCategoryRequest)

  useEffect(() => {
    setInput({
      name: data?.name || '',
      storeId: data?.storeId || ''
    })
  }, [data?.name, data?.storeId])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    setInput({
      ...input,
      [e.target.name]: e.target.value
    })
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{props.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl marginBottom={2}>
              <FormLabel>Name</FormLabel>
              <Input
                placeholder="Category Name"
                value={input.name}
                onChange={handleChange}
                name="name"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Store</FormLabel>
              <Select
                placeholder="Select Store"
                value={input.storeId}
                onChange={handleChange}
                name="storeId"
              >
                {props.vendors.map((vendor) => {
                  return (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  )
                })}
              </Select>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button
              isDisabled={!input.storeId}
              colorScheme="blue"
              mr={3}
              onClick={onSubmit(input)}
            >
              Save
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
