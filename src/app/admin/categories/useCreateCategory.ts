import { CreateToastFnReturn, useDisclosure } from '@chakra-ui/react'
import { addDoc, collection, doc, getDoc } from 'firebase/firestore'

import { ICreateCategoryRequest } from '@/interfaces/category'
import { db } from '@/utils/firebase'

export function useCreateCategory(
  toast: CreateToastFnReturn,
  fetchCategories: () => void
) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const handleCreateNewCategory =
    (request: ICreateCategoryRequest) => async () => {
      try {
        const vdoc = await getDoc(doc(db, 'vendors', request.vendorId))
        if (!vdoc.exists() || !(vdoc.data() as any)?.isActive) {
          throw new Error('Vendor does not exist or is not active')
        }
        const categoryData = {
          name: request.name,
          vendorId: request.vendorId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        await addDoc(collection(db, 'categories'), categoryData)
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
    onOpen,
    onClose,
    handleCreateNewCategory
  }
}
