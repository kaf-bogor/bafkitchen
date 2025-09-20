import React, { useState } from 'react'

import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Text
} from '@chakra-ui/react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { MdOutlineShoppingCart } from 'react-icons/md'

import { useStore } from '@/app/s/[storeName]/useStore'
import { cartStore } from '@/stores/useCart'
import { params } from '@/utils'

interface NavbarProps {
  storeName: string
  home?: boolean
}

export function Navbar(props: NavbarProps) {
  const cart = useStore(cartStore, (state) => state, 'bafkitchen')
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const quantity = cart.getTotalQuantity && cart.getTotalQuantity()
  const [searchInput, setSearchInput] = useState(
    searchParams.get('search') || ''
  )
  const handleSearch = () => {
    const query = params.createQueryString(searchParams, {
      key: 'search',
      value: searchInput
    })

    router.push(`${pathname}${query}`)
  }

  return (
    <Flex bg="gray.700" justifyContent={'space-between'}>
      <Box margin={3}>
        <Link href={`/s/${props.storeName}`}>
          <Text fontSize="2xl" fontWeight="bold" color={'white'}>
            {props.storeName}
          </Text>
        </Link>
      </Box>
      {props.home && (
        <Box m={3} width={'lg'}>
          <FormControl>
            <InputGroup size="lg">
              <Input
                placeholder="Search Product"
                bg={'gray.550'}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <InputRightElement width="6.5rem" marginRight={2}>
                <Button
                  h="2.00rem"
                  onClick={handleSearch}
                  bg={'gray.700'}
                  color={'white'}
                >
                  Search
                </Button>
              </InputRightElement>
            </InputGroup>
          </FormControl>
        </Box>
      )}
      <Box margin={3} marginRight={6}>
        <IconButton
          aria-label="cart"
          onClick={() => router.push(`${props.storeName}/cart`)}
          variant={'outline'}
          icon={
            <Box>
              <Icon
                fontSize={'2xl'}
                color={'white'}
                as={MdOutlineShoppingCart}
              />
              {quantity > 0 && (
                <Badge
                  colorScheme="red"
                  borderRadius="full"
                  variant="solid"
                  position="absolute"
                  top={-1}
                  right={-1}
                >
                  {quantity}
                </Badge>
              )}
            </Box>
          }
        />
      </Box>
    </Flex>
  )
}
