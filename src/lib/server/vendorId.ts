// 5-character vendor IDs. Excludes ambiguous characters (I, L, O, 0, 1).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export const generateVendorId = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(5))
  let id = ''
  for (let i = 0; i < bytes.length; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return id
}
