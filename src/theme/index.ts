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
    inner: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)'
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'lg'
      },
      sizes: {
        md: {
          h: '10',
          px: '4',
          fontSize: 'sm'
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
          borderColor: 'gray.300',
          color: 'gray.700',
          _hover: {
            bg: 'gray.50',
            borderColor: 'gray.400'
          }
        },
        ghost: {
          _hover: {
            bg: 'gray.100'
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
            borderColor: 'gray.300',
            _focus: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
            },
            _hover: {
              borderColor: 'gray.400'
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
            borderColor: 'gray.300',
            _focus: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
            },
            _hover: {
              borderColor: 'gray.400'
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
          borderColor: 'gray.300',
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
          },
          _hover: {
            borderColor: 'gray.400'
          }
        }
      }
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderRadius: 'xl',
          boxShadow: 'sm',
          border: '1px solid',
          borderColor: 'gray.200',
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
            color: 'gray.500',
            fontWeight: '600',
            borderColor: 'gray.100'
          },
          td: {
            fontSize: 'sm',
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
    Tooltip: {
      baseStyle: {
        borderRadius: 'md'
      }
    },
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: 'xl'
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
            fontWeight: '500',
            borderRadius: 'lg',
            _selected: {
              bg: 'brand.500',
              color: 'white'
            }
          }
        }
      }
    },
    Divider: {
      baseStyle: {
        borderColor: 'gray.200'
      }
    }
  }
})

export default theme
