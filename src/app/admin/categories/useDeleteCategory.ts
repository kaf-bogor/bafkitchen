import { useState } from 'react'

import { CreateToastFnReturn, useDisclosure } from '@chakra-ui/react'
import { deleteDoc, doc, getDoc } from 'firebase/firestore'

import { db } from '@/utils/firebase'

export function useDeleteCategory(
  toast: CreateToastFnReturn,
  fetchCategories: () => void
) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [targetDeleteCategoryId, setTargetDeleteCateogryId] = useState(
    '' as string
  )

  const handleOpenDeleteModal = (id: string) => {
    setTargetDeleteCateogryId(id)
    onOpen()
  }

  const handleDeleteClose = () => {
    setTargetDeleteCateogryId('')
    onClose()
  }

  const handleDeleteCategory = (id: string) => async () => {
    try {
      const cref = doc(db, 'categories', id)
      const csnap = await getDoc(cref)
      if (!csnap.exists()) throw new Error('Category does not exist')
      await deleteDoc(cref)
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

  return {
    isOpen,
    onOpen: handleOpenDeleteModal,
    onClose: handleDeleteClose,
    handleDeleteCategory,
    targetDeleteCategoryId
  }
}
