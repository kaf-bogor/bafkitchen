'use client'
import React, { useCallback, useRef, useState } from 'react'

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  IconButton,
  Stack,
  Text,
  Textarea,
  useToast,
  VStack,
  useDisclosure
} from '@chakra-ui/react'
import { useFormik } from 'formik'
import Link from 'next/link'
import { FaTrash, FaMinus, FaPlus, FaCartShopping } from 'react-icons/fa6'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { useGetSettings } from '@/app/admin/(panel)/settings/actions'
import { useAuth } from '@/app/UserProvider'
import { Layout } from '@/components/homepage'
import OrdererInput from '@/components/OrdererInput'
import ProductImage from '@/components/ProductImage'
import { Card, CardBody, CardHeader, EmptyState, Price } from '@/components/ui'
import { useCart } from '@/hooks/useCart'
import { IProduct, IOrder } from '@/interfaces'
import { schema, order, discount as discountUtil, currency } from '@/utils'

import { useCreateOrders } from './actions'

export default function CartPage() {
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const removeDialog = useDisclosure()
  const cancelRef = useRef(null)
  const [pendingRemoveId, setPendingRemoveId] = useState('')
  const { user } = useAuth()
  const cart = useCart()
  const items = (cart.getProducts && cart.getProducts()) || []
  const totalCartPrice = cart.getTotalPrice && cart.getTotalPrice()

  const { createOrder: createOrderAction, loading: isPending } =
    useCreateOrders()
  const { data: settings } = useGetSettings()

  const {
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
      notes: ''
    },
    validateOnChange: true,
    validationSchema: toFormikValidationSchema(schema.orderInputForm),
    onSubmit: async () => {
      // Open the WhatsApp tab synchronously so popup blockers allow it.
      const waWindow = window.open('', '_blank')
      try {
        const orderData = await createOrderAction({
          items: items,
          totalPrice: totalCartPrice,
          orderer: values
        })

        cart.clearCart()

        const encodedText = order.generateOrderText({
          items,
          customer: values,
          totalPrice: totalCartPrice,
          orderId: orderData.id
        })

        const adminPhoneNumber =
          settings?.admin_phone_number ||
          process.env.NEXT_PUBLIC_ADMIN_PHONE_NUMBER ||
          '6281296081249'
        const waUrl = `https://wa.me/${adminPhoneNumber}?text=${encodeURIComponent(encodedText)}`
        if (waWindow) {
          waWindow.location.href = waUrl
        } else {
          window.open(waUrl, '_blank')
        }
        toast({
          title: 'Berhasil',
          description: 'Order berhasil dibuat',
          status: 'success',
          duration: 9000,
          isClosable: true
        })
      } catch (error) {
        if (waWindow) waWindow.close()
        let errorMessage =
          (error as Error).message ||
          'Gagal membuat pesanan. Silahkan coba lagi.'

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

  const handleMinus = (product: IProduct.IProductCart) => {
    if (product.quantity > 1) {
      handleRemoveQty(product.id)
    } else {
      setPendingRemoveId(product.id)
      removeDialog.onOpen()
    }
  }

  const confirmRemove = () => {
    cart.removeProduct(pendingRemoveId)
    setPendingRemoveId('')
    removeDialog.onClose()
  }

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

  if (!items.length) {
    return (
      <Layout title="Keranjang">
        <EmptyState
          title="Keranjang Anda kosong"
          description="Jelajahi menu dan tambahkan item ke keranjang."
          icon={FaCartShopping}
          action={
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Button colorScheme="brand" mt={2}>
                Mulai Belanja
              </Button>
            </Link>
          }
        />
      </Layout>
    )
  }

  return (
    <Layout title="Keranjang">
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="600">
              Bersihkan keranjang
            </AlertDialogHeader>
            <AlertDialogBody color="text-body">
              Apakah anda yakin ingin menghapus semua item di keranjang?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} variant="outline">
                Batal
              </Button>
              <Button variant="danger" onClick={clearCart} ml={3}>
                Hapus
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <AlertDialog
        isOpen={removeDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={removeDialog.onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="600">
              Hapus item
            </AlertDialogHeader>
            <AlertDialogBody color="text-body">
              Apakah Anda yakin ingin menghapus item ini dari keranjang?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={removeDialog.onClose}
                variant="outline"
              >
                Batal
              </Button>
              <Button variant="danger" onClick={confirmRemove} ml={3}>
                Hapus
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <form onSubmit={handleSubmit}>
        <Stack
          spacing={{ base: 6, lg: 8 }}
          direction={{ base: 'column', lg: 'row' }}
          align="start"
          maxW="6xl"
          mx="auto"
        >
          <VStack
            spacing={6}
            flex={{ base: '1', lg: '5' }}
            w="full"
            align="stretch"
          >
            <Card>
              <CardHeader title="Data Pemesan" />
              <CardBody>
                <OrdererInput
                  order={values}
                  errors={errors}
                  onChange={(e) => setFieldValue(e.target.name, e.target.value)}
                />
              </CardBody>
            </Card>
          </VStack>

          <VStack
            spacing={6}
            flex={{ base: '1', lg: '7' }}
            w="full"
            align="stretch"
          >
            <Card>
              <CardHeader
                title="Keranjang Belanja"
                description={`${items.length} item`}
                actions={
                  <IconButton
                    aria-label="Kosongkan keranjang"
                    icon={<FaTrash size={15} />}
                    variant="ghost"
                    size="sm"
                    color="text-muted"
                    _hover={{ bg: 'red.50', color: 'red.500' }}
                    onClick={onOpen}
                  />
                }
              />
              <CardBody p={0}>
                <Stack spacing={0}>
                  {items.map((product, index) => {
                    const linePricing = discountUtil.getLinePricing(
                      product.price,
                      product.quantity,
                      product.discounts
                    )
                    const hasDiscount = linePricing.amount > 0
                    return (
                    <Box key={product.id}>
                      <VStack
                        p={{ base: 4, sm: 5 }}
                        spacing={4}
                        align="stretch"
                      >
                        <Flex gap={4} align="start">
                          <Box
                            boxSize={{ base: '72px', lg: '64px' }}
                            overflow="hidden"
                            borderRadius="lg"
                            flexShrink={0}
                          >
                            <ProductImage
                              src={product.imageUrl}
                              alt={product.name}
                              objectFit="cover"
                              boxSize="100%"
                            />
                          </Box>
                          <VStack
                            align="start"
                            flex={1}
                            spacing={1}
                            minW={0}
                            pt={0.5}
                          >
                            <Text
                              fontWeight="600"
                              fontSize="md"
                              color="text-strong"
                              lineHeight="1.35"
                              noOfLines={2}
                            >
                              {product.name}
                            </Text>
                            {hasDiscount ? (
                              <HStack spacing={2} align="baseline" flexWrap="wrap">
                                <Text
                                  fontSize="sm"
                                  fontWeight="600"
                                  color="brand.700"
                                >
                                  {currency.toIDRFormat(linePricing.unitPrice)}
                                </Text>
                                <Text
                                  fontSize="xs"
                                  color="text-subtle"
                                  textDecoration="line-through"
                                >
                                  {currency.toIDRFormat(product.price)}
                                </Text>
                                <Badge colorScheme="red" fontSize="xs">
                                  {discountUtil.discountLabel(
                                    linePricing.discount!
                                  )}
                                </Badge>
                              </HStack>
                            ) : (
                              <Price value={product.price} size="sm" />
                            )}
                          </VStack>
                        </Flex>

                        <Flex
                          justify="space-between"
                          align="center"
                          wrap="wrap"
                          gap={3}
                        >
                          <HStack
                            spacing={1}
                            border="1px solid"
                            borderColor="border-subtle"
                            borderRadius="lg"
                            p={1}
                            bg="surface"
                          >
                            <IconButton
                              aria-label="Kurangi jumlah"
                              icon={<FaMinus size={13} />}
                              size="sm"
                              variant="ghost"
                              color="text-muted"
                              _hover={{ bg: 'red.50', color: 'red.500' }}
                              onClick={() => handleMinus(product)}
                            />
                            <Box
                              minW="32px"
                              textAlign="center"
                              fontWeight="600"
                              fontSize="sm"
                              color="text-strong"
                            >
                              {product.quantity}
                            </Box>
                            <IconButton
                              aria-label="Tambah jumlah"
                              icon={<FaPlus size={13} />}
                              size="sm"
                              variant="ghost"
                              color="brand.600"
                              _hover={{ bg: 'green.50', color: 'brand.700' }}
                              onClick={() => handleAddQty(product)}
                            />
                          </HStack>
                          <Price value={linePricing.lineTotal} size="md" />
                        </Flex>

                        <Box>
                          <Text
                            fontSize="xs"
                            fontWeight="600"
                            color="text-body"
                            mb={1}
                          >
                            Catatan untuk item ini
                          </Text>
                          <Textarea
                            size="sm"
                            rows={2}
                            value={product.notes || ''}
                            onChange={(e) =>
                              cart.updateProductNote(product.id, e.target.value)
                            }
                            placeholder="Contoh: Nama santri: Ahmad Fauzi, Kelas: 5A. Catatan: tanpa sambal, nasi setengah, tambah kerupuk."
                            bg="gray.50"
                          />
                          <Text fontSize="xs" color="text-subtle" mt={1}>
                            Tulis nama santri & kelas penerima, plus permintaan
                            khusus (mis. tanpa pedas, tanpa sambal).
                          </Text>
                        </Box>
                      </VStack>
                      {index < items.length - 1 && <Divider />}
                    </Box>
                    )
                  })}
                </Stack>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Ringkasan Pesanan" />
              <CardBody>
                <VStack spacing={4}>
                  <Flex justify="space-between" w="full">
                    <Text color="text-muted" fontSize="sm">
                      Total item
                    </Text>
                    <Text fontWeight="600" color="text-strong" fontSize="sm">
                      {items.reduce((acc, item) => acc + item.quantity, 0)} pcs
                    </Text>
                  </Flex>
                  <Divider />
                  <Flex justify="space-between" w="full" align="baseline">
                    <Text fontSize="md" fontWeight="600" color="text-strong">
                      Total harga
                    </Text>
                    <Price value={totalCartPrice} size="xl" />
                  </Flex>
                  <Button
                    w="full"
                    size="lg"
                    type="submit"
                    colorScheme="brand"
                    isDisabled={!isValid || items.length < 1}
                    isLoading={isSubmitting || isPending}
                    loadingText="Memproses pesanan..."
                  >
                    <HStack spacing={2}>
                      <FaCartShopping />
                      <Text>Pesan Sekarang</Text>
                    </HStack>
                  </Button>
                  <Text fontSize="xs" color="text-subtle" textAlign="center">
                    Dengan melakukan pemesanan, Anda menyetujui syarat dan
                    ketentuan kami
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </Stack>
      </form>
    </Layout>
  )
}
