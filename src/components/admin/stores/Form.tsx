import React, { useEffect, useState } from 'react'

import { Button, FormControl, FormLabel, Input, Select } from '@chakra-ui/react'
import { collection, getDocs } from 'firebase/firestore'

import { IStore, IUser } from '@/interfaces'
import { db } from '@/utils/firebase'

export default function Form({
  store,
  onChange,
  isLoading = false,
  onSubmit
}: Props) {
  const [users, setUsers] = useState<IUser.IUser[]>([])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const qsnap = await getDocs(collection(db, 'users'))
      const list = qsnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as IUser.IUser[]
      setUsers(list)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  return (
    <>
      <FormControl marginBottom={2}>
        <FormLabel>Name</FormLabel>
        <Input
          placeholder="Vendor Name"
          value={store?.name || ''}
          onChange={onChange}
          name="name"
        />
      </FormControl>
      <FormControl marginBottom={2}>
        <FormLabel>User</FormLabel>
        <Select
          placeholder="Pilih User"
          value={store && 'userId' in store ? store.userId : ''}
          onChange={onChange}
          name="userId"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl mt={6}>
        <Button
          mr={3}
          w="full"
          isLoading={isLoading}
          colorScheme="blue"
          onClick={onSubmit}
          isDisabled={!store?.name || ('userId' in store && !store?.userId)}
        >
          Save
        </Button>
      </FormControl>
    </>
  )
}

type Props = {
  store?: IStore.IUpdateStoreRequest | IStore.ICreateStoreRequest
  onChange: (
    // eslint-disable-next-line no-unused-vars
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void
  isLoading?: boolean
  onSubmit: () => void
}
