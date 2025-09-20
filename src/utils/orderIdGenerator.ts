/**
 * Generates human-readable order IDs
 * Format: BAF-YYYYMMDD-XXXXX
 * Where:
 * - BAF: Baf Kitchen prefix
 * - YYYYMMDD: Current date
 * - XXXXX: Random 5-digit number
 */

export const generateOrderId = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const dateStr = `${year}${month}${day}`
  
  // Generate random 5-digit number
  const randomNum = Math.floor(Math.random() * 90000) + 10000
  
  return `BAF-${dateStr}-${randomNum}`
}

/**
 * Alternative format: BAF-YYYYMM-NNNNN
 * Where NNNNN is a sequential number (would need database counter)
 */
export const generateOrderIdWithSequence = async (sequenceNumber: number): Promise<string> => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const dateStr = `${year}${month}`
  
  const seqStr = String(sequenceNumber).padStart(5, '0')
  
  return `BAF-${dateStr}-${seqStr}`
}