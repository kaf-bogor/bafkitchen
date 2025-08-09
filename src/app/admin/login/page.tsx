'use client'

import React, { useState } from 'react'

import {
  Center,
  Flex,
  Stack,
  Button,
  Heading,
  Modal,
  ModalOverlay,
  ModalContent,
  Text,
  useColorModeValue,
  useDisclosure
} from '@chakra-ui/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AiFillHome } from 'react-icons/ai'

import { useAuth } from '@/app/UserProvider'
import { handleGoogleLogin, saveUserToFirestore } from '@/utils/firebase'

export default function AdminLoginPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [error, setError] = useState<string | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const bgColor = useColorModeValue('gray.50', 'gray.800')
  const bgColor2 = useColorModeValue('white', 'gray.700')

  const handleLogin = async () => {
    await handleGoogleLogin({
      onError: setError,
      onSuccess: (user) => {
        const { uid, displayName, email, photoURL, phoneNumber } = user
        saveUserToFirestore(
          'admin',
          {
            uid,
            displayName,
            email,
            photoURL,
            phoneNumber
          },
          {
            onError() {
              setError('Error saving user to Firestore')
            },
            async onSuccess() {
              // Session cookies removed; rely on Firebase client auth
              router.push('/admin/')
            }
          }
        )
      }
    })
  }

  if (user) {
    return (
      <Center bg="honeydew" h="100px" color="white">
        Redirecting
      </Center>
    )
  }

  return (
    <Flex minH={'100vh'} align={'center'} justify={'center'} bg={bgColor}>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <Flex p={6}>
            Harap hubungi admin bazaf untuk mendaftar sebagai vendor.
          </Flex>
        </ModalContent>
      </Modal>
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
        <Stack>
          <Link href="/">
            <Flex align="center" gap={1}>
              {`<`}
              <Text>Kembali</Text>
              <AiFillHome />
            </Flex>
          </Link>
        </Stack>
        <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
          <Stack align={'center'}>
            <Heading fontSize={'4xl'}>Admin Dashboard</Heading>
          </Stack>
          <Stack
            align={'center'}
            rounded={'lg'}
            bg={bgColor2}
            boxShadow={'lg'}
            p={8}
          >
            <Stack spacing={4}>
              {error && <Text color="red.500">{error}</Text>}
              <button className="google-sign-in-button" onClick={handleLogin}>
                Login dengan google
              </button>
            </Stack>
            <Button my={4} size="xs" onClick={onOpen}>
              Daftar menjadi vendor
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Flex>
  )
}
