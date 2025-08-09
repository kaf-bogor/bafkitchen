import { useState } from 'react'

import { CreateToastFnReturn, useDisclosure } from '@chakra-ui/react'
import { deleteDoc, doc, getDoc } from 'firebase/firestore'

import { db } from '@/utils/firebase'

export function useDeleteStore(
  toast: CreateToastFnReturn,
  fetchStores: () => void,
) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [targetDeleteStoreId, setTargetDeleteStoreId] = useState('' as string)

  const handleOpenDeleteModal = (id: string) => {
    setTargetDeleteStoreId(id)
    onOpen()
  }

  const handleDeleteClose = () => {
    setTargetDeleteStoreId('')
    onClose()
  }

  const submitDeleteStore = (id: string) => async () => {
    try {
      const sref = doc(db, 'stores', id)
      const ssnap = await getDoc(sref)
      if (!ssnap.exists()) throw new Error('Store not found')
      await deleteDoc(sref)
      fetchStores()
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        status: 'error',
        duration: 2500,
        isClosable: true
      })
    }
    handleDeleteClose()
  }

  return {
    isOpen,
    onOpen,
    onClose,
    handleOpenDeleteModal,
    handleDeleteClose,
    submitDeleteStore,
    targetDeleteStoreId
  }
}
