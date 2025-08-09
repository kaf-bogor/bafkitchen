import { CreateToastFnReturn, useDisclosure } from '@chakra-ui/react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

import {
  ISubmitStoreFormRequest,
  ICreateStoreRequest
} from '@/interfaces/store'
import { auth, db } from '@/utils/firebase'

export function useCreateStore(
  toast: CreateToastFnReturn,
  fetchStores: () => void
) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const submitNewStore = (request: ISubmitStoreFormRequest) => async () => {
    const user = auth.currentUser
    const storRequest = {
      name: request.name,
      email: user?.email || null
    } as ICreateStoreRequest

    try {
      await addDoc(collection(db, 'stores'), {
        name: storRequest.name,
        email: storRequest.email,
        isDeleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      await fetchStores()
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        status: 'error',
        duration: 2500,
        isClosable: true
      })
    }
    onClose()
  }

  return {
    isOpen,
    onOpen,
    onClose,
    submitNewStore
  }
}
