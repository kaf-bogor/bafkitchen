'use client'

import React from 'react'

import {
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Heading,
  Icon,
  List,
  ListItem,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useColorModeValue,
  useDisclosure
} from '@chakra-ui/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  AiOutlineCalendar,
  AiOutlineDesktop,
  AiOutlineFileText,
  AiOutlineHome,
  AiOutlineLogout,
  AiOutlineQuestionCircle,
  AiOutlineSetting,
  AiOutlineShop,
  AiOutlineShopping,
  AiOutlineShoppingCart,
  AiOutlineTags,
  AiOutlineUser,
  AiOutlinePieChart
} from 'react-icons/ai'


import { ADMIN_LOGIN_PATH } from '@/constants/auth'
import { handleLogout } from '@/utils/auth'

import type { IconType } from 'react-icons'

type MenuItem = {
  text: string
  path?: string
  onClick?: () => void
  icon: IconType
}

type Group = { title?: string; items: MenuItem[] }

function Sidebar({ ...rest }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const hoverBg = useColorModeValue('gray.100', 'gray.700')

  function onLogoutClick() {
    onOpen()
  }

  const groups: Group[] = [
    {
      items: [{ text: 'Dasbor', path: '/admin', icon: AiOutlinePieChart }]
    },
    {
      title: 'Penjualan',
      items: [
        { text: 'Kasir (POS)', path: '/pos', icon: AiOutlineDesktop },
        { text: 'Pesanan', path: '/admin/orders', icon: AiOutlineShoppingCart },
        { text: 'Pre-order', path: '/admin/preorders', icon: AiOutlineCalendar }
      ]
    },
    {
      title: 'Katalog',
      items: [
        { text: 'Produk', path: '/admin/products', icon: AiOutlineShopping },
        { text: 'Kategori', path: '/admin/categories', icon: AiOutlineTags }
      ]
    },
    {
      title: 'Operasional',
      items: [
        { text: 'Kalender', path: '/admin/calendar', icon: AiOutlineCalendar },
        { text: 'Vendor', path: '/admin/vendors', icon: AiOutlineShop }
      ]
    },
    {
      title: 'Lainnya',
      items: [
        { text: 'Lihat homepage', path: '/', icon: AiOutlineHome },
        { text: 'Panduan', path: '/guide', icon: AiOutlineQuestionCircle },
        { text: 'Invoice', path: '/admin/invoices', icon: AiOutlineFileText },
        { text: 'Pengguna', path: '/admin/users', icon: AiOutlineUser },
        { text: 'Pengaturan', path: '/admin/settings', icon: AiOutlineSetting },
        { text: 'Keluar', onClick: onLogoutClick, icon: AiOutlineLogout }
      ]
    }
  ]

  const isActive = (itemPath?: string) => {
    if (!itemPath) return false
    if (itemPath === '/admin') return pathname === '/admin'
    return pathname === itemPath || pathname.startsWith(itemPath + '/')
  }

  return (
    <Box
      as="aside"
      bg="white"
      borderRight="1px solid"
      borderColor="gray.200"
      w="60"
      top="0"
      h="100%"
      minH="100vh"
      zIndex={99}
      display="flex"
      flexDirection="column"
      {...rest}
    >
      <Link href="/">
        <HStack p="5" spacing={3}>
          <FlexLogo />
          <Heading as="h1" size="sm" fontWeight="700">
            Bazaf
          </Heading>
        </HStack>
      </Link>

      <Box flex="1" overflowY="auto" px={3} pb={4}>
        {groups.map((group, gi) => (
          <Box key={gi} mt={gi === 0 ? 0 : 5}>
            {group.title && (
              <Text
                px={3}
                mb={2}
                fontSize="xs"
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing="wider"
                color="gray.400"
              >
                {group.title}
              </Text>
            )}
            <List spacing={0.5}>
              {group.items.map((item) => {
                const active = isActive(item.path)
                const content = (
                  <ListItem
                    as={HStack}
                    spacing={3}
                    h="10"
                    px={3}
                    cursor="pointer"
                    rounded="lg"
                    bg={active ? 'brand.50' : 'transparent'}
                    color={active ? 'brand.700' : 'gray.600'}
                    fontWeight={active ? '600' : '500'}
                    _hover={{ bg: active ? 'brand.50' : hoverBg }}
                    transition="background 0.15s, color 0.15s"
                  >
                    <Icon as={item.icon} boxSize={5} flexShrink={0} />
                    <Text fontSize="sm" noOfLines={1}>
                      {item.text}
                    </Text>
                  </ListItem>
                )
                return item.path ? (
                  <Link key={item.text} href={item.path} prefetch>
                    {content}
                  </Link>
                ) : (
                  <Box key={item.text} onClick={item.onClick}>
                    {content}
                  </Box>
                )
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Divider borderColor="gray.200" />
      <Box p={4}>
        <Text fontSize="xs" color="gray.400">
          v1.0 · Bazaf
        </Text>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Yakin ingin keluar?</ModalHeader>
          <ModalCloseButton />
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button
              colorScheme="red"
              mr={3}
              onClick={() =>
                handleLogout({
                  onLogout() {
                    router.replace(ADMIN_LOGIN_PATH)
                  }
                })
              }
            >
              Keluar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

function FlexLogo() {
  return (
    <FlexBrand>
      <Icon as={AiOutlineShopping} color="white" boxSize={5} />
    </FlexBrand>
  )
}

function FlexBrand({ children }: { children: React.ReactNode }) {
  return (
    <Flex
      bg="brand.500"
      color="white"
      w="9"
      h="9"
      borderRadius="lg"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      {children}
    </Flex>
  )
}

export default Sidebar

type Props = {
  display?: {
    base: string
    lg: string
  }
}
