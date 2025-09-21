'use client'

import React from 'react'

import {
  Button,
  ButtonGroup,
  Grid,
  GridItem,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react'
import Link from 'next/link'

import { useGetUsers } from '@/app/admin/users/actions'
import { Layout } from '@/components'

export default function User() {
  const { data: users, loading: isFetching, error } = useGetUsers()

  const sortByCreatedAt = (a: any, b: any) =>
    new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1

  const breadcrumbs = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Users', path: '/admin/users' }
  ]

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      isFetching={isFetching}
      error={error as Error}
      rightHeaderComponent={
        <Link href="/admin/users/add">
          <Button colorScheme="blue" size="sm">
            Add User
          </Button>
        </Link>
      }
    >
      <Grid>
        <GridItem
          justifySelf="end"
          colEnd={13}
          paddingTop={3}
          paddingRight={3}
        ></GridItem>
      </Grid>
      <TableContainer>
        <Table variant={'simple'}>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Phone Number</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {!!users?.length &&
              users.sort(sortByCreatedAt).map((user) => {
                return (
                  <Tr key={user.id}>
                    <Td>{user.name}</Td>
                    <Td>{user.email}</Td>
                    <Td>{user.role}</Td>
                    <Td>{user.phoneNumber || 'N/A'}</Td>
                    <Td>
                      <ButtonGroup gap={2}>
                        <Link href={`/admin/users/${user.id}/edit`}>
                          <Button
                            colorScheme="blue"
                            size="sm"
                            onClick={() => {}}
                          >
                            Edit
                          </Button>
                        </Link>
                        <Button colorScheme="red" size="sm" onClick={() => {}}>
                          Delete
                        </Button>
                      </ButtonGroup>
                    </Td>
                  </Tr>
                )
              })}
          </Tbody>
        </Table>
      </TableContainer>
    </Layout>
  )
}
