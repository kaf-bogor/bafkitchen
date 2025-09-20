import { useState } from 'react'

import { CreateToastFnReturn, useDisclosure } from '@chakra-ui/react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

import {
  IUpdateCategoryRequest,
  ICreateCategoryRequest
} from '@/interfaces/category'
import { db } from '@/utils/firebase'


export function useUpdateCategory(
  toast: CreateToastFnReturn,
  fetchCategories: () => void
) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const defaultCategoryInput = {
    id: '',
    name: '',
    vendorId: ''
  } as IUpdateCategoryRequest

  const [currentEditForm, setCurrentEditForm] = useState(defaultCategoryInput)

  const handleSubmit = (request: ICreateCategoryRequest) => async () => {
    try {
      const cref = doc(db, 'categories', currentEditForm.id)
      const csnap = await getDoc(cref)
      if (!csnap.exists()) throw new Error('Category does not exist')
      await updateDoc(cref, {
        name: request.name,
        vendorId: request.vendorId,
        updatedAt: new Date().toISOString()
      })
      fetchCategories()
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        status: 'error',
        duration: 2500,
        isClosable: true
      })
    }
  }

  const handleEdit = (request: IUpdateCategoryRequest) => {
    setCurrentEditForm(request)
    onOpen()
  }

  const handleCloseModal = () => {
    setCurrentEditForm(defaultCategoryInput)
    onClose()
  }

  return {
    isOpen,
    onOpen: handleEdit,
    onClose: handleCloseModal,
    handleSubmit,
    currentEditForm
  }
}
