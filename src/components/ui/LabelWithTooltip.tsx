'use client'

import React from 'react'

import { QuestionOutlineIcon } from '@chakra-ui/icons'
import {
  FormLabel,
  HStack,
  Icon,
  Tooltip,
  type FormLabelProps
} from '@chakra-ui/react'

export default function LabelWithTooltip({ label, tooltip, ...rest }: Props) {
  return (
    <HStack spacing={1.5} align="center">
      <FormLabel mb={0} {...rest}>
        {label}
      </FormLabel>
      <Tooltip label={tooltip} hasArrow placement="top" openDelay={150}>
        <Icon
          as={QuestionOutlineIcon}
          boxSize={3.5}
          color="text-subtle"
          cursor="help"
          tabIndex={0}
          aria-label={`Penjelasan ${label}`}
        />
      </Tooltip>
    </HStack>
  )
}

type Props = Omit<FormLabelProps, 'children'> & {
  label: string
  tooltip: string
}
