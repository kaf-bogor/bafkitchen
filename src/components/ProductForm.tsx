/* eslint-disable no-unused-vars */
'use client'

import React, { useEffect, useState } from 'react'

import { AddIcon } from '@chakra-ui/icons'
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Image,
  Input,
  Select,
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

import { useGetCategories, useCreateCategories } from '@/app/admin/categories/actions'
import { getVendors } from '@/app/admin/vendors/actions'
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
  isPending = false
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

  // Load vendors directly from Firestore
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
      categoryIds: product.categories?.map(({ id }) => id) || []
    },
    validationSchema: toFormikValidationSchema(schema.adminProductForm),
    onSubmit: (values) => {
      if (onCreate) {
        onCreate(values)
      }
      if (onUpdate) {
        console.log({ values })
        onUpdate(values)
      }
    }
  })

  useEffect(() => {
    if (dataCategories?.length && values.vendor?.id) {
      const options: ICategoryInput[] = dataCategories
        .filter((category) => category.vendorId === values.vendor.id)
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
        title: 'Category created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      // Refetch categories to update the options
      await refetchCategories()

      // Add the new category to the selected categories
      const newOption = { label: newCategory.name, value: newCategory.id }
      setSelectedCategories((prev) => [...prev, newOption])
      setFieldValue('categoryIds', [
        ...(values.categoryIds || []),
        newCategory.id
      ])

      setIsCategoryModalOpen(false)
    } catch (error) {
      toast({
        title: 'Failed to create category',
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
        <VStack gap={3}>
          <FormControl isInvalid={!!errors.name && touched.name}>
            <FormLabel>Name</FormLabel>
            <Input
              name="name"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Product Name"
            />
            <FormErrorMessage>{errors.name}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.price && touched.price}>
            <FormLabel>Harga dasar</FormLabel>
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
            <FormLabel>Harga jual</FormLabel>
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
              placeholder="Harga Jual"
            />
            <FormErrorMessage>{errors.price}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.stock && touched.stock}>
            <FormLabel>Stock</FormLabel>
            <Input
              name="stock"
              type="number"
              value={values.stock ?? ''}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Stock"
            />
            <FormHelperText>Kosongkan jika ingin tidak ada stok</FormHelperText>
            <FormErrorMessage>{errors.stock}</FormErrorMessage>
          </FormControl>

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
              placeholder="Select Vendor"
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

          <FormControl isInvalid={!!errors.categoryIds && touched.categoryIds}>
            <HStack justify="space-between" align="end">
              <FormLabel>Categories (Optional)</FormLabel>
              {values.vendor?.id && (
                <IconButton
                  aria-label="Create new category"
                  icon={<AddIcon />}
                  size="sm"
                  colorScheme="green"
                  variant="outline"
                  onClick={() => setIsCategoryModalOpen(true)}
                />
              )}
            </HStack>
            <MultiSelect
              isMulti
              placeholder="Pilih Categories (Optional)"
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
                ? 'Select a vendor first to enable categories'
                : 'Categories are optional. Click the + button to create a new category.'}
            </FormHelperText>
            <FormErrorMessage>{errors.categoryIds}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.description && touched.description}>
            <FormLabel>Description</FormLabel>
            <Textarea
              name="description"
              value={values.description}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Product Description"
            />
            <FormErrorMessage>{errors.description}</FormErrorMessage>
          </FormControl>

          <FormControl>
            <FormLabel>Image</FormLabel>
            <Flex>
              {product.imageUrl && (
                <Image src={product.imageUrl} alt="product image" width={150} />
              )}
              <Input
                id="input-file"
                name="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setFieldValue('image', file)
                  }
                }}
              />
            </Flex>
          </FormControl>

          <FormControl mt={6}>
            <Button
              w="full"
              mr={3}
              type="submit"
              isLoading={isPending}
              isDisabled={!values.vendor?.id}
              colorScheme="blue"
            >
              Save
            </Button>
          </FormControl>
        </VStack>
      </form>

      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={(categoryData) => () => handleCreateCategory(categoryData)}
        vendors={vendors || []}
        title="Create New Category"
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
}
