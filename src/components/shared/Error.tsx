import React from 'react'

import { Alert, AlertIcon } from '@chakra-ui/react'

export default function Error({ error }: { error: Error }) {
  return (
    <Alert
      status="error"
      mb={4}
      borderRadius="xl"
      bg="red.50"
      color="red.700"
      border="1px solid"
      borderColor="red.100"
    >
      <AlertIcon />
      {error.message}
    </Alert>
  )
}
