'use client'

import React from 'react'

import { Box, Container, Heading, useToast } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'

import UserForm from '@/components/admin/users/Form'
import { ICreateUserRequest } from '@/interfaces/user'

import { useCreateUser } from '../actions'

const AddUserPage: React.FC = () => {
  const router = useRouter()
  const toast = useToast()

  const { createUser: createUserAction, loading: isPending } = useCreateUser()

  const initialValues = {
    id: '',
    name: '',
    email: '',
    password: 'default123',
    role: '',
    updatedAt: new Date(),
    createdAt: new Date()
  }

  const handleSubmit = async (values: ICreateUserRequest) => {
    try {
      await createUserAction(values)
      toast({
        title: 'User created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      router.push('/admin/users')
    } catch (error) {
      toast({
        title: 'Error creating user',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  return (
    <Container maxW="container.xl" mt={8}>
      <Box>
        <Heading as="h1" size="xl" mb={4}>
          Add User
        </Heading>
        <UserForm
          title="Tambah user"
          user={initialValues}
          onCreate={handleSubmit}
          isPending={isPending}
        />
      </Box>
    </Container>
  )
}

export default AddUserPage
