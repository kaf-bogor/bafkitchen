'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { Search2Icon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Text,
  useDisclosure,
  VStack
} from '@chakra-ui/react'
import {
  AiOutlineAppstore,
  AiOutlineShop,
  AiOutlineTeam,
  AiOutlineUser
} from 'react-icons/ai'
import { FiList } from 'react-icons/fi'

import { Layout } from '@/components/homepage'
import { Card, CardBody, GuideMedia } from '@/components/ui'
import {
  GUIDE_ROLES,
  GUIDE_SECTIONS,
  type GuideRoleId
} from '@/constants/guide'

const ROLE_ICONS: Record<string, React.ElementType> = {
  admin: AiOutlineTeam,
  vendor: AiOutlineShop,
  pelanggan: AiOutlineUser
}

const ROLE_TABS: { id: 'all' | GuideRoleId; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'admin', label: 'Admin' },
  { id: 'vendor', label: 'Vendor' },
  { id: 'pelanggan', label: 'Pelanggan' }
]

export default function GuidePage() {
  const [role, setRole] = useState<'all' | GuideRoleId>('all')
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState('')
  const toc = useDisclosure()

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase()
    return GUIDE_SECTIONS.filter((section) => {
      if (role !== 'all' && section.role !== role && section.role !== 'umum') {
        return false
      }
      if (!q) return true
      const haystack = [
        section.title,
        section.description || '',
        ...(section.steps || [])
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [role, query])

  // Keep the active id valid when the visible sections change.
  useEffect(() => {
    if (!sections.length) {
      setActiveId('')
      return
    }
    if (!sections.some((section) => section.id === activeId)) {
      setActiveId(sections[0].id)
    }
  }, [sections, activeId])

  // Scroll-spy: highlight the TOC entry for the section currently in view.
  useEffect(() => {
    let raf = 0

    const compute = () => {
      raf = 0
      let current = sections[0]?.id || ''
      for (const section of sections) {
        const el = document.getElementById(section.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= 120) current = section.id
      }
      setActiveId(current)
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute)
    }

    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [sections])

  const TOC = (
    <VStack align="stretch" spacing={1}>
      {sections.map((section) => {
        const active = section.id === activeId
        return (
          <Box
            key={section.id}
            as="a"
            href={`#${section.id}`}
            onClick={() => {
              setActiveId(section.id)
              toc.onClose()
            }}
            px={3}
            py={2}
            borderRadius="lg"
            fontSize="sm"
            fontWeight={active ? '600' : '400'}
            color={active ? 'brand.700' : 'text-body'}
            bg={active ? 'brand.50' : 'transparent'}
            borderLeft="3px solid"
            borderColor={active ? 'brand.500' : 'transparent'}
            _hover={{
              bg: active ? 'brand.50' : 'gray.100',
              color: active ? 'brand.700' : 'text-strong'
            }}
            transition="background 0.15s, color 0.15s, border-color 0.15s"
          >
            {section.title}
          </Box>
        )
      })}
    </VStack>
  )

  return (
    <Layout title="Panduan penggunaan Bazaf">
      <Box maxW="1100px" mx="auto">
        <Text color="gray.600" mb={8} maxW="3xl">
          Panduan langkah demi langkah untuk tim baru: mengenal setiap peran,
          fitur admin, fitur vendor, dan alur belanja pelanggan.
        </Text>

        {/* Roles */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mb={10}>
          {GUIDE_ROLES.map((r) => (
            <Card key={r.id}>
              <CardBody>
                <HStack spacing={3} mb={2}>
                  <Flex
                    w="9"
                    h="9"
                    borderRadius="lg"
                    bg="brand.50"
                    color="brand.600"
                    align="center"
                    justify="center"
                  >
                    <Icon as={ROLE_ICONS[r.id] || AiOutlineAppstore} boxSize={5} />
                  </Flex>
                  <Heading size="sm">{r.name}</Heading>
                </HStack>
                <Text fontSize="sm" color="gray.600" lineHeight="1.6">
                  {r.description}
                </Text>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        {/* Filters */}
        <Flex
          gap={3}
          mb={6}
          align="center"
          direction={{ base: 'column', md: 'row' }}
        >
          <HStack spacing={2} flexWrap="wrap" flex="1">
            {ROLE_TABS.map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={role === tab.id ? 'solid' : 'outline'}
                colorScheme={role === tab.id ? 'brand' : 'gray'}
                onClick={() => setRole(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </HStack>
          <InputGroup maxW={{ base: 'full', md: '280px' }} size="sm">
            <InputLeftElement pointerEvents="none">
              <Search2Icon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Cari fitur..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>
          <Button
            display={{ base: 'inline-flex', lg: 'none' }}
            size="sm"
            variant="outline"
            leftIcon={<FiList />}
            onClick={toc.onOpen}
          >
            Daftar isi
          </Button>
        </Flex>

        <Flex gap={8} align="start">
          {/* TOC desktop */}
          <Box
            display={{ base: 'none', lg: 'block' }}
            position="sticky"
            top="88px"
            w="240px"
            flexShrink={0}
            maxH="calc(100vh - 120px)"
            overflowY="auto"
          >
            <Text
              fontSize="xs"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="wider"
              color="gray.400"
              px={3}
              mb={2}
            >
              Daftar isi
            </Text>
            {TOC}
          </Box>

          {/* Content */}
          <VStack align="stretch" spacing={6} flex="1" minW={0}>
            {sections.length === 0 && (
              <Card>
                <CardBody>
                  <Text color="gray.500" textAlign="center" py={8}>
                    Tidak ada panduan yang cocok.
                  </Text>
                </CardBody>
              </Card>
            )}

            {sections.map((section) => (
              <Card
                key={section.id}
                id={section.id}
                scrollMarginTop="88px"
              >
                <CardBody>
                  <Heading size="md" mb={2}>
                    {section.title}
                  </Heading>
                  {section.description && (
                    <Text fontSize="sm" color="gray.600" lineHeight="1.7" mb={4}>
                      {section.description}
                    </Text>
                  )}

                  {!!section.steps?.length && (
                    <VStack align="stretch" spacing={2} mb={4}>
                      {section.steps.map((step, i) => (
                        <HStack align="start" spacing={3} key={i}>
                          <Flex
                            w="6"
                            h="6"
                            borderRadius="full"
                            bg="brand.600"
                            color="white"
                            fontSize="xs"
                            fontWeight="700"
                            align="center"
                            justify="center"
                            flexShrink={0}
                            mt={0.5}
                          >
                            {i + 1}
                          </Flex>
                          <Text fontSize="sm" color="text-body" lineHeight="1.6">
                            {step}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  )}

                  {!!section.media?.length && (
                    <SimpleGrid
                      columns={{ base: 1, md: section.media.length > 1 ? 2 : 1 }}
                      spacing={4}
                      mt={2}
                    >
                      {section.media.map((media, i) => (
                        <GuideMedia key={i} media={media} />
                      ))}
                    </SimpleGrid>
                  )}
                </CardBody>
              </Card>
            ))}
          </VStack>
        </Flex>
      </Box>

      <Drawer isOpen={toc.isOpen} onClose={toc.onClose} placement="left">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px" borderColor="border-subtle">
            Daftar isi
          </DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody py={4}>{TOC}</DrawerBody>
        </DrawerContent>
      </Drawer>
    </Layout>
  )
}
