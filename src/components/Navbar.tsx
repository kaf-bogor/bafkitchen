import React from 'react'

import { Box, Flex, Button, useColorModeValue, Stack } from '@chakra-ui/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { ADMIN_LOGIN_PATH } from '@/constants/auth'
import { handleLogout } from '@/utils/auth'

export default function Navbar() {
  const router = useRouter()

  const onLogout = async () => {
    try {
      await handleLogout({
        onLogout: () => router.push(ADMIN_LOGIN_PATH)
      })
    } catch (error) {
      console.log(error, 'error')
    }
  }

  return (
    <Box
      bg={useColorModeValue('gray.100', 'gray.900')}
      px={4}
      dropShadow="initial"
    >
      <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
        <Box>
          <Link href="/admin">Admin Dashboard</Link>
        </Box>

        <Flex alignItems={'center'}>
          <Stack direction={'row'} spacing={7}>
            <Button onClick={onLogout}>Logout</Button>
          </Stack>
        </Flex>
      </Flex>
    </Box>
  )
}
