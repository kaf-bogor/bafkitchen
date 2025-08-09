import { CreateToastFnReturn, useDisclosure } from '@chakra-ui/react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

import { ICreateProductRequest } from '@/interfaces/product'
import { db, uploadToFirebase } from '@/utils/firebase'

export function useCreateProduct(
  toast: CreateToastFnReturn,
  fetchProducts: () => void
) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const handleCreateProduct = (request: ICreateProductRequest) => async () => {
    try {
      let imageUrl: string | undefined
      if (request.image) {
        const upload = await uploadToFirebase(request.image)
        imageUrl = upload.downloadURL
      }

      const payload = {
        name: request.name,
        priceBase: request.priceBase,
        price: request.price,
        stock: request.stock ?? 0,
        storeId: request.storeId,
        categoryIds: request.categoryIds,
        description: request.description,
        imageUrl: imageUrl ?? '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await addDoc(collection(db, 'products'), payload)
      fetchProducts()
      onClose()
    } catch (error) {
      let description
      if (
        typeof (error as any)?.response?.data?.error === 'string' &&
        (error as any).response.data.error.includes('resource already exist')
      ) {
        description = 'Image name is already exist. Please use another image.'
      } else {
        description = (error as Error).message
      }
      toast({
        title: 'Error',
        description,
        status: 'error',
        duration: 2500,
        isClosable: true
      })
    }
  }

  return {
    isOpen,
    onOpen,
    onClose,
    handleCreateProduct
  }
}
