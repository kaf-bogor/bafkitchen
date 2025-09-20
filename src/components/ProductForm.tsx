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

import { getCategories, createCategories } from '@/app/admin/categories/actions'
import { getStores } from '@/app/admin/stores/actions'
import {
  IEditProductRequest,
  IProductResponse,
  ICategoryInput,
  ICreateProductRequest
} from '@/interfaces/product'
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
  >(product.categories?.map(({ name, id }) => ({ label: name, value: id })) || [])
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  
  const toast = useToast()
  const createCategoryMutation = createCategories()

  const { data: dataCategories, refetch: refetchCategories } = getCategories()
  const { data: stores } = getStores()

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
    if (dataCategories?.length && values.storeId) {
      const options: ICategoryInput[] = dataCategories
        .filter((category) => category.storeId === values.storeId)
        .map((category) => ({ label: category.name, value: category.id }))
      setCategoryOptions(options)
    }
  }, [dataCategories, values])

  const handleCreateCategory = async (categoryData: any) => {
    return async () => {
      try {
        const newCategory = await createCategoryMutation.mutateAsync({
          name: categoryData.name,
          storeId: categoryData.storeId
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
        setSelectedCategories(prev => [...prev, newOption])
        setFieldValue('categoryIds', [...(values.categoryIds || []), newCategory.id])
        
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

        <FormControl isInvalid={!!errors.storeId && touched.storeId}>
          <FormLabel>Vendor</FormLabel>
          <Select
            name="storeId"
            value={values.storeId}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Select Store"
          >
            {!!stores?.length &&
              stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
          </Select>
          <FormErrorMessage>{errors.storeId}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.categoryIds && touched.categoryIds}>
          <HStack justify="space-between" align="end">
            <FormLabel>Categories (Optional)</FormLabel>
            {values.storeId && (
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
            isDisabled={!values.storeId}
          />
          <FormHelperText>
            {!values.storeId 
              ? "Select a vendor first to enable categories"
              : "Categories are optional. Click the + button to create a new category."
            }
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
            isDisabled={!values.storeId}
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
        onSubmit={handleCreateCategory}
        stores={stores || []}
        title="Create New Category"
        data={{ name: '', id: '', storeId: values.storeId }}
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
