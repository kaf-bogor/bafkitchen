import React from 'react'

import {
  Box,
  Button,
  HStack,
  Heading,
  Link as LinkChakra,
  List,
  ListIcon,
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
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  AiOutlineBarChart,
  AiOutlineLogout,
  AiOutlineShop,
  AiOutlineShopping,
  AiOutlineAppstore
} from 'react-icons/ai'

import { ADMIN_LOGIN_PATH } from '@/constants/auth'
import { handleLogout } from '@/utils/auth'

const Sidebar = ({ ...rest }: Props) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const vendorId = searchParams.get('vendorId')

  const router = useRouter()

  const { isOpen, onOpen, onClose } = useDisclosure()

  const listItems: SidebarMenuItem[] = [
    {
      id: 1,
      text: 'Home',
      path: '/dashboard',
      icon: AiOutlineShop
    },
    {
      id: 3,
      text: 'Produk',
      path: '/dashboard/products',
      icon: AiOutlineAppstore
    },
    {
      id: 4,
      text: 'Rekap',
      path: '/dashboard/reports',
      icon: AiOutlineBarChart
    },
    {
      id: 2,
      text: 'Setting',
      path: '/dashboard/settings',
      icon: AiOutlineShopping
    },
    {
      id: 6,
      text: 'Logout',
      onClick: onOpen,
      icon: AiOutlineLogout
    }
  ]

  const SidebarItem = ({
    path,
    onClick,
    children
  }: {
    path?: string
    onClick?: SidebarMenuItem['onClick']
    children: React.ReactNode
  }) => {
    return path ? (
      <Link
        href={vendorId ? `${path}?vendorId=${vendorId}` : path}
        prefetch
      >
        {children}
      </Link>
    ) : (
      <LinkChakra onClick={onClick}>{children}</LinkChakra>
    )
  }

  const isActive = (itemPath?: string) => {
    if (!itemPath) return false
    return pathname === itemPath || pathname.startsWith(itemPath + '/')
  }

  return (
    <Box
      as="aside"
      borderRight="2px"
      borderColor={useColorModeValue('gray.200', 'gray.900')}
      w="60"
      top="0"
      h="100%"
      minH="100vh"
      zIndex={99}
      {...rest}
    >
      <Link href="/admin">
        <HStack p="2.5" h="57px" justify="space-between">
          <Heading as="h1" size="md">
            Customer Dashboard
          </Heading>
        </HStack>
      </Link>
      <Box>
        <List spacing={0} p="0.5">
          {listItems.map(({ id, icon, text, path, onClick }) => (
            <SidebarItem key={id} path={path} onClick={onClick}>
              <ListItem
                as={HStack}
                spacing={0}
                h="10"
                pl="2.5"
                pr="2"
                cursor="pointer"
                color={isActive(path) ? 'brand.700' : 'gray.600'}
                fontWeight={isActive(path) ? '600' : '500'}
                backgroundColor={isActive(path) ? 'brand.50' : 'transparent'}
                // eslint-disable-next-line react-hooks/rules-of-hooks
                _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                rounded="md"
                transition="background 0.15s, color 0.15s"
              >
                <ListIcon boxSize={5} as={icon} />
                {text && <Text fontSize="sm">{text}</Text>}
              </ListItem>
            </SidebarItem>
          ))}
        </List>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Yakin ingin logout?</ModalHeader>
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
              Logout
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default Sidebar

type SidebarMenuItem = {
  id: number
  path?: string
  onClick?: () => void
  text: string
  icon: React.ElementType
}

type Props = {
  display?: {
    base: string
    lg: string
  }
}
