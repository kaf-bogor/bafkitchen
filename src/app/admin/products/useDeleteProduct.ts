import { useState } from 'react'

import { CreateToastFnReturn, useDisclosure } from '@chakra-ui/react'
import { deleteDoc, doc, getDoc } from 'firebase/firestore'

import { db } from '@/utils/firebase'

export function useDeleteProduct(
  toast: CreateToastFnReturn,
  fetchProducts: () => void
) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [targetDeleteProductId, setTargetDeleteProductId] = useState(
    '' as string
  )

  const handleOpenDeleteModal = (id: string) => {
    setTargetDeleteProductId(id)
    onOpen()
  }

  const handleDeleteClose = () => {
    setTargetDeleteProductId('')
    onClose()
  }

  const handleDeleteProduct = (id: string) => async () => {
    try {
      const pref = doc(db, 'products', id)
      const psnap = await getDoc(pref)
      if (!psnap.exists()) throw new Error('Product not found')
      await deleteDoc(pref)
      fetchProducts()
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
    handleDeleteProduct,
    targetDeleteProductId
  }
}
