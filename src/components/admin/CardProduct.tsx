'use client'

import React from 'react'

import { Box, Button, ButtonGroup, HStack, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'

import ProductImage from '@/components/ProductImage'
import { Price, StatusBadge } from '@/components/ui'
import { IProductResponse } from '@/interfaces/product'
import { date } from '@/utils'

export default function CardProduct({
  product,
  editable = true,
  onDelete,
  isDeleting,
  editBasePath = '/admin/products',
  editQuery = ''
}: Props) {
  const { id, name, price, imageUrl } = product
  const isPreorder = product.availability === 'preorder'
  const approvalStatus = product.approvalStatus

  return (
    <Box
      role="group"
      display="flex"
      flexDirection="column"
      h="full"
      w="full"
      bg="surface"
      border="1px solid"
      borderColor="border-subtle"
      boxShadow="card"
      rounded="xl"
      overflow="hidden"
      transition="all 0.2s"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
    >
      <Box position="relative">
        <ProductImage
          height={160}
          width="full"
          objectFit="cover"
          src={imageUrl}
          alt={name}
        />
        <Box position="absolute" top={3} left={3}>
          <HStack spacing={1.5}>
            <StatusBadge color={isPreorder ? 'orange' : 'green'}>
              {isPreorder ? 'Pre-order' : 'Ready'}
            </StatusBadge>
            {approvalStatus && approvalStatus !== 'approved' && (
              <StatusBadge color={approvalStatus === 'rejected' ? 'red' : 'orange'}>
                {approvalStatus === 'rejected' ? 'Ditolak' : 'Menunggu'}
              </StatusBadge>
            )}
          </HStack>
        </Box>
      </Box>

      <Stack align="left" p={4} spacing={1} flex="1">
        <Text
          color="text-muted"
          fontSize="xs"
          textTransform="uppercase"
          letterSpacing="wide"
          noOfLines={1}
        >
          {product.vendor?.name || 'Tanpa vendor'}
        </Text>
        <Text
          fontSize="md"
          fontWeight="600"
          color="text-strong"
          lineHeight="1.35"
          noOfLines={2}
        >
          {name}
        </Text>
        <Price value={price} size="md" pt={1} />
        {isPreorder && product.preorderStart && product.preorderEnd && (
          <Text fontSize="xs" color="orange.600">
            {date.formatDateRange(product.preorderStart, product.preorderEnd)}
          </Text>
        )}
      </Stack>

      {(editable || onDelete) && (
        <ButtonGroup gap={2} w="full" px={4} pb={4}>
          {editable && (
            <Button
              as={Link}
              href={`${editBasePath}/${id}/edit${editQuery}`}
              size="sm"
              colorScheme="brand"
              flex="1"
            >
              Ubah
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              colorScheme="red"
              variant="outline"
              onClick={() => onDelete(product.id)}
              isLoading={isDeleting}
              flex="1"
            >
              Hapus
            </Button>
          )}
        </ButtonGroup>
      )}
    </Box>
  )
}

interface Props {
  product: IProductResponse
  editable?: boolean
  // eslint-disable-next-line no-unused-vars
  onDelete?: (productId: string) => void
  isDeleting?: boolean
  editBasePath?: string
  editQuery?: string
}
