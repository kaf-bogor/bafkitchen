'use client'

import React, { useMemo, useState } from 'react'

import { AddIcon, DeleteIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Text,
  VStack,
  useToast
} from '@chakra-ui/react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

import { useGetProducts } from '@/app/admin/(panel)/products/actions'
import { useCreatePurchase } from '@/app/admin/(panel)/purchases/actions'
import { Layout } from '@/components'
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui'
import { currency } from '@/utils'

interface DraftItem {
  productId: string
  qty: number
  costPrice: number
  sellPrice: number
}

const todayInput = () => format(new Date(), 'yyyy-MM-dd')

const emptyItem = (): DraftItem => ({
  productId: '',
  qty: 1,
  costPrice: 0,
  sellPrice: 0
})

export default function NewPurchasePage() {
  const toast = useToast()
  const router = useRouter()
  const { data: products, loading: isLoadingProducts } = useGetProducts()
  const { createPurchase, loading: isSaving } = useCreatePurchase()

  const [supplier, setSupplier] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(todayInput())
  const [note, setNote] = useState('')
  const [items, setItems] = useState<DraftItem[]>([emptyItem()])

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  )

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const subtotal = item.qty * item.costPrice
        acc.cost += subtotal
        acc.margin += (item.sellPrice - item.costPrice) * item.qty
        return acc
      },
      { cost: 0, margin: 0 }
    )
  }, [items])

  const updateItem = (index: number, patch: Partial<DraftItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    )
  }

  const handleProductChange = (index: number, productId: string) => {
    const product = productMap.get(productId)
    updateItem(index, {
      productId,
      costPrice: product?.priceBase ?? 0,
      sellPrice: product?.price ?? 0
    })
  }

  const addRow = () => setItems((prev) => [...prev, emptyItem()])
  const removeRow = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async () => {
    const validItems = items.filter(
      (item) => item.productId && item.qty > 0
    )
    if (!validItems.length) {
      toast({
        title: 'Belum ada produk',
        description: 'Tambahkan minimal satu produk dengan qty lebih dari 0.',
        status: 'warning',
        duration: 4000,
        isClosable: true
      })
      return
    }

    try {
      await createPurchase({
        supplier,
        purchaseDate: purchaseDate
          ? new Date(`${purchaseDate}T00:00:00`).toISOString()
          : new Date().toISOString(),
        note,
        items: validItems
      })
      toast({
        title: 'Pembelian tersimpan',
        description: 'Stok dan harga produk telah diperbarui.',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      router.push('/admin/purchases')
    } catch (err) {
      toast({
        title: 'Gagal menyimpan pembelian',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  return (
    <Layout isFetching={isLoadingProducts}>
      <PageHeader
        title="Tambah pembelian"
        subtitle="Satu nota bisa berisi banyak produk"
        breadcrumbs={[
          { label: 'Dasbor', path: '/admin' },
          { label: 'Pembelian', path: '/admin/purchases' },
          { label: 'Tambah' }
        ]}
        actions={
          <HStack spacing={2}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/purchases')}
            >
              Batal
            </Button>
            <Button
              colorScheme="brand"
              size="sm"
              isLoading={isSaving}
              onClick={handleSubmit}
            >
              Simpan
            </Button>
          </HStack>
        }
      />

      <VStack align="stretch" spacing={6}>
        <Card>
          <CardHeader title="Informasi nota" />
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <FormControl>
                <FormLabel>Supplier</FormLabel>
                <Input
                  placeholder="Nama supplier (opsional)"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Tanggal belanja</FormLabel>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Catatan</FormLabel>
                <Input
                  placeholder="Catatan (opsional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Produk yang dibeli"
            description="HPP beli dan harga jual diisi per produk"
          />
          <CardBody>
            <VStack align="stretch" spacing={4}>
              {items.map((item, index) => {
                const product = productMap.get(item.productId)
                const subtotal = item.qty * item.costPrice
                return (
                  <Box
                    key={index}
                    border="1px solid"
                    borderColor="border-subtle"
                    borderRadius="lg"
                    p={4}
                  >
                    <Grid
                      templateColumns={{
                        base: '1fr',
                        md: '2fr 0.8fr 1fr 1fr auto auto'
                      }}
                      gap={3}
                      alignItems="end"
                    >
                      <FormControl>
                        <FormLabel fontSize="sm">Produk</FormLabel>
                        <Select
                          placeholder="Pilih produk"
                          value={item.productId}
                          onChange={(e) =>
                            handleProductChange(index, e.target.value)
                          }
                        >
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">Qty</FormLabel>
                        <Input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) =>
                            updateItem(index, {
                              qty: Math.max(0, Number(e.target.value) || 0)
                            })
                          }
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">HPP beli</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          value={item.costPrice}
                          onChange={(e) =>
                            updateItem(index, {
                              costPrice: Math.max(
                                0,
                                Number(e.target.value) || 0
                              )
                            })
                          }
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">Harga jual</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          value={item.sellPrice}
                          onChange={(e) =>
                            updateItem(index, {
                              sellPrice: Math.max(
                                0,
                                Number(e.target.value) || 0
                              )
                            })
                          }
                        />
                      </FormControl>
                      <Box pb={1}>
                        <Text fontSize="xs" color="text-muted">
                          Subtotal
                        </Text>
                        <Text fontSize="sm" fontWeight="600">
                          {currency.toIDRFormat(subtotal)}
                        </Text>
                      </Box>
                      <IconButton
                        aria-label="Hapus baris"
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        isDisabled={items.length === 1}
                        onClick={() => removeRow(index)}
                      />
                    </Grid>
                    {product && (
                      <Text fontSize="xs" color="text-muted" mt={2}>
                        Stok saat ini: {product.stock ?? 0}
                      </Text>
                    )}
                  </Box>
                )
              })}

              <Button
                leftIcon={<AddIcon />}
                variant="outline"
                colorScheme="brand"
                size="sm"
                alignSelf="flex-start"
                onClick={addRow}
              >
                Tambah produk
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Flex
              direction={{ base: 'column', sm: 'row' }}
              justify="space-between"
              gap={4}
            >
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="text-muted">
                  Total belanja
                </Text>
                <Text fontSize="xl" fontWeight="700">
                  {currency.toIDRFormat(totals.cost)}
                </Text>
              </VStack>
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="text-muted">
                  Potensi laba
                </Text>
                <Text fontSize="xl" fontWeight="700" color="brand.700">
                  {currency.toIDRFormat(totals.margin)}
                </Text>
              </VStack>
              <Button
                colorScheme="brand"
                alignSelf={{ base: 'stretch', sm: 'center' }}
                isLoading={isSaving}
                onClick={handleSubmit}
              >
                Simpan Pembelian
              </Button>
            </Flex>
          </CardBody>
        </Card>
      </VStack>
    </Layout>
  )
}
