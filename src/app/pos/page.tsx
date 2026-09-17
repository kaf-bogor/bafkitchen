'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Search2Icon } from '@chakra-ui/icons'
import {
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Spinner,
  Switch,
  Text,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import { endOfDay, startOfDay } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

import { useGetCategories } from '@/app/admin/(panel)/categories/actions'
import { useGetProducts } from '@/app/admin/(panel)/products/actions'
import { useGetVendors } from '@/app/admin/(panel)/vendors/actions'
import { useOrders } from '@/app/admin/actions'
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

const PER_PAGE = 60

export default function PosPage() {
  const router = useRouter()
  const toast = useToast()
  const { user, loading: authLoading } = useAuth()

  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  )
  const [receipt, setReceipt] = useState<IReceiptData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('default')
  const [vendorFilter, setVendorFilter] = useState('')
  const [showOutOfStock, setShowOutOfStock] = useState(true)

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

  const { data: products, total, loading: isLoadingProducts } = useGetProducts({
    channel: 'pos',
    limit: PER_PAGE,
    offset: (currentPage - 1) * PER_PAGE,
    q: search,
    categoryIds: selectedCategoryId ? [selectedCategoryId] : undefined,
    vendorId: vendorFilter || undefined,
    sort: sortBy !== 'default' ? sortBy : undefined,
    inStock: showOutOfStock ? undefined : true
  })
  const { data: categories } = useGetCategories()
  const { data: vendors } = useGetVendors()
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

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedCategoryId, vendorFilter, sortBy, showOutOfStock])

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

  const isLoadingCatalog = isLoadingProducts

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
          <HStack spacing={3} mb={4} flexWrap="wrap" align="center">
            <InputGroup maxW="280px" bg="white" rounded="md" boxShadow="sm">
              <InputLeftElement pointerEvents="none">
                <Search2Icon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Cari produk..."
                onChange={(e) => debouncedSearch(e.target.value)}
                border="none"
              />
            </InputGroup>

            <Select
              maxW="190px"
              bg="white"
              size="sm"
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
            >
              <option value="">Semua vendor</option>
              <option value="bazaf">Bazaf</option>
              {(vendors || []).map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </Select>

            <Select
              maxW="190px"
              bg="white"
              size="sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Urutkan: Default</option>
              <option value="name_asc">Nama A-Z</option>
              <option value="name_desc">Nama Z-A</option>
              <option value="price_asc">Harga termurah</option>
              <option value="price_desc">Harga termahal</option>
              <option value="stock_desc">Stok terbanyak</option>
              <option value="stock_asc">Stok tersedikit</option>
            </Select>

            <FormControl display="flex" alignItems="center" w="auto" gap={2}>
              <Switch
                colorScheme="green"
                isChecked={showOutOfStock}
                onChange={(e) => setShowOutOfStock(e.target.checked)}
              />
              <FormLabel mb={0} fontSize="sm" whiteSpace="nowrap">
                Tampilkan stok habis
              </FormLabel>
            </FormControl>
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

          {!isLoadingCatalog && products.length === 0 && (
            <Center flex={1} flexDirection="column" gap={3}>
              <Text color="gray.400">Tidak ada produk ditemukan</Text>
            </Center>
          )}

          {!isLoadingCatalog && products.length > 0 && (
            <>
              <SimpleGrid columns={[2, 3, 3, 4]} spacing={3} pb={4}>
                {products.map((product) => (
                  <ProductTile
                    key={product.id}
                    product={product}
                    cartQty={cart.getTotalQuantity(product.id)}
                    onAdd={handleAddProduct}
                  />
                ))}
              </SimpleGrid>

              {totalPages > 1 && (
                <Flex justify="center" align="center" gap={3} pb={4}>
                  <Button
                    size="sm"
                    variant="outline"
                    isDisabled={safePage === 1}
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                  >
                    Sebelumnya
                  </Button>
                  <Text fontSize="sm" color="gray.500">
                    Halaman {safePage} dari {totalPages}
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    isDisabled={safePage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    Berikutnya
                  </Button>
                </Flex>
              )}
            </>
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
