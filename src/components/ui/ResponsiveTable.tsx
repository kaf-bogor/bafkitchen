'use client'

import React from 'react'

import {
  Box,
  Flex,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useBreakpointValue,
  VStack
} from '@chakra-ui/react'

import Card, { CardBody } from './Card'

export interface ResponsiveColumn<T> {
  key: string
  header: React.ReactNode
  render: (row: T) => React.ReactNode
  align?: 'left' | 'right'
  isNumeric?: boolean
  hideOnMobile?: boolean
  mobileLabel?: string
}

interface Props<T> {
  columns: ResponsiveColumn<T>[]
  rows: T[]
  // eslint-disable-next-line no-unused-vars
  getRowKey: (row: T) => string
  mobileTitleKey: string
  mobileSubtitleKey?: string
  // eslint-disable-next-line no-unused-vars
  actions?: (row: T) => React.ReactNode
  emptyState?: React.ReactNode
}

export default function ResponsiveTable<T>({
  columns,
  rows,
  getRowKey,
  mobileTitleKey,
  mobileSubtitleKey,
  actions,
  emptyState
}: Props<T>) {
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false

  if (!rows.length) {
    return <>{emptyState ?? null}</>
  }

  if (isMobile) {
    const titleCol = columns.find((c) => c.key === mobileTitleKey)
    const subtitleCol = columns.find((c) => c.key === mobileSubtitleKey)
    const detailCols = columns.filter(
      (c) =>
        c.key !== mobileTitleKey &&
        c.key !== mobileSubtitleKey &&
        !c.hideOnMobile
    )

    return (
      <VStack align="stretch" spacing={3} p={3}>
        {rows.map((row) => (
          <Card key={getRowKey(row)}>
            <CardBody p={4}>
              <Flex justify="space-between" align="start" gap={3}>
                <Box minW={0}>
                  <Box
                    fontWeight="600"
                    color="text-strong"
                    fontSize="sm"
                    lineHeight="1.35"
                  >
                    {titleCol?.render(row)}
                  </Box>
                  {subtitleCol && (
                    <Box fontSize="xs" color="text-muted" mt={0.5}>
                      {subtitleCol.render(row)}
                    </Box>
                  )}
                </Box>
                {actions && <Box flexShrink={0}>{actions(row)}</Box>}
              </Flex>

              {detailCols.length > 0 && (
                <VStack
                  align="stretch"
                  spacing={2}
                  mt={3}
                  pt={3}
                  borderTop="1px solid"
                  borderColor="border-subtle"
                >
                  {detailCols.map((col) => (
                    <Flex
                      justify="space-between"
                      align="start"
                      gap={3}
                      key={col.key}
                    >
                      <Text fontSize="xs" color="text-muted" flexShrink={0}>
                        {col.mobileLabel ??
                          (typeof col.header === 'string'
                            ? col.header
                            : col.key)}
                      </Text>
                      <Box
                        fontSize="sm"
                        color="text-body"
                        textAlign="right"
                        minW={0}
                      >
                        {col.render(row)}
                      </Box>
                    </Flex>
                  ))}
                </VStack>
              )}
            </CardBody>
          </Card>
        ))}
      </VStack>
    )
  }

  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            {columns.map((col) => (
              <Th key={col.key} isNumeric={col.isNumeric} textAlign={col.align}>
                {col.header}
              </Th>
            ))}
            {actions && <Th textAlign="right">Aksi</Th>}
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row) => (
            <Tr key={getRowKey(row)} _hover={{ bg: 'gray.50' }}>
              {columns.map((col) => (
                <Td key={col.key} isNumeric={col.isNumeric} textAlign={col.align}>
                  {col.render(row)}
                </Td>
              ))}
              {actions && <Td textAlign="right">{actions(row)}</Td>}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}
