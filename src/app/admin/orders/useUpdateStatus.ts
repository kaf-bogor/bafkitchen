import { useState } from 'react'

import { CreateToastFnReturn, useDisclosure } from '@chakra-ui/react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

import { IUpdateOrderStatusRequest } from '@/interfaces/order'
import { db } from '@/utils/firebase'


export function useUpdateOrderStatus(
  toast: CreateToastFnReturn,
  fetchOrders: () => void
) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const defaultValue = {
    id: '',
    status: ''
  }

  const [request, setRequest] =
    useState<IUpdateOrderStatusRequest>(defaultValue)

  const clearRequestOnClose = () => {
    setRequest(defaultValue)
    onClose()
  }

  const setRequestOnOpen = (request: IUpdateOrderStatusRequest) => {
    setRequest(request)
    onOpen()
  }

  const onSubmit = async (request: IUpdateOrderStatusRequest) => {
    try {
      const oref = doc(db, 'orders', request.id)
      await updateDoc(oref, { status: request.status, updatedAt: serverTimestamp() })
      fetchOrders()
      clearRequestOnClose()
    } catch (error) {
      toast({
        title: 'Failed to update order status',
        description: (error as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  return {
    isOpen,
    onOpen: setRequestOnOpen,
    onClose: clearRequestOnClose,
    request,
    onSubmit
  }
}
