import { useState } from 'react'

import { CreateToastFnReturn, useDisclosure } from '@chakra-ui/react'

import { IUpdateOrderStatusRequest } from '@/interfaces/order'
import { apiFetch } from '@/utils/api'

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
      await apiFetch(`/api/orders/${request.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: request.status })
      })
      fetchOrders()
      clearRequestOnClose()
      toast({
        title: 'Status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
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

  // Quick update function that bypasses modal
  const quickUpdate = async (orderId: string, newStatus: string) => {
    try {
      await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      })
      fetchOrders()
      toast({
        title: 'Status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (error) {
      console.error('❌ Failed to update order status:', error)
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
    onSubmit,
    quickUpdate
  }
}