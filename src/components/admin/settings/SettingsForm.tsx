import React from 'react'

import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  VStack
} from '@chakra-ui/react'

import {
  ISettings,
  ICreateSettingsRequest,
  IUpdateSettingsRequest
} from '@/interfaces/settings'

interface Props {
  settings?: ISettings | null
  // eslint-disable-next-line no-unused-vars
  onSubmit: (data: ICreateSettingsRequest | IUpdateSettingsRequest) => void
  // eslint-disable-next-line no-unused-vars
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  isLoading?: boolean
  formData: {
    admin_phone_number: string
    app_name: string
    app_domain: string
  }
  errors?: {
    admin_phone_number?: string
    app_name?: string
    app_domain?: string
  }
}

const SettingsForm: React.FC<Props> = ({
  settings,
  onSubmit,
  onChange,
  isLoading = false,
  formData,
  errors = {}
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (settings) {
      // Update existing settings
      onSubmit({
        id: settings.id,
        ...formData
      } as IUpdateSettingsRequest)
    } else {
      // Create new settings
      onSubmit(formData as ICreateSettingsRequest)
    }
  }

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl isInvalid={!!errors.admin_phone_number}>
          <FormLabel>Admin Phone Number</FormLabel>
          <Input
            name="admin_phone_number"
            value={formData.admin_phone_number}
            onChange={onChange}
            placeholder="e.g., 6281234567890"
            type="tel"
          />
          <FormErrorMessage>{errors.admin_phone_number}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.app_name}>
          <FormLabel>App Name</FormLabel>
          <Input
            name="app_name"
            value={formData.app_name}
            onChange={onChange}
            placeholder="e.g., BAF Kitchen"
          />
          <FormErrorMessage>{errors.app_name}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.app_domain}>
          <FormLabel>App Domain</FormLabel>
          <Input
            name="app_domain"
            value={formData.app_domain}
            onChange={onChange}
            placeholder="e.g., https://bafkitchen.bilistiwabogor.com"
            type="url"
          />
          <FormErrorMessage>{errors.app_domain}</FormErrorMessage>
        </FormControl>

        <Button
          w="200px"
          type="submit"
          colorScheme="blue"
          isLoading={isLoading}
          loadingText={settings ? 'Updating...' : 'Creating...'}
        >
          {settings ? 'Update Settings' : 'Create Settings'}
        </Button>
      </VStack>
    </Box>
  )
}

export default SettingsForm
