import { createHash } from 'crypto'

/**
 * PayFast integration (South Africa): hosted payment page + ITN callback.
 * Docs: https://developers.payfast.co.za/docs
 *
 * Flow:
 *   1. /api/payfast/create-payment builds a signed field set for a pending order.
 *   2. The browser POSTs those fields to PayFast's hosted page.
 *   3. PayFast POSTs an Instant Transaction Notification (ITN) to
 *      /api/payfast/notify, which verifies it and fulfils the order.
 */

export const PAYFAST_SANDBOX = process.env.PAYFAST_SANDBOX !== 'false'

export function payfastHost(sandbox = PAYFAST_SANDBOX): string {
  return sandbox ? 'sandbox.payfast.co.za' : 'www.payfast.co.za'
}

export function payfastConfig() {
  return {
    merchantId:  process.env.PAYFAST_MERCHANT_ID  || '',
    merchantKey: process.env.PAYFAST_MERCHANT_KEY || '',
    passphrase:  process.env.PAYFAST_PASSPHRASE   || '',
    sandbox:     PAYFAST_SANDBOX,
    processUrl:  `https://${payfastHost()}/eng/process`,
    validateUrl: `https://${payfastHost()}/eng/query/validate`,
  }
}

/**
 * PayFast-style URL encoding, matching PHP's urlencode (which PayFast signs with):
 * everything except A-Z a-z 0-9 - _ . is percent-encoded, spaces become '+'.
 * Values are not trimmed, so the signed text matches the text sent.
 */
export function payfastEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!'()*~]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, '+')
}

/**
 * Builds the MD5 signature over the given fields in the order supplied,
 * skipping empty values, and appending the passphrase when one is set.
 * Used both for outgoing payment requests and for verifying incoming ITNs.
 */
export function payfastSignature(fields: Array<[string, string]>, passphrase: string): string {
  const parts = fields
    .filter(([, v]) => v !== undefined && v !== null && String(v) !== '')
    .map(([k, v]) => `${k}=${payfastEncode(String(v))}`)
  if (passphrase) parts.push(`passphrase=${payfastEncode(passphrase)}`)
  return createHash('md5').update(parts.join('&')).digest('hex')
}

export interface PayfastPaymentInput {
  orderId: string
  amount: number            // ZAR, VAT inclusive
  itemName: string          // max 100 chars
  itemDescription?: string  // max 255 chars
  buyerEmail: string
  buyerName?: string | null
  returnUrl: string
  cancelUrl: string
  notifyUrl: string
}

/**
 * Field list for PayFast's hosted process page, in the order PayFast documents,
 * plus the signature. The browser must submit these as a form POST.
 */
export function buildPayfastPayment(input: PayfastPaymentInput, config = payfastConfig()) {
  if (!config.merchantId || !config.merchantKey) {
    throw new Error('PayFast is not configured (PAYFAST_MERCHANT_ID / PAYFAST_MERCHANT_KEY missing)')
  }
  const [first, ...rest] = (input.buyerName || '').trim().split(/\s+/)
  const fields: Array<[string, string]> = [
    ['merchant_id',      config.merchantId],
    ['merchant_key',     config.merchantKey],
    ['return_url',       input.returnUrl],
    ['cancel_url',       input.cancelUrl],
    ['notify_url',       input.notifyUrl],
    ['name_first',       (first || '').slice(0, 100)],
    ['name_last',        rest.join(' ').slice(0, 100)],
    ['email_address',    input.buyerEmail],
    ['m_payment_id',     input.orderId],
    ['amount',           input.amount.toFixed(2)],
    ['item_name',        input.itemName.slice(0, 100)],
    ['item_description', (input.itemDescription || '').slice(0, 255)],
    ['email_confirmation', '1'],
    ['confirmation_address', input.buyerEmail],
  ]
  const signature = payfastSignature(fields, config.passphrase)
  const nonEmpty = fields.filter(([, v]) => v !== '')
  return {
    url: config.processUrl,
    fields: Object.fromEntries([...nonEmpty, ['signature', signature]]) as Record<string, string>,
  }
}

export interface ItnCheckInput {
  /** ITN body as PayFast sent it, in original key order (signature included). */
  data: Array<[string, string]>
  passphrase: string
  expectedMerchantId: string
  expectedAmount: number
}

/**
 * Offline checks on an ITN: signature, merchant and amount.
 * (The caller additionally confirms the ITN with PayFast's validate endpoint.)
 */
export function checkItn({ data, passphrase, expectedMerchantId, expectedAmount }: ItnCheckInput): { ok: true } | { ok: false; reason: string } {
  const map = Object.fromEntries(data)
  const received = map['signature']
  if (!received) return { ok: false, reason: 'missing signature' }

  // ITNs are signed over every field PayFast sent, including empty ones (custom_* etc.).
  const parts = data
    .filter(([k]) => k !== 'signature')
    .map(([k, v]) => `${k}=${payfastEncode(v)}`)
  if (passphrase) parts.push(`passphrase=${payfastEncode(passphrase)}`)
  const expected = createHash('md5').update(parts.join('&')).digest('hex')
  if (expected !== received) return { ok: false, reason: 'signature mismatch' }

  if (map['merchant_id'] !== expectedMerchantId) return { ok: false, reason: 'merchant_id mismatch' }

  const gross = Number.parseFloat(map['amount_gross'] ?? '')
  if (!Number.isFinite(gross) || Math.abs(gross - expectedAmount) > 0.01) {
    return { ok: false, reason: `amount mismatch (got ${map['amount_gross']}, expected ${expectedAmount.toFixed(2)})` }
  }
  return { ok: true }
}

/** Parses an application/x-www-form-urlencoded body preserving key order. */
export function parseFormBody(body: string): Array<[string, string]> {
  const params = new URLSearchParams(body)
  const out: Array<[string, string]> = []
  params.forEach((value, key) => out.push([key, value]))
  return out
}

/** Asks PayFast to confirm the ITN really came from them. Returns true on "VALID". */
export async function validateItnWithPayfast(data: Array<[string, string]>, validateUrl = payfastConfig().validateUrl): Promise<boolean> {
  const body = data
    .filter(([k]) => k !== 'signature')
    .map(([k, v]) => `${k}=${payfastEncode(v)}`)
    .join('&')
  const res = await fetch(validateUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const text = (await res.text()).trim()
  return text === 'VALID'
}
