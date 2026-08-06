'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Search2Icon } from '@chakra-ui/icons'
import {
  Button,
  Center,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Text,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import { endOfDay, startOfDay } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

import { useOrders } from '@/app/admin/actions'
import { useGetCategories } from '@/app/admin/categories/actions'
import { useGetProducts } from '@/app/admin/products/actions'
import { useGetSchedules } from '@/app/admin/schedules/actions'
import { useAuth } from '@/app/UserProvider'
import { EOrderChannel } from '@/constants/order'
import { usePosCart } from '@/hooks/usePosCart'
import { IOrder, IProduct } from '@/interfaces'
import { IPaymentInfo } from '@/interfaces/order'
import { IReceiptData, buildReceiptData } from '@/utils/receipt'

import { useCreatePosOrder } from './actions'
import CartPanel from './components/CartPanel'
import DailySummaryModal from './components/DailySummaryModal'
import HeldOrdersModal from './components/HeldOrdersModal'
import OrderHistoryModal from './components/OrderHistoryModal'
import PaymentModal from './components/PaymentModal'
import ProductTile from './components/ProductTile'
import ReceiptModal from './components/Receipt'
import TopBar from './components/TopBar'

export default function PosPage() {
  const router = useRouter()
  const toast = useToast()
  const { user, loading: authLoading } = useAuth()

  const [viewMode, setViewMode] = useState<'schedule' | 'all'>('schedule')
  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  )
  const [receipt, setReceipt] = useState<IReceiptData | null>(null)

  const cart = usePosCart()
  const { createPosOrder, loading: isProcessing } = useCreatePosOrder()

  const paymentModal = useDisclosure()
  const receiptModal = useDisclosure()
  const heldOrdersModal = useDisclosure()
  const historyModal = useDisclosure()
  const summaryModal = useDisclosure()

  // Auth guard: POS is only for signed-in users
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/admin/login')
    }
  }, [authLoading, user, router])

  const todayStart = useMemo(() => startOfDay(new Date()), [])
  const todayEnd = useMemo(() => endOfDay(new Date()), [])

  const { data: schedules, loading: isLoadingSchedules } = useGetSchedules(
    todayStart,
    todayEnd,
    !!user
  )
  const { data: allProducts, loading: isLoadingProducts } = useGetProducts()
  const { data: categories } = useGetCategories()
  const { data: todayOrders, loading: isLoadingOrders } = useOrders(
    todayStart.toISOString(),
    todayEnd.toISOString(),
    !!user
  )

  const posOrders = useMemo(
    () =>
      (todayOrders || []).filter(
        (o: any) => o.channel === EOrderChannel.POS
      ),
    [todayOrders]
  )

  const scheduledProducts = useMemo(
    () =>
      (schedules || []).flatMap((s) => s.products || []) as
        IProduct.IProductResponse[],
    [schedules]
  )

  const displayedProducts = useMemo(() => {
    const source = viewMode === 'schedule' ? scheduledProducts : allProducts
    const getCategoryIds = (p: any): string[] =>
      p.categories?.length
        ? p.categories.map((c: any) => c.id)
        : p.categoryIds || []

    return (source || []).filter((p) => {
      const matchesSearch =
        !search || p.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        !selectedCategoryId ||
        getCategoryIds(p).includes(selectedCategoryId)
      return matchesSearch && matchesCategory
    })
  }, [viewMode, scheduledProducts, allProducts, search, selectedCategoryId])

  const debouncedSearch = useDebouncedCallback(setSearch, 300)

  const handleAddProduct = useCallback(
    (product: IProduct.IProductResponse) => {
      cart.addProduct(IProduct.IProduct.fromData(product))
    },
    [cart]
  )

  const handlePaymentConfirm = useCallback(
    async ({
      payment,
      customerName,
      notes
    }: {
      payment: IPaymentInfo
      customerName?: string
      notes?: string
    }) => {
      try {
        const items = cart.getProducts()
        const totalPrice = cart.getTotalPrice()

        const order = await createPosOrder({
          items,
          totalPrice,
          customerName,
          notes,
          payment,
          cashierName: user?.displayName || user?.email || undefined
        })

        cart.clearCart()
        paymentModal.onClose()
        setReceipt(buildReceiptData(order))
        receiptModal.onOpen()

        toast({
          title: 'Pembayaran berhasil',
          description: `Order ${order.orderNumber} tersimpan`,
          status: 'success',
          duration: 5000,
          isClosable: true
        })
      } catch (err) {
        toast({
          title: 'Gagal menyimpan transaksi',
          description: (err as Error).message,
          status: 'error',
          duration: 9000,
          isClosable: true
        })
      }
    },
    [cart, createPosOrder, user, paymentModal, receiptModal, toast]
  )

  const handleReprint = useCallback(
    (order: IOrder.IOrder) => {
      setReceipt(buildReceiptData(order))
      historyModal.onClose()
      receiptModal.onOpen()
    },
    [historyModal, receiptModal]
  )

  if (authLoading || !user) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="green.300" />
      </Center>
    )
  }

  const isLoadingCatalog =
    viewMode === 'schedule' ? isLoadingSchedules : isLoadingProducts

  return (
    <Flex direction="column" h="100vh" bg="gray.100" overflow="hidden">
      <TopBar
        onOpenHistory={historyModal.onOpen}
        onOpenSummary={summaryModal.onOpen}
        onOpenHeldOrders={heldOrdersModal.onOpen}
      />

      <Flex flex={1} overflow="hidden" direction={{ base: 'column', lg: 'row' }}>
        {/* Catalog */}
        <Flex
          direction="column"
          flex={1}
          overflowY="auto"
          p={4}
          minH={{ base: '50vh', lg: 'auto' }}
        >
          <HStack spacing={3} mb={4} flexWrap="wrap">
            <InputGroup maxW="320px" bg="white" rounded="md" boxShadow="sm">
              <InputLeftElement pointerEvents="none">
                <Search2Icon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Cari produk..."
                onChange={(e) => debouncedSearch(e.target.value)}
                border="none"
              />
            </InputGroup>
            <HStack
              spacing={0}
              bg="white"
              rounded="md"
              boxShadow="sm"
              p={1}
            >
              <Button
                size="sm"
                colorScheme={viewMode === 'schedule' ? 'green' : 'gray'}
                variant={viewMode === 'schedule' ? 'solid' : 'ghost'}
                onClick={() => setViewMode('schedule')}
              >
                Menu Hari Ini
              </Button>
              <Button
                size="sm"
                colorScheme={viewMode === 'all' ? 'green' : 'gray'}
                variant={viewMode === 'all' ? 'solid' : 'ghost'}
                onClick={() => setViewMode('all')}
              >
                Semua Produk
              </Button>
            </HStack>
          </HStack>

          <HStack spacing={2} mb={4} flexWrap="wrap">
            <Button
              size="xs"
              rounded="full"
              colorScheme={!selectedCategoryId ? 'green' : 'gray'}
              variant={!selectedCategoryId ? 'solid' : 'outline'}
              onClick={() => setSelectedCategoryId(null)}
            >
              Semua
            </Button>
            {(categories || []).map((category) => (
              <Button
                key={category.id}
                size="xs"
                rounded="full"
                colorScheme={
                  selectedCategoryId === category.id ? 'green' : 'gray'
                }
                variant={
                  selectedCategoryId === category.id ? 'solid' : 'outline'
                }
                onClick={() =>
                  setSelectedCategoryId(
                    selectedCategoryId === category.id ? null : category.id
                  )
                }
              >
                {category.name}
              </Button>
            ))}
          </HStack>

          {isLoadingCatalog && (
            <Center flex={1}>
              <Spinner size="xl" color="green.300" />
            </Center>
          )}

          {!isLoadingCatalog && displayedProducts.length === 0 && (
            <Center flex={1} flexDirection="column" gap={3}>
              <Text color="gray.400">
                {viewMode === 'schedule'
                  ? 'Tidak ada menu terjadwal hari ini'
                  : 'Tidak ada produk ditemukan'}
              </Text>
              {viewMode === 'schedule' && (
                <Button
                  size="sm"
                  colorScheme="green"
                  variant="outline"
                  onClick={() => setViewMode('all')}
                >
                  Lihat Semua Produk
                </Button>
              )}
            </Center>
          )}

          {!isLoadingCatalog && displayedProducts.length > 0 && (
            <SimpleGrid columns={[2, 3, 3, 4]} spacing={3} pb={4}>
              {displayedProducts.map((product) => (
                <ProductTile
                  key={product.id}
                  product={product}
                  cartQty={cart.getTotalQuantity(product.id)}
                  onAdd={handleAddProduct}
                />
              ))}
            </SimpleGrid>
          )}
        </Flex>

        {/* Cart */}
        <CartPanel onCheckout={paymentModal.onOpen} />
      </Flex>

      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={paymentModal.onClose}
        total={cart.getTotalPrice()}
        loading={isProcessing}
        onConfirm={handlePaymentConfirm}
      />

      <ReceiptModal
        isOpen={receiptModal.isOpen}
        onClose={receiptModal.onClose}
        receipt={receipt}
      />

      <HeldOrdersModal
        isOpen={heldOrdersModal.isOpen}
        onClose={heldOrdersModal.onClose}
      />

      <OrderHistoryModal
        isOpen={historyModal.isOpen}
        onClose={historyModal.onClose}
        orders={posOrders}
        loading={isLoadingOrders}
        onReprint={handleReprint}
      />

      <DailySummaryModal
        isOpen={summaryModal.isOpen}
        onClose={summaryModal.onClose}
        orders={posOrders}
      />
    </Flex>
  )
}
