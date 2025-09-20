import { useState } from 'react'

import { CreateToastFnReturn, useDisclosure } from '@chakra-ui/react'
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore'

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
  const quickUpdate = async (orderId: string, newStatus: string, userId?: string, userEmail?: string, userName?: string) => {
    try {
      const oref = doc(db, 'orders', orderId)
      
      // Get current order to record the previous status and existing activities
      const orderSnap = await getDoc(oref)
      const currentOrder = orderSnap.data()
      const previousStatus = currentOrder?.status || 'Unknown'
      const existingActivities = currentOrder?.activities || []
      
      // Create new activity if user info is provided
      let updatedActivities = existingActivities
      if (userId && userEmail && userName) {
        console.log('🏃‍♂️ Creating quick update activity:', { orderId, previousStatus, newStatus, userId })
        
        const newActivity = {
          userId,
          userEmail,
          userName,
          action: `Order status updated from "${previousStatus}" to "${newStatus}"`,
          fromStatus: previousStatus,
          toStatus: newStatus,
          notes: '',
          timestamp: new Date(),
          createdAt: new Date()
        }
        
        updatedActivities = [...existingActivities, newActivity]
        console.log('✅ Activity added to order update')
      }
      
      // Update the order status and activities
      await updateDoc(oref, { 
        status: newStatus, 
        updatedAt: serverTimestamp(),
        activities: updatedActivities
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
