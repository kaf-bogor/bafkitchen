'use client'
import React, { useCallback, useRef } from 'react'

import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
  useToast,
  VStack,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  HStack,
  IconButton,
  Container,
  Center
} from '@chakra-ui/react'
import { useFormik } from 'formik'
import Link from 'next/link'
import { FaTrash, FaMinus, FaPlus, FaCartShopping } from 'react-icons/fa6'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { useGetSettings } from '@/app/admin/settings/actions'
import { useAuth } from '@/app/UserProvider'
import { Layout } from '@/components/homepage'
import OrdererInput from '@/components/OrdererInput'
import { useCart } from '@/hooks/useCart'
import { IProduct, IOrder } from '@/interfaces'
import { currency, schema, order } from '@/utils'

import { useCreateOrders } from './actions'

export default function CartPage() {
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef(null)
  const { user } = useAuth()
  const cart = useCart()
  const items = (cart.getProducts && cart.getProducts()) || []
  const totalCartPrice = cart.getTotalPrice && cart.getTotalPrice()

  const { createOrder: createOrderAction, loading: isPending } = useCreateOrders()
  const { data: settings } = useGetSettings()

  const {
    dirty,
    errors,
    isValid,
    handleSubmit,
    values,
    setFieldValue,
    isSubmitting
  } = useFormik<IOrder.IOrdererInputForm>({
    initialValues: {
      name: user?.displayName || '',
      phoneNumber: user?.phoneNumber || '',
      namaSantri: '',
      kelas: '',
      notes: ''
    },
    validateOnChange: true,
    validationSchema: toFormikValidationSchema(schema.orderInputForm),
    onSubmit: async () => {
      console.log('🎯 Form submitted with values:', values)
      console.log('🛒 Cart items:', items)
      console.log('💰 Total price:', totalCartPrice)

      try {
        const orderData = await createOrderAction({
          items: items,
          totalPrice: totalCartPrice,
          orderer: values
        })

        console.log('✅ Order creation successful:', orderData)
        cart.clearCart()

        const encodedText = order.generateOrderText({
          items,
          customer: values,
          totalPrice: totalCartPrice,
          orderId: orderData.id
        })

        const adminPhoneNumber = settings?.admin_phone_number || process.env.NEXT_PUBLIC_ADMIN_PHONE_NUMBER || '6281296081249'
        window.open(
          `https://wa.me/${adminPhoneNumber}?text=${encodeURIComponent(encodedText)}`,
          '_blank'
        )
        toast({
          title: 'Berhasil',
          description: 'Order berhasil dibuat',
          status: 'success',
          duration: 9000,
          isClosable: true
        })
      } catch (error) {
        console.error('❌ Order creation failed:', error)
        let errorMessage =
          (error as Error).message || 'Gagal membuat pesanan. Silahkan coba lagi.'

        if ((error as any).response?.data?.error?.includes('out of stock')) {
          errorMessage = (error as any).response.data.error
        }

        toast({
          title: 'Error',
          description: errorMessage,
          status: 'error',
          duration: 9000,
          isClosable: true
        })
      }
    }
  })

  const handleAddQty = useCallback(
    (product: IProduct.IProductCart) => {
      cart.addProduct(product)
    },
    [cart]
  )

  const handleRemoveQty = useCallback(
    (productId: string) => {
      cart.reduceQuantity(productId)
    },
    [cart]
  )

  const clearCart = useCallback(() => {
    cart.clearCart()
    toast({
      title: 'Berhasil mengosongkan keranjang',
      status: 'success',
      duration: 3000,
      isClosable: true
    })
    onClose()
  }, [cart, onClose, toast])

  // Show empty cart message if no items
  if (!items.length) {
    return (
      <Layout>
        <Container maxW="container.lg" py={8}>
          <Center flexDirection="column" minH="400px">
            <FaCartShopping size={80} color="gray" />
            <Text fontSize="xl" color="gray.500" mt={4} mb={6}>
              Keranjang Anda kosong
            </Text>
            <Link href="/">
              <Button colorScheme="blue" size="lg">
                Mulai Belanja
              </Button>
            </Link>
          </Center>
        </Container>
      </Layout>
    )
  }

  return (
    <Layout>
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Bersihkan keranjang
            </AlertDialogHeader>

            <AlertDialogBody>
              Apakah anda yakin ingin menghapus semua item di keranjang?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Batal
              </Button>
              <Button colorScheme="red" onClick={clearCart} ml={3}>
                Hapus
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <Container maxW="container.xl" py={6}>
        <form onSubmit={handleSubmit}>
          <Stack
            spacing={6}
            direction={{ base: 'column', lg: 'row' }}
            align="start"
          >
            {/* Left Column - Form (5/8 width on desktop, full width on mobile) */}
            <VStack
              spacing={6}
              flex={{ base: '1', lg: '5' }}
              w="full"
              align="stretch"
            >
              <Card>
                <CardHeader>
                  <Heading size={{ base: 'md', lg: 'lg' }}>
                    Data Pemesan
                  </Heading>
                </CardHeader>
                <Divider />
                <CardBody>
                  <OrdererInput
                    order={values}
                    errors={errors}
                    onChange={(e) =>
                      setFieldValue(e.target.name, e.target.value)
                    }
                  />
                </CardBody>
              </Card>
            </VStack>

            {/* Right Column - Products & Checkout (3/8 width on desktop, full width on mobile) */}
            <VStack
              spacing={6}
              flex={{ base: '1', lg: '3' }}
              w="full"
              align="stretch"
            >
              <Card>
                <CardHeader pb={2}>
                  <Flex justify="space-between" align="center">
                    <HStack>
                      <FaCartShopping color="blue" />
                      <Heading size={{ base: 'sm', lg: 'md' }}>
                        Keranjang Belanja
                      </Heading>
                      <Badge
                        colorScheme="blue"
                        variant="solid"
                        borderRadius="full"
                        px={2}
                      >
                        {items.length} item
                      </Badge>
                    </HStack>
                    <IconButton
                      aria-label="Clear cart"
                      icon={<FaTrash />}
                      colorScheme="red"
                      variant="ghost"
                      size="sm"
                      onClick={onOpen}
                    />
                  </Flex>
                </CardHeader>
                <Divider />
                <CardBody p={0}>
                  <Stack spacing={0}>
                    {items.map((product, index) => (
                      <Box key={product.id}>
                        <VStack p={4} spacing={3} align="stretch">
                          <Flex
                            gap={3}
                            direction={{ base: 'row', sm: 'row' }}
                            align="start"
                          >
                            <Box
                              width={{ base: '70px', lg: '60px' }}
                              height={{ base: '70px', lg: '60px' }}
                              overflow="hidden"
                              borderRadius="md"
                              flexShrink={0}
                            >
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                objectFit="cover"
                                boxSize="100%"
                              />
                            </Box>
                            <VStack align="start" flex={1} spacing={1} ml={3}>
                              <Text
                                fontWeight="semibold"
                                fontSize={{ base: 'md', lg: 'sm' }}
                                noOfLines={2}
                              >
                                {product.name}
                              </Text>
                              <Text
                                color="green.600"
                                fontWeight="bold"
                                fontSize={{ base: 'md', lg: 'sm' }}
                              >
                                {currency.toIDRFormat(product.price)}
                              </Text>
                            </VStack>
                          </Flex>

                          <Flex
                            justify="space-between"
                            align="center"
                            direction={{ base: 'row', sm: 'row' }}
                          >
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="Decrease quantity"
                                icon={<FaMinus />}
                                size={{ base: 'sm', lg: 'xs' }}
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleRemoveQty(product.id)}
                                isDisabled={product.quantity <= 1}
                              />
                              <Box
                                minW={{ base: '40px', lg: '32px' }}
                                textAlign="center"
                                fontWeight="semibold"
                                fontSize={{ base: 'md', lg: 'sm' }}
                              >
                                {product.quantity}
                              </Box>
                              <IconButton
                                aria-label="Increase quantity"
                                icon={<FaPlus />}
                                size={{ base: 'sm', lg: 'xs' }}
                                colorScheme="green"
                                variant="ghost"
                                onClick={() => handleAddQty(product)}
                              />
                            </HStack>
                            <Text
                              color="gray.600"
                              fontSize={{ base: 'md', lg: 'sm' }}
                              fontWeight="medium"
                            >
                              {currency.toIDRFormat(
                                product.price * product.quantity
                              )}
                            </Text>
                          </Flex>
                        </VStack>
                        {index < items.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </Stack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Heading size={{ base: 'md', lg: 'md' }}>
                    Ringkasan Pesanan
                  </Heading>
                </CardHeader>
                <Divider />
                <CardBody>
                  <VStack spacing={4}>
                    <HStack justify="space-between" w="full">
                      <Text fontSize={{ base: 'md', lg: 'sm' }}>
                        Total Item:
                      </Text>
                      <Text
                        fontWeight="semibold"
                        fontSize={{ base: 'md', lg: 'sm' }}
                      >
                        {items.reduce((acc, item) => acc + item.quantity, 0)}{' '}
                        pcs
                      </Text>
                    </HStack>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="lg" fontWeight="bold">
                        Total Harga:
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="green.600">
                        {currency.toIDRFormat(totalCartPrice)}
                      </Text>
                    </HStack>
                    <Divider />
                    <Button
                      w="full"
                      size="lg"
                      colorScheme="blue"
                      type="submit"
                      isDisabled={!dirty || !isValid || items.length < 1}
                      isLoading={isSubmitting || isPending}
                      loadingText="Memproses pesanan..."
                    >
                      <HStack spacing={2}>
                        <FaCartShopping />
                        <Text>Pesan Sekarang</Text>
                      </HStack>
                    </Button>
                    <Text fontSize="xs" color="gray.500" textAlign="center">
                      Dengan melakukan pemesanan, Anda menyetujui syarat dan
                      ketentuan kami
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </Stack>
        </form>
      </Container>
    </Layout>
  )
}
