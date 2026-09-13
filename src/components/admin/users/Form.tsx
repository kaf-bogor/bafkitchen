'use client'

import React from 'react'

import {
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  FormErrorMessage,
  Select
} from '@chakra-ui/react'
import { useFormik } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import {
  ICreateUserRequest,
  IUpdateUserRequest,
  IUserResponse
} from '@/interfaces/user'
import { schema } from '@/utils'

export default function UserForm({
  onCreate,
  onUpdate,
  user,
  isPending = false
}: Props) {
  const { values, errors, touched, handleChange, handleBlur, handleSubmit } =
    useFormik({
      initialValues: {
        ...user
      },
      validationSchema: toFormikValidationSchema(schema.adminUserForm),
      onSubmit: (values) => {
        if (onCreate) {
          onCreate(values)
        }
        if (onUpdate) {
          onUpdate(values)
        }
      }
    })

  return (
    <form onSubmit={handleSubmit}>
      <VStack gap={3}>
        <FormControl isInvalid={!!errors.name && touched.name}>
          <FormLabel>Name</FormLabel>
          <Input
            name="name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="User Name"
          />
          <FormErrorMessage>{errors.name}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.email && touched.email}>
          <FormLabel>Email</FormLabel>
          <Input
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="User Email"
          />
          <FormErrorMessage>{errors.email}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.role && touched.role}>
          <FormLabel>Role</FormLabel>
          <Select
            name="role"
            value={values.role}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Select Role"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>
          <FormErrorMessage>{errors.role}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.phoneNumber && touched.phoneNumber}>
          <FormLabel>Phone Number</FormLabel>
          <Input
            name="phoneNumber"
            value={values.phoneNumber || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Phone Number"
          />
          <FormErrorMessage>{errors.phoneNumber}</FormErrorMessage>
        </FormControl>

        <FormControl mt={6}>
          <Button
            w="full"
            mr={3}
            type="submit"
            isLoading={isPending}
            colorScheme="brand"
          >
            Save
          </Button>
        </FormControl>
      </VStack>
    </form>
  )
}

export interface Props {
  // eslint-disable-next-line no-unused-vars
  onCreate?: (values: ICreateUserRequest) => void
  // eslint-disable-next-line no-unused-vars
  onUpdate?: (values: IUpdateUserRequest) => void
  user: IUserResponse
  title: string
  isPending?: boolean
}
