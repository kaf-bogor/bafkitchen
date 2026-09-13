'use client'

import React from 'react'

import {
  Avatar,
  Box,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorModeValue
} from '@chakra-ui/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AiOutlineDashboard, AiOutlineLogout } from 'react-icons/ai'

import { useAuth } from '@/app/UserProvider'
import { ADMIN_LOGIN_PATH } from '@/constants/auth'
import { handleLogout } from '@/utils/auth'

export default function UserMenu({
  redirectTo = ADMIN_LOGIN_PATH
}: {
  redirectTo?: string
}) {
  const { user, refetch } = useAuth()
  const router = useRouter()
  const hoverBg = useColorModeValue('gray.100', 'gray.700')
  const name = user?.displayName || user?.email || 'User'

  if (!user) return null

  return (
    <Menu>
      <MenuButton
        as={Button}
        variant="ghost"
        rounded="lg"
        py={1.5}
        h="auto"
        px={2}
        _hover={{ bg: hoverBg }}
      >
        <HStack spacing={2}>
          <Avatar size="sm" name={name} src={user.photoURL || undefined} />
          <Box textAlign="left" display={{ base: 'none', md: 'block' }}>
            <Text fontSize="sm" fontWeight="600" lineHeight="1.2">
              {name}
            </Text>
            <Text fontSize="xs" color="gray.500" lineHeight="1.2">
              {user.email}
            </Text>
          </Box>
        </HStack>
      </MenuButton>
      <MenuList borderRadius="lg" shadow="dropdown" minW="200px">
        {user.role === 'admin' && (
          <MenuItem
            as={Link}
            href="/admin"
            icon={<AiOutlineDashboard size={16} />}
          >
            Dashboard admin
          </MenuItem>
        )}
        <MenuItem
          icon={<AiOutlineLogout size={16} />}
          color="red.500"
          onClick={() =>
            handleLogout({
              onLogout() {
                refetch()
                router.replace(redirectTo)
              }
            })
          }
        >
          Logout
        </MenuItem>
      </MenuList>
    </Menu>
  )
}
