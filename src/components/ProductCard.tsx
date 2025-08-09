import React from 'react'

import {
  Card,
  CardBody,
  Stack,
  Heading,
  CardFooter,
  ButtonGroup,
  Button,
  Image,
  Text
} from '@chakra-ui/react'

import { IProduct } from '@/interfaces'
import { currency } from '@/utils'

interface ProductCardProps {
  product: IProduct.IProduct
  // eslint-disable-next-line no-unused-vars
  addToCart: (product: IProduct.IProduct) => void
}

export default function ProductCard(props: ProductCardProps) {
  const product: IProduct.IProduct = props.product
  const defaultImage =
    'https://via.placeholder.com/600x400?text=No+Image'

  return (
    <Card>
      <CardBody>
        <Image
          src={product.imageUrl || defaultImage}
          width="100%"
          objectFit="cover"
          height={160}
          alt="Green double couch with wooden legs"
          borderRadius="lg"
        />
        <Stack mt="6" spacing="3">
          <Heading size="md">{product.name}</Heading>
          <Text fontSize="xs">{product.description}</Text>
        </Stack>
      </CardBody>
      <CardFooter paddingTop={0}>
        <Text color="blue.600" fontSize="xl">
          {currency.toIDRFormat(product.price)}
        </Text>
      </CardFooter>
      <CardFooter>
        <ButtonGroup spacing="2">
          <Button
            variant="solid"
            colorScheme="blue"
            onClick={() => props.addToCart(props.product)}
          >
            Tambah ke Cart
          </Button>
        </ButtonGroup>
      </CardFooter>
    </Card>
  )
}
