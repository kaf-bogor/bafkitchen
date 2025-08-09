import { CreateToastFnReturn } from '@chakra-ui/react'
import { collection, getDocs } from 'firebase/firestore'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

import { IStore } from '@/interfaces/store'
import { db } from '@/utils/firebase'

const filterStorePath = async (storeName: string) => {
  const qsnap = await getDocs(collection(db, 'stores'))
  const stores = qsnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as IStore[]
  const storeNames = stores.map((store) => store.name)
  const isRegistered = storeNames.includes(storeName)
  return isRegistered
}

export const useProductList = (
  toast: CreateToastFnReturn,
  router: AppRouterInstance,
  storeName: string
) => {
  const validateCurrentPage = async () => {
    try {
      const isRegistered = await filterStorePath(storeName)
      if (!isRegistered) {
        router.push('/error')
      }
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
    validateCurrentPage
  }
}
