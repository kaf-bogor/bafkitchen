'use client'

import React, { useState } from 'react'

import { Box, Button, Flex, Heading, Text, useColorModeValue, VStack, HStack, Icon, Container, ScaleFade } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import { IoArrowBack } from 'react-icons/io5'

import { useAuth } from '@/app/UserProvider'
import { handleGoogleLogin, saveUserToFirestore } from '@/utils/firebase'

const MotionBox = motion(Box)

export default function SimpleCard() {
  const router = useRouter()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)

  // Define all color mode values at the top level
  const bgMain = useColorModeValue('gray.50', 'gray.900')
  const bgCard = useColorModeValue('white', 'gray.800')
  const textPrimary = useColorModeValue('gray.800', 'white')
  const textSecondary = useColorModeValue('gray.600', 'gray.400')
  const textTertiary = useColorModeValue('gray.500', 'gray.500')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const buttonBg = useColorModeValue('white', 'gray.700')
  const buttonColor = useColorModeValue('gray.700', 'white')
  const buttonBorder = useColorModeValue('gray.300', 'gray.600')
  const buttonHoverBg = useColorModeValue('gray.50', 'gray.600')
  const buttonHoverBorder = useColorModeValue('gray.400', 'gray.500')

  const handleLogin = async () => {
    await handleGoogleLogin({
      onError: setError,
      onSuccess: (user) => {
        const { uid, displayName, email, photoURL, phoneNumber } = user
        saveUserToFirestore(
          'customer',
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
            onSuccess() {
              router.push('/dashboard/')
            }
          }
        )
      }
    })
  }

  if (user) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg={bgMain}>
        <VStack spacing={4}>
          <Box className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></Box>
          <Text color={textSecondary} fontSize="sm">Redirecting...</Text>
        </VStack>
      </Flex>
    )
  }

  return (
    <Flex minH="100vh" bg={bgMain}>
      {/* Background Pattern */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.05}
        bgImage="radial-gradient(circle at 1px 1px, rgba(0,0,0,0.3) 1px, transparent 0)"
        bgSize="20px 20px"
      />
      
      <Container maxW="md" mx="auto" p={0}>
        <Flex minH="100vh" align="center" justify="center" position="relative">
          <ScaleFade initialScale={0.9} in={true}>
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              w="full"
              maxW="md"
            >
              {/* Back Button */}
              <Box mb={8}>
                <Link href="/">
                  <HStack 
                    spacing={2} 
                    color={textSecondary}
                    _hover={{ color: textPrimary }}
                    transition="color 0.2s"
                  >
                    <Icon as={IoArrowBack} />
                    <Text fontSize="sm" fontWeight="medium">Kembali</Text>
                  </HStack>
                </Link>
              </Box>

              {/* Main Card */}
              <MotionBox
                bg={bgCard}
                borderRadius="2xl"
                boxShadow={"xl"}
                border="1px solid"
                borderColor={borderColor}
                p={10}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <VStack spacing={8}>
                  {/* Header */}
                  <VStack spacing={3} textAlign="center">
                    <Heading 
                      size="xl" 
                      color={textPrimary}
                      fontWeight="bold"
                      letterSpacing="tight"
                    >
                      Selamat Datang
                    </Heading>
                    <Text 
                      color={textSecondary} 
                      fontSize="lg"
                      maxW="sm"
                      lineHeight="relaxed"
                    >
                      Masuk ke akun Anda untuk melanjutkan
                    </Text>
                  </VStack>

                  {/* Error Message */}
                  {error && (
                    <MotionBox
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      w="full"
                      bg="red.50"
                      border="1px solid"
                      borderColor="red.200"
                      borderRadius="lg"
                      p={4}
                    >
                      <Text color="red.600" fontSize="sm" textAlign="center">
                        {error}
                      </Text>
                    </MotionBox>
                  )}

                  {/* Google Sign In Button */}
                  <Button
                    onClick={handleLogin}
                    size="lg"
                    w="full"
                    h={14}
                    bg={buttonBg}
                    color={buttonColor}
                    border="2px solid"
                    borderColor={buttonBorder}
                    _hover={{
                      bg: buttonHoverBg,
                      borderColor: buttonHoverBorder,
                      transform: 'translateY(-1px)',
                      boxShadow: 'lg'
                    }}
                    _active={{
                      transform: 'translateY(0px)',
                      boxShadow: 'sm'
                    }}
                    transition="all 0.2s"
                    borderRadius="xl"
                    fontWeight="semibold"
                    fontSize="md"
                  >
                    <HStack spacing={3}>
                      <Icon as={FcGoogle} boxSize={5} />
                      <Text>Masuk dengan Google</Text>
                    </HStack>
                  </Button>

                  {/* Footer */}
                  <Text 
                    color={textTertiary} 
                    fontSize="xs"
                    textAlign="center"
                    maxW="sm"
                  >
                    Dengan masuk, Anda menyetujui syarat dan ketentuan kami
                  </Text>
                </VStack>
              </MotionBox>
            </MotionBox>
          </ScaleFade>
        </Flex>
      </Container>
    </Flex>
  )
}
