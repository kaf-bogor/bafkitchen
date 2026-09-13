import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false
}

// Horizon-inspired brand palette (green as the primary accent)
const brand = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d'
}

const theme = extendTheme({
  config,
  styles: {
    global: {
      body: {
        color: 'text-body',
        bg: 'app-bg',
        textRendering: 'optimizeLegibility',
        WebkitFontSmoothing: 'antialiased'
      },
      ':focus-visible': {
        outline: '2px solid',
        outlineColor: 'brand.500',
        outlineOffset: '2px'
      },
      '::selection': {
        bg: 'brand.100'
      }
    }
  },
  colors: {
    brand,
    primary: brand,
    success: {
      500: '#22c55e',
      600: '#16a34a',
      50: '#f0fdf4'
    },
    warning: {
      500: '#f59e0b',
      600: '#d97706',
      50: '#fffbeb'
    },
    error: {
      500: '#ef4444',
      600: '#dc2626',
      50: '#fef2f2'
    },
    info: {
      500: '#3b82f6',
      600: '#2563eb',
      50: '#eff6ff'
    }
  },
  // Semantic color tokens — always reference these instead of raw gray values.
  semanticTokens: {
    colors: {
      'app-bg': { default: 'gray.50', _dark: 'gray.900' },
      surface: { default: 'white', _dark: 'gray.800' },
      'surface-muted': { default: 'gray.100', _dark: 'gray.700' },
      'text-strong': { default: 'gray.900', _dark: 'white' },
      'text-body': { default: 'gray.700', _dark: 'gray.200' },
      'text-muted': { default: 'gray.500', _dark: 'gray.400' },
      'text-subtle': { default: 'gray.400', _dark: 'gray.500' },
      'border-subtle': { default: 'gray.200', _dark: 'gray.700' },
      'border-strong': { default: 'gray.300', _dark: 'gray.600' }
    }
  },
  fonts: {
    heading: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
    body: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  },
  space: {
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem'
  },
  radii: {
    none: '0',
    sm: '0.25rem',
    base: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem',
    '3xl': '1.5rem',
    full: '9999px'
  },
  shadows: {
    xs: '0 0 0 1px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    outline: '0 0 0 3px rgba(66, 153, 225, 0.6)',
    inner: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)',
    // Elevation scale — use these for consistent depth across surfaces.
    card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)',
    dropdown:
      '0 4px 12px -2px rgba(16, 24, 40, 0.12), 0 2px 6px -2px rgba(16, 24, 40, 0.08)',
    modal: '0 24px 48px -12px rgba(16, 24, 40, 0.24)'
  },
  // Typography scale — apply with the `textStyle` prop.
  textStyles: {
    pageTitle: {
      fontSize: { base: '2xl', md: '3xl' },
      fontWeight: '700',
      lineHeight: '1.2',
      letterSpacing: '-0.02em',
      color: 'text-strong'
    },
    sectionTitle: {
      fontSize: { base: 'lg', md: 'xl' },
      fontWeight: '700',
      lineHeight: '1.3',
      letterSpacing: '-0.01em',
      color: 'text-strong'
    },
    body: {
      fontSize: 'md',
      lineHeight: '1.6',
      color: 'text-body'
    },
    small: {
      fontSize: 'sm',
      lineHeight: '1.5',
      color: 'text-body'
    },
    caption: {
      fontSize: 'xs',
      lineHeight: '1.4',
      color: 'text-muted'
    },
    button: {
      fontSize: 'sm',
      fontWeight: '600'
    },
    price: {
      fontSize: 'lg',
      fontWeight: '700',
      letterSpacing: '-0.01em',
      color: 'brand.700'
    }
  },
  // Surface treatments — apply with the `layerStyle` prop.
  layerStyles: {
    card: {
      bg: 'surface',
      border: '1px solid',
      borderColor: 'border-subtle',
      borderRadius: 'xl',
      boxShadow: 'card'
    },
    panel: {
      bg: 'surface',
      border: '1px solid',
      borderColor: 'border-subtle',
      borderRadius: 'xl'
    },
    muted: {
      bg: 'surface-muted',
      borderRadius: 'lg'
    }
  },
  components: {
    Heading: {
      baseStyle: {
        fontWeight: '700',
        letterSpacing: '-0.01em',
        color: 'text-strong'
      }
    },
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'lg',
        _focusVisible: {
          boxShadow: '0 0 0 3px var(--chakra-colors-brand-200)',
          outline: 'none'
        }
      },
      sizes: {
        md: {
          h: '10',
          px: '4',
          fontSize: 'sm'
        },
        lg: {
          h: '12',
          px: '6',
          fontSize: 'md'
        }
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            _disabled: {
              bg: 'brand.500'
            }
          },
          _active: {
            bg: 'brand.700'
          }
        },
        outline: {
          borderColor: 'border-strong',
          color: 'text-body',
          _hover: {
            bg: 'gray.50',
            borderColor: 'gray.400'
          }
        },
        ghost: {
          color: 'text-body',
          _hover: {
            bg: 'gray.100'
          }
        },
        subtle: {
          bg: 'gray.100',
          color: 'text-body',
          _hover: {
            bg: 'gray.200'
          }
        },
        danger: {
          bg: 'red.500',
          color: 'white',
          _hover: {
            bg: 'red.600'
          }
        }
      }
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: 'lg'
        }
      },
      variants: {
        outline: {
          field: {
            borderColor: 'border-subtle',
            bg: 'surface',
            _focus: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
            },
            _hover: {
              borderColor: 'border-strong'
            }
          }
        }
      }
    },
    Select: {
      baseStyle: {
        field: {
          borderRadius: 'lg'
        }
      },
      variants: {
        outline: {
          field: {
            borderColor: 'border-subtle',
            bg: 'surface',
            _focus: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
            },
            _hover: {
              borderColor: 'border-strong'
            }
          }
        }
      }
    },
    Textarea: {
      baseStyle: {
        borderRadius: 'lg'
      },
      variants: {
        outline: {
          borderColor: 'border-subtle',
          bg: 'surface',
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
          },
          _hover: {
            borderColor: 'border-strong'
          }
        }
      }
    },
    FormLabel: {
      baseStyle: {
        fontSize: 'sm',
        fontWeight: '600',
        color: 'text-body',
        mb: 1.5
      }
    },
    FormHelperText: {
      baseStyle: {
        fontSize: 'xs',
        color: 'text-muted',
        mt: 1.5
      }
    },
    FormErrorMessage: {
      baseStyle: {
        fontSize: 'xs',
        mt: 1.5
      }
    },
    Checkbox: {
      baseStyle: {
        control: {
          borderColor: 'border-strong',
          borderRadius: 'base',
          _checked: {
            bg: 'brand.500',
            borderColor: 'brand.500'
          }
        },
        label: {
          fontSize: 'sm',
          color: 'text-body'
        }
      }
    },
    Radio: {
      baseStyle: {
        control: {
          borderColor: 'border-strong',
          _checked: {
            bg: 'brand.500',
            borderColor: 'brand.500'
          }
        },
        label: {
          fontSize: 'sm',
          color: 'text-body'
        }
      }
    },
    Switch: {
      baseStyle: {
        track: {
          _checked: {
            bg: 'brand.500'
          }
        }
      }
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'surface',
          borderRadius: 'xl',
          border: '1px solid',
          borderColor: 'border-subtle',
          boxShadow: 'card',
          overflow: 'hidden'
        }
      }
    },
    Table: {
      variants: {
        simple: {
          th: {
            fontSize: 'xs',
            textTransform: 'uppercase',
            letterSpacing: 'wider',
            color: 'text-muted',
            fontWeight: '600',
            borderColor: 'gray.100'
          },
          td: {
            fontSize: 'sm',
            color: 'text-body',
            borderColor: 'gray.100'
          }
        }
      }
    },
    Badge: {
      baseStyle: {
        borderRadius: 'md',
        fontWeight: '600',
        px: '2',
        py: '0.5'
      }
    },
    Menu: {
      baseStyle: {
        list: {
          borderRadius: 'lg',
          boxShadow: 'dropdown',
          border: '1px solid',
          borderColor: 'border-subtle',
          py: 1
        },
        item: {
          fontSize: 'sm',
          fontWeight: '500',
          borderRadius: 'md',
          _hover: {
            bg: 'gray.50'
          },
          _focus: {
            bg: 'gray.50'
          }
        }
      }
    },
    Tooltip: {
      baseStyle: {
        borderRadius: 'md',
        boxShadow: 'dropdown',
        fontSize: 'xs',
        px: 2,
        py: 1
      }
    },
    Alert: {
      baseStyle: {
        container: {
          borderRadius: 'lg'
        }
      }
    },
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: 'xl',
          boxShadow: 'modal'
        },
        header: {
          fontSize: 'lg',
          fontWeight: '600'
        }
      }
    },
    Tabs: {
      variants: {
        softRounded: {
          tab: {
            fontWeight: '600',
            borderRadius: 'lg',
            _selected: {
              bg: 'brand.50',
              color: 'brand.700'
            }
          }
        },
        line: {
          tab: {
            fontWeight: '600',
            color: 'text-muted',
            _selected: {
              color: 'brand.700',
              borderColor: 'brand.500'
            }
          }
        }
      }
    },
    Divider: {
      baseStyle: {
        borderColor: 'border-subtle'
      }
    },
    Link: {
      baseStyle: {
        color: 'brand.600',
        _hover: {
          color: 'brand.700',
          textDecoration: 'none'
        }
      }
    }
  }
})

export default theme
