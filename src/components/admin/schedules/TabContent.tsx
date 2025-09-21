import React, { useState } from 'react'

import { AddIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  SimpleGrid,
  Text,
  VStack,
  useDisclosure
} from '@chakra-ui/react'
import { format } from 'date-fns'

import { useGetProducts } from '@/app/admin/products/actions'
import { deleteSchedule, postSchedules } from '@/app/admin/schedules/actions'
import { Error, Loading } from '@/components/shared'
import { ISchedule } from '@/interfaces'
import { date, useToastMessage } from '@/utils'

import ModalMenu from './ModalMenu'
import CardProduct from '../CardProduct'

export default function TabContent({ schedules, day, selectedDay }: Props) {
  const [listSchedules, setListSchedules] =
    useState<ISchedule.ISchedule[]>(schedules)
  const [selectedProductId, setSelectedProductId] = useState('')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { success: successToast, error: errorToast } = useToastMessage()

  const {
    data: products,
    loading: isProductsFetching,
    error: productsError
  } = useGetProducts()

  const { createSchedule, loading: isCreating } = postSchedules()

  const { deleteSchedule: removeSchedule, loading: isDeleting } = deleteSchedule()

  const handleDelete = async (productId: string, scheduleId: string) => {
    try {
      await removeSchedule({ productId, scheduleId })
      setListSchedules((prev) =>
        prev.map((schedule) => ({
          ...schedule,
          products: schedule.products.filter(
            (product) => product.id !== productId
          )
        }))
      )
      successToast({ message: 'Menu berhasil dihapus dari jadwal' })
    } catch (error) {
      errorToast({ message: 'Menu gagal dihapus dari jadwal' })
    }
  }

  return (
    <>
      {isProductsFetching && <Loading />}
      {productsError ? (
        <Error error={productsError} />
      ) : (
        <Box>
          <Text fontSize="xl" fontWeight="bold" mb={4}>
            Menu untuk {date.formatDate(day)}
          </Text>
          {date.getScheduleForDay(day, listSchedules).length > 0 ? (
            <SimpleGrid columns={[1, 2, 3]} gap={6}>
              {date
                .getScheduleForDay(day, listSchedules)
                .flatMap((schedule) =>
                  schedule.products.map((product) => (
                    <CardProduct
                      key={`${schedule.id}-${product.id}`}
                      product={product}
                      editable={false}
                      onDelete={() =>
                        handleDelete(product.id, schedule.id)
                      }
                      isDeleting={isDeleting}
                    />
                  ))
                )}
              <Button onClick={onOpen} h="300px" w="250px">
                <AddIcon />
              </Button>
            </SimpleGrid>
          ) : (
            <VStack align="start" gap={6}>
              <Text w="full">Tidak ada menu untuk hari ini</Text>
              <Button onClick={onOpen} h="300px" w="250px">
                <AddIcon />
                <Text color="grey.300"> Tambah menu</Text>
              </Button>
            </VStack>
          )}
        </Box>
      )}

      <ModalMenu
        isOpen={isOpen}
        date={date.formatDate(selectedDay)}
        products={products || []}
        onClose={() => {
          onClose()
          setSelectedProductId('')
        }}
        onChange={(productId) => setSelectedProductId(productId)}
        onSubmit={async () => {
          try {
            const schedule = await createSchedule({
              productId: selectedProductId,
              date: format(selectedDay, 'yyyy-MM-dd')
            })
            successToast({ message: 'Menu berhasil ditambahkan ke jadwal' })
            setListSchedules((prev) => [...prev, schedule])
            onClose()
            setSelectedProductId('')
          } catch (error) {
            errorToast({ message: 'Gagal menambahkan menu ke jadwal' })
          }
        }}
        isLoading={isCreating}
        isDisabled={!selectedProductId}
      />
    </>
  )
}

type Props = {
  day: Date
  selectedDay: Date
  schedules: ISchedule.ISchedule[]
}
