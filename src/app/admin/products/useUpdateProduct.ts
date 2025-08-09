import { useState } from 'react'

import { CreateToastFnReturn, useDisclosure } from '@chakra-ui/react'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

import { IEditProductRequest, IProduct } from '@/interfaces/product'
import { db, uploadToFirebase } from '@/utils/firebase'


export function useUpdateProduct(
  toast: CreateToastFnReturn,
  fetchProducts: () => void
) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const initForm = {
    id: '',
    name: '',
    price: 0,
    priceBase: 0,
    stock: 0,
    storeId: '',
    categoryIds: [],
    description: '',
    imageUrl: ''
  } as IEditProductRequest

  const [currentEditForm, setCurrentEditForm] = useState(initForm)

  const handleUpdateProduct = (request: IEditProductRequest) => async () => {
    try {
      const pref = doc(db, 'products', currentEditForm.id)
      const psnap = await getDoc(pref)
      if (!psnap.exists()) throw new Error('Product not found')

      let imageUrl = request.imageUrl || (psnap.data() as any)?.imageUrl || ''
      if (request?.image) {
        const upload = await uploadToFirebase(request.image)
        imageUrl = upload.downloadURL
      }

      await updateDoc(pref, {
        name: request.name,
        priceBase: request.priceBase,
        price: request.price,
        stock: request.stock ?? 0,
        storeId: request.storeId,
        categoryIds: request.categoryIds,
        description: request.description,
        imageUrl,
        updatedAt: serverTimestamp()
      })
      fetchProducts()
      onClose()
    } catch (error) {
      let description
      if (
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

  const handleEdit = (product: IProduct) => {
    const request: IEditProductRequest = {
      id: product.id,
      name: product.name,
      stock: product.stock,
      priceBase: product.priceBase,
      price: product.price,
      storeId: product.store.id,
      categoryIds: product.categories.map((category) => category.id),
      description: product.description,
      imageUrl: product.imageUrl
    }

    setCurrentEditForm(request)
    onOpen()
  }

  const handleEditClose = () => {
    setCurrentEditForm(initForm)
    onClose()
  }

  return {
    isOpen,
    onOpen: handleEdit,
    onClose: handleEditClose,
    handleUpdateProduct,
    currentEditForm
  }
}
