/* eslint-disable no-unused-vars */
'use client'

import React, { useEffect, useState } from 'react'

import { AddIcon } from '@chakra-ui/icons'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Radio,
  RadioGroup,
  Select,
  SimpleGrid,
  Switch,
  Textarea,
  VStack,
  FormErrorMessage,
  FormHelperText,
  HStack,
  IconButton,
  useToast
} from '@chakra-ui/react'
import { Select as MultiSelect, MultiValue } from 'chakra-react-select'
import { useFormik } from 'formik'
import { NumericFormat, NumberFormatValues } from 'react-number-format'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { useGetCategories, useCreateCategories } from '@/app/admin/(panel)/categories/actions'
import { getVendors } from '@/app/admin/(panel)/vendors/actions'
import ProductImage from '@/components/ProductImage'
import { Card, CardBody, CardHeader, LabelWithTooltip } from '@/components/ui'
import {
  IEditProductRequest,
  IProductResponse,
  ICategoryInput,
  ICreateProductRequest
} from '@/interfaces/product'
import { IVendor } from '@/interfaces/vendor'
import { schema } from '@/utils'

import CategoryFormModal from './CategoryModal'

export default function ProductForm({
  onCreate,
  onUpdate,
  product,
  isPending = false,
  lockedVendor
}: Props) {
  const [categoryOptions, setCategoryOptions] = useState<ICategoryInput[]>([])
  const [selectedCategories, setSelectedCategories] = useState<
    ICategoryInput[]
  >(
    product.categories?.map(({ name, id }) => ({ label: name, value: id })) ||
      []
  )
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [vendors, setVendors] = useState<IVendor[]>([])

  const toast = useToast()
  const { createCategory } = useCreateCategories()

  const { data: dataCategories, refetch: refetchCategories } = useGetCategories()

  // Load vendors for the vendor select
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const list = await getVendors()
        if (mounted) setVendors(list)
      } catch (e) {
        console.error('Failed to load vendors', e)
        if (mounted) setVendors([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue
  } = useFormik({
    initialValues: {
      ...product,
      vendor: lockedVendor ?? product.vendor,
      categoryIds: product.categories?.map(({ id }) => id) || []
    },
    validationSchema: toFormikValidationSchema(schema.adminProductForm),
    onSubmit: (values) => {
      if (onCreate) {
        onCreate(values)
      }
      if (onUpdate) {
        onUpdate(values)
      }
    }
  })

  useEffect(() => {
    if (dataCategories?.length && values.vendor?.id) {
      const options: ICategoryInput[] = dataCategories
        .filter(
          (category) =>
            !category.vendorId || category.vendorId === values.vendor.id
        )
        .map((category) => ({ label: category.name, value: category.id }))
      setCategoryOptions(options)
    }
  }, [dataCategories, values])

  const handleCreateCategory = async (categoryData: any) => {
    try {
      const newCategory = await createCategory({
        name: categoryData.name,
        vendorId: categoryData.vendorId
      })

      toast({
        title: 'Kategori berhasil dibuat',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      await refetchCategories()

      const newOption = { label: newCategory.name, value: newCategory.id }
      setSelectedCategories((prev) => [...prev, newOption])
      setFieldValue('categoryIds', [
        ...(values.categoryIds || []),
        newCategory.id
      ])

      setIsCategoryModalOpen(false)
    } catch (error) {
      toast({
        title: 'Gagal membuat kategori',
        description: (error as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Flex direction={{ base: 'column', lg: 'row' }} gap={5} align="start">
          {/* Main column */}
          <VStack flex="2" gap={5} align="stretch" w="full" minW={0}>
            <Card>
              <CardHeader title="Informasi dasar" />
              <CardBody>
                <VStack gap={4} align="stretch">
                  <FormControl isInvalid={!!errors.name && touched.name}>
                    <FormLabel>Nama produk</FormLabel>
                    <Input
                      name="name"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="cth., Nasi Box Ayam"
                    />
                    <FormErrorMessage>{errors.name}</FormErrorMessage>
                  </FormControl>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <FormControl>
                      <LabelWithTooltip
                        label="SKU"
                        tooltip="Kode unik produk untuk membedakan dari produk lain. Boleh dikosongkan."
                      />
                      <Input
                        name="sku"
                        value={(values as any).sku || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="cth., CAT-NAB-001"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Satuan</FormLabel>
                      <Select
                        name="unit"
                        value={(values as any).unit || 'pcs'}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      >
                        <option value="pcs">pcs</option>
                        <option value="box">box</option>
                        <option value="pack">pack</option>
                        <option value="kg">kg</option>
                        <option value="gr">gr</option>
                        <option value="liter">liter</option>
                        <option value="ml">ml</option>
                        <option value="botol">botol</option>
                        <option value="paket">paket</option>
                        <option value="porsi">porsi</option>
                        <option value="cup">cup</option>
                        <option value="buah">buah</option>
                        <option value="toples">toples</option>
                        <option value="sachet">sachet</option>
                        <option value="pouch">pouch</option>
                        <option value="karung">karung</option>
                        <option value="lembar">lembar</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>

                  {!lockedVendor && (
                    <FormControl isInvalid={!!errors.vendor && !!touched.vendor}>
                      <FormLabel>Vendor</FormLabel>
                      <Select
                        name="vendor"
                        value={values.vendor?.id || ''}
                        onChange={(e) => {
                          const selectedVendor = vendors?.find(
                            (v: IVendor) => v.id === e.target.value
                          )
                          setFieldValue(
                            'vendor',
                            selectedVendor || {
                              id: '',
                              name: '',
                              email: '',
                              isActive: false,
                              createdAt: '',
                              updatedAt: ''
                            }
                          )
                        }}
                        onBlur={handleBlur}
                        placeholder="Pilih vendor"
                      >
                        {!!vendors?.length &&
                          vendors.map((vendor: IVendor) => (
                            <option key={vendor.id} value={vendor.id}>
                              {vendor.name}
                            </option>
                          ))}
                      </Select>
                      <FormErrorMessage>
                        {errors.vendor?.id || errors.vendor?.name}
                      </FormErrorMessage>
                    </FormControl>
                  )}

                  <FormControl isInvalid={!!errors.categoryIds && touched.categoryIds}>
                    <HStack justify="space-between" align="end">
                      <FormLabel>Kategori (opsional)</FormLabel>
                      {values.vendor?.id && (
                        <IconButton
                          aria-label="Buat kategori baru"
                          icon={<AddIcon />}
                          size="sm"
                          colorScheme="brand"
                          variant="outline"
                          onClick={() => setIsCategoryModalOpen(true)}
                        />
                      )}
                    </HStack>
                    <MultiSelect
                      isMulti
                      placeholder="Pilih kategori (opsional)"
                      value={selectedCategories}
                      options={categoryOptions}
                      onChange={(newValue: MultiValue<ICategoryInput>) => {
                        setSelectedCategories(newValue as ICategoryInput[])
                        setFieldValue(
                          'categoryIds',
                          newValue.map((item) => item.value)
                        )
                      }}
                      isDisabled={!values.vendor?.id}
                    />
                    <FormHelperText>
                      {!values.vendor?.id
                        ? 'Pilih vendor terlebih dahulu untuk mengaktifkan kategori.'
                        : 'Kategori bersifat opsional. Klik + untuk membuat kategori baru.'}
                    </FormHelperText>
                    <FormErrorMessage>{errors.categoryIds}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.description && touched.description}>
                    <FormLabel>Deskripsi</FormLabel>
                    <Textarea
                      name="description"
                      value={values.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Deskripsi produk"
                      rows={3}
                    />
                    <FormErrorMessage>{errors.description}</FormErrorMessage>
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Harga & stok" />
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                  <FormControl isInvalid={!!errors.price && touched.price}>
                    <LabelWithTooltip
                      label="Harga dasar"
                      tooltip="Harga modal sebelum keuntungan. Dipakai untuk menghitung margin."
                    />
                    <Input
                      name="price"
                      as={NumericFormat}
                      value={values.priceBase}
                      onValueChange={(values: NumberFormatValues) => {
                        setFieldValue('priceBase', parseFloat(values.value))
                      }}
                      onBlur={handleBlur}
                      prefix="Rp."
                      thousandSeparator="."
                      decimalSeparator=","
                      placeholder="Harga dasar"
                    />
                    <FormErrorMessage>{errors.price}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.price && touched.price}>
                    <LabelWithTooltip
                      label="Harga jual"
                      tooltip="Harga yang dibayar pembeli."
                    />
                    <Input
                      name="price"
                      as={NumericFormat}
                      value={values.price}
                      onValueChange={(values: NumberFormatValues) => {
                        setFieldValue('price', parseFloat(values.value))
                      }}
                      onBlur={handleBlur}
                      prefix="Rp."
                      thousandSeparator="."
                      decimalSeparator=","
                      placeholder="Harga jual"
                    />
                    <FormErrorMessage>{errors.price}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.stock && touched.stock}>
                    <FormLabel>Stok</FormLabel>
                    <Input
                      name="stock"
                      type="number"
                      value={values.stock ?? ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Stok"
                    />
                    <FormHelperText>
                      Kosongkan jika tidak ada stok.
                    </FormHelperText>
                    <FormErrorMessage>{errors.stock}</FormErrorMessage>
                  </FormControl>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Advanced settings (progressive disclosure) */}
            <Accordion allowToggle defaultIndex={[]}>
              <AccordionItem
                border="1px solid"
                borderColor="border-subtle"
                borderRadius="xl"
                bg="surface"
                overflow="hidden"
              >
                <AccordionButton _expanded={{ bg: 'gray.50' }} py={4}>
                  <Box flex="1" textAlign="left" fontWeight="600" color="text-strong">
                    Channel, ketersediaan & pre-order
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={5} pt={2}>
                  <VStack gap={5} align="stretch">
                    {/* Availability status */}
                    <FormControl>
                      <LabelWithTooltip
                        label="Status ketersediaan"
                        tooltip="Ready = bisa dibeli langsung. Pre-order = dipesan dulu, baru diambil/dikirim pada tanggal tertentu."
                      />
                      <RadioGroup
                        name="availability"
                        value={values.availability || 'ready'}
                        onChange={(value) => setFieldValue('availability', value)}
                      >
                        <HStack spacing={6}>
                          <Radio value="ready">Ready</Radio>
                          <Radio value="preorder">Pre-order</Radio>
                        </HStack>
                      </RadioGroup>
                      <FormHelperText>
                        {values.availability === 'preorder'
                          ? 'Produk hanya tersedia untuk pre-order dalam rentang tanggal di bawah.'
                          : 'Produk langsung tersedia untuk dijual.'}
                      </FormHelperText>
                    </FormControl>

                    {values.availability === 'preorder' && (
                      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                        <FormControl>
                          <FormLabel>Tanggal mulai pre-order</FormLabel>
                          <Input
                            name="preorderStart"
                            type="date"
                            value={values.preorderStart?.slice(0, 10) || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Tanggal berakhir pre-order</FormLabel>
                          <Input
                            name="preorderEnd"
                            type="date"
                            value={values.preorderEnd?.slice(0, 10) || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                        </FormControl>
                      </SimpleGrid>
                    )}

                    <Divider />

                    {/* Sales channel */}
                    <Box>
                      <LabelWithTooltip
                        label="Channel penjualan"
                        tooltip="Tempat produk ini dijual: di kasir (POS), untuk pre-order, atau keduanya."
                      />
                      <VStack align="start" spacing={2}>
                        <Checkbox
                          isChecked={((values as any).channels || []).includes('pos')}
                          onChange={(e) => {
                            const cur = (values as any).channels || []
                            setFieldValue(
                              'channels',
                              e.target.checked
                                ? [...cur, 'pos']
                                : cur.filter((c: string) => c !== 'pos')
                            )
                          }}
                        >
                          Dijual di POS
                        </Checkbox>
                        <Checkbox
                          isChecked={((values as any).channels || []).includes('preorder')}
                          onChange={(e) => {
                            const cur = (values as any).channels || []
                            setFieldValue(
                              'channels',
                              e.target.checked
                                ? [...cur, 'preorder']
                                : cur.filter((c: string) => c !== 'preorder')
                            )
                          }}
                        >
                          Tersedia untuk pre-order
                        </Checkbox>
                      </VStack>
                    </Box>

                    {/* Fulfillment */}
                    <FormControl>
                      <LabelWithTooltip
                        label="Tipe pemenuhan"
                        tooltip="Cara produk diserahkan: ambil di tempat, diantar, atau catering."
                      />
                      <Select
                        name="fulfillmentType"
                        value={(values as any).fulfillmentType || 'takeaway'}
                        onChange={handleChange}
                      >
                        <option value="takeaway">Ambil di tempat</option>
                        <option value="delivery">Diantar</option>
                        <option value="catering">Catering</option>
                      </Select>
                    </FormControl>

                    <Divider />

                    {/* Availability */}
                    <FormControl>
                      <LabelWithTooltip
                        label="Ketersediaan produk"
                        tooltip="Kapan produk tersedia: setiap hari, hanya hari tertentu, atau tanggal tertentu."
                      />
                      <RadioGroup
                        name="availabilityType"
                        value={(values as any).availabilityType || 'always'}
                        onChange={(value) => setFieldValue('availabilityType', value)}
                      >
                        <HStack spacing={6} flexWrap="wrap">
                          <Radio value="always">Selalu tersedia</Radio>
                          <Radio value="weekly">Jadwal mingguan</Radio>
                          <Radio value="specific">Tanggal tertentu</Radio>
                        </HStack>
                      </RadioGroup>
                    </FormControl>

                    {(values as any).availabilityType === 'weekly' && (
                      <FormControl>
                        <FormLabel>Hari tersedia</FormLabel>
                        <HStack flexWrap="wrap" gap={2}>
                          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(
                            (label, idx) => {
                              const cur = (values as any).weeklyDays || []
                              const checked = cur.includes(idx)
                              return (
                                <Checkbox
                                  key={idx}
                                  isChecked={checked}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...cur, idx]
                                      : cur.filter((d: number) => d !== idx)
                                    setFieldValue('weeklyDays', next.sort())
                                  }}
                                >
                                  {label}
                                </Checkbox>
                              )
                            }
                          )}
                        </HStack>
                      </FormControl>
                    )}

                    {(values as any).availabilityType === 'specific' && (
                      <FormControl>
                        <FormLabel>Tanggal tertentu</FormLabel>
                        <Input
                          type="date"
                          value={(values as any).specificDateInput || ''}
                          onChange={(e) =>
                            setFieldValue('specificDateInput', e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const val = (values as any).specificDateInput
                              if (val) {
                                setFieldValue('specificDates', [
                                  ...((values as any).specificDates || []),
                                  val
                                ])
                                setFieldValue('specificDateInput', '')
                              }
                            }
                          }}
                          placeholder="Pilih tanggal lalu tekan Enter"
                        />
                        <HStack flexWrap="wrap" mt={2}>
                          {((values as any).specificDates || []).map(
                            (d: string) => (
                              <Button
                                key={d}
                                size="xs"
                                variant="outline"
                                onClick={() =>
                                  setFieldValue(
                                    'specificDates',
                                    ((values as any).specificDates || []).filter(
                                      (x: string) => x !== d
                                    )
                                  )
                                }
                              >
                                {d} ✕
                              </Button>
                            )
                          )}
                        </HStack>
                      </FormControl>
                    )}

                    <Divider />

                    {/* Pre-order rules */}
                    <FormControl>
                      <FormLabel>Pengaturan pre-order</FormLabel>
                      <FormHelperText mb={3}>
                        Berlaku jika produk tersedia untuk pre-order.
                      </FormHelperText>
                      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                        <FormControl>
                          <LabelWithTooltip
                            label="Lead time minimal (H-)"
                            tooltip="Berapa hari sebelumnya pelanggan harus memesan. Contoh: 2 berarti minimal 2 hari sebelum tanggal pengambilan."
                            fontSize="sm"
                          />
                          <Input
                            name="preorderLeadDays"
                            type="number"
                            value={(values as any).preorderLeadDays ?? ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="cth., 2"
                          />
                        </FormControl>
                        <FormControl>
                          <LabelWithTooltip
                            label="Batas pemesanan"
                            tooltip="Jam terakhir pelanggan bisa memesan untuk hari tersebut. Contoh: 14:00."
                            fontSize="sm"
                          />
                          <Input
                            name="preorderCutoffTime"
                            type="time"
                            value={(values as any).preorderCutoffTime || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                        </FormControl>
                        <FormControl>
                          <LabelWithTooltip
                            label="Min. pesanan"
                            tooltip="Jumlah paling sedikit yang harus dipesan pelanggan."
                            fontSize="sm"
                          />
                          <Input
                            name="preorderMinQty"
                            type="number"
                            value={(values as any).preorderMinQty ?? ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="cth., 10"
                          />
                        </FormControl>
                        <FormControl>
                          <LabelWithTooltip
                            label="Maks. pesanan"
                            tooltip="Jumlah paling banyak yang boleh dipesan dalam satu pesanan."
                            fontSize="sm"
                          />
                          <Input
                            name="preorderMaxQty"
                            type="number"
                            value={(values as any).preorderMaxQty ?? ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="cth., 100"
                          />
                        </FormControl>
                        <FormControl>
                          <LabelWithTooltip
                            label="Kapasitas per hari"
                            tooltip="Total maksimal pesanan yang bisa dibuat dalam satu hari."
                            fontSize="sm"
                          />
                          <Input
                            name="preorderCapacity"
                            type="number"
                            value={(values as any).preorderCapacity ?? ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="cth., 200"
                          />
                        </FormControl>
                      </SimpleGrid>
                    </FormControl>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </VStack>

          {/* Side column */}
          <VStack
            flex="1"
            gap={5}
            align="stretch"
            w="full"
            minW={0}
            position={{ lg: 'sticky' }}
            top="24px"
          >
            <Card>
              <CardHeader title="Foto produk" />
              <CardBody>
                <Flex gap={4} align="center">
                  {product.imageUrl && (
                    <ProductImage
                      src={product.imageUrl}
                      alt="Foto produk"
                      boxSize="72px"
                      objectFit="cover"
                      borderRadius="lg"
                      flexShrink={0}
                    />
                  )}
                  <Input
                    id="input-file"
                    name="image"
                    type="file"
                    accept="image/*"
                    p={1}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setFieldValue('image', file)
                      }
                    }}
                  />
                </Flex>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Status" />
              <CardBody>
                <FormControl
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={4}
                >
                  <Box>
                    <FormLabel mb={0}>Produk aktif</FormLabel>
                    <FormHelperText mt={1}>
                      Produk tampil dan bisa dijual.
                    </FormHelperText>
                  </Box>
                  <Switch
                    name="isActive"
                    colorScheme="brand"
                    isChecked={(values as any).isActive !== false}
                    onChange={(e) => setFieldValue('isActive', e.target.checked)}
                  />
                </FormControl>
              </CardBody>
            </Card>

            <Button
              type="submit"
              size="lg"
              w="full"
              colorScheme="brand"
              isLoading={isPending}
              isDisabled={!values.vendor?.id}
            >
              Simpan
            </Button>
          </VStack>
        </Flex>
      </form>

      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={(categoryData) => () => handleCreateCategory(categoryData)}
        vendors={vendors || []}
        title="Buat kategori baru"
        data={{ name: '', id: '', vendorId: values.vendor?.id || '' }}
      />
    </>
  )
}

export interface Props {
  onCreate?: (values: ICreateProductRequest) => void
  onUpdate?: (values: IEditProductRequest) => void
  product: IProductResponse
  title: string
  isPending: boolean
  lockedVendor?: { id: string; name: string }
}
