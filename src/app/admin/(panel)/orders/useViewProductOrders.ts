import { useState } from 'react'

import { useDisclosure } from '@chakra-ui/react'

import { IProductOrder } from '@/interfaces/order'

export function useViewProductOrders() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [productOrders, setProductOrders] = useState<IProductOrder[]>([])

  const clearProductOrdersOnClose = () => {
    setProductOrders([])
    onClose()
  }

  const setProductOrdersOnOpen = (productOrders: IProductOrder[]) => {
    setProductOrders(productOrders)
    onOpen()
  }

  return {
    isOpen,
    onOpen: setProductOrdersOnOpen,
    onClose: clearProductOrdersOnClose,
    productOrders
  }
}
