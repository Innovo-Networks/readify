/**
 * Format checks for publisher applications. These only confirm a value is well formed;
 * an admin still checks the uploaded documents before approving anyone.
 */

/** South African VAT numbers: 10 digits, starting with 4. */
export function isValidVatNumber(value: string): boolean {
  return /^4\d{9}$/.test(value)
}

/** CIPC registration numbers: YYYY/NNNNNN/NN, e.g. 2023/123456/07. */
export function isValidCipcNumber(value: string): boolean {
  return /^\d{4}\/\d{6}\/\d{2}$/.test(value.trim())
}

/** Bank account numbers: 6 to 16 digits (SA account numbers vary by bank). */
export function isValidAccountNumber(value: string): boolean {
  return /^\d{6,16}$/.test(value)
}

/** SA universal branch codes are 6 digits. */
export function isValidBranchCode(value: string): boolean {
  return /^\d{6}$/.test(value)
}

export const DOCUMENT_MAX_BYTES = 5 * 1024 * 1024
export const DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const

/** Returns an error message for an unacceptable document, or null if it is fine. */
export function documentError(file: { type: string; size: number; name: string }): string | null {
  if (!(DOCUMENT_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name}: upload a PDF, JPG or PNG.`
  }
  if (file.size > DOCUMENT_MAX_BYTES) {
    return `${file.name}: the file is over 5 MB.`
  }
  return null
}

/** File extension for the stored document, taken from its MIME type. */
export function documentExtension(type: string): string {
  return type === 'application/pdf' ? 'pdf' : type === 'image/png' ? 'png' : 'jpg'
}
