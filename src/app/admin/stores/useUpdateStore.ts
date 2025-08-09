import { useState } from 'react'

import { CreateToastFnReturn, useDisclosure } from '@chakra-ui/react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

import {
  ISubmitStoreFormRequest,
  IUpdateStoreRequest
} from '@/interfaces/store'
import { db } from '@/utils/firebase'

export function useUpdateStore(
  toast: CreateToastFnReturn,
  fetchStores: () => void,
) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [currentEditForm, setCurrentEditForm] = useState({
    id: '',
    name: ''
  } as IUpdateStoreRequest)

  const submitUpdateStore = (request: ISubmitStoreFormRequest) => async () => {
    try {
      if (!request.id) throw new Error('Missing store id')
      const sref = doc(db, 'stores', request.id)
      await updateDoc(sref, { name: request.name, updatedAt: serverTimestamp() })
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
    handleEditClose()
  }

  const handleEdit = (request: IUpdateStoreRequest) => {
    setCurrentEditForm(request)

    onOpen()
  }

  const handleEditClose = () => {
    setCurrentEditForm({ id: '', name: '', userId: '' })
    onClose()
  }

  return {
    isOpen,
    onOpen,
    onClose,
    submitUpdateStore,
    handleEdit,
    handleEditClose,
    currentEditForm
  }
}
