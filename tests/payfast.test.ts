import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { payfastEncode, payfastSignature, buildPayfastPayment, checkItn, parseFormBody } from '../lib/payfast'

const md5 = (s: string) => createHash('md5').update(s).digest('hex')

test('payfastEncode: spaces become +, reserved chars upper-case hex, trims', () => {
  assert.equal(payfastEncode(' Hello World '), 'Hello+World')
  assert.equal(payfastEncode('a&b=c/d'), 'a%26b%3Dc%2Fd')
  assert.equal(payfastEncode('João'), 'Jo%C3%A3o')
})

test('payfastSignature: keeps order, skips empties, appends passphrase', () => {
  const sig = payfastSignature([['merchant_id', '10000100'], ['name_last', ''], ['amount', '100.00'], ['item_name', 'Two words']], 'pass phrase')
  assert.equal(sig, md5('merchant_id=10000100&amount=100.00&item_name=Two+words&passphrase=pass+phrase'))
})

test('payfastSignature: no passphrase suffix when passphrase is empty', () => {
  const sig = payfastSignature([['merchant_id', '10000100'], ['amount', '5.00']], '')
  assert.equal(sig, md5('merchant_id=10000100&amount=5.00'))
})

const config = {
  merchantId: '10000100', merchantKey: '46f0cd694581a', passphrase: 'jt7NOE43FZPn', sandbox: true,
  processUrl: 'https://sandbox.payfast.co.za/eng/process', validateUrl: 'https://sandbox.payfast.co.za/eng/query/validate',
}

test('buildPayfastPayment: documented field order, 2dp amount, split name, signature over non-empty fields', () => {
  const { url, fields } = buildPayfastPayment({
    orderId: 'ord-123', amount: 149, itemName: 'Readify: 1 ebook', buyerEmail: 'buyer@example.com', buyerName: 'Thandi van der Merwe',
    returnUrl: 'https://x.test/checkout/success?order_id=ord-123', cancelUrl: 'https://x.test/cart', notifyUrl: 'https://x.test/api/payfast/notify',
  }, config)
  assert.equal(url, config.processUrl)
  assert.deepEqual(Object.keys(fields), [
    'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url', 'name_first', 'name_last',
    'email_address', 'm_payment_id', 'amount', 'item_name', 'email_confirmation', 'confirmation_address', 'signature',
  ])
  assert.equal(fields.amount, '149.00')
  assert.equal(fields.name_first, 'Thandi')
  assert.equal(fields.name_last, 'van der Merwe')
  const expected = payfastSignature(Object.entries(fields).filter(([k]) => k !== 'signature'), config.passphrase)
  assert.equal(fields.signature, expected)
})

test('buildPayfastPayment: refuses to run without merchant credentials', () => {
  assert.throws(() => buildPayfastPayment({
    orderId: 'o', amount: 1, itemName: 'x', buyerEmail: 'a@b.c', returnUrl: 'r', cancelUrl: 'c', notifyUrl: 'n',
  }, { ...config, merchantId: '' }), /not configured/)
})

function itn(overrides: Record<string, string> = {}, passphrase = config.passphrase): Array<[string, string]> {
  const base: Array<[string, string]> = [
    ['m_payment_id', 'ord-123'], ['pf_payment_id', '1089250'], ['payment_status', 'COMPLETE'],
    ['item_name', 'Readify: 1 ebook'], ['item_description', ''], ['amount_gross', '149.00'], ['amount_fee', '-3.43'],
    ['amount_net', '145.57'], ['custom_str1', ''], ['name_first', 'Thandi'], ['name_last', 'van der Merwe'],
    ['email_address', 'buyer@example.com'], ['merchant_id', '10000100'],
  ]
  const withOverrides = base.map(([k, v]) => [k, overrides[k] ?? v] as [string, string])
  return [...withOverrides, ['signature', payfastSignature(withOverrides, passphrase)]]
}

test('checkItn: accepts a correctly signed ITN for the right merchant and amount', () => {
  assert.deepEqual(checkItn({ data: itn(), passphrase: config.passphrase, expectedMerchantId: '10000100', expectedAmount: 149 }), { ok: true })
})

test('checkItn: rejects a tampered amount, wrong merchant, bad signature, missing signature', () => {
  const tampered = itn().map(([k, v]) => [k, k === 'amount_gross' ? '1.00' : v] as [string, string])
  assert.equal(checkItn({ data: tampered, passphrase: config.passphrase, expectedMerchantId: '10000100', expectedAmount: 149 }).ok, false)
  assert.match((checkItn({ data: itn({ merchant_id: '999' }), passphrase: config.passphrase, expectedMerchantId: '10000100', expectedAmount: 149 }) as any).reason, /merchant/)
  assert.match((checkItn({ data: itn({}, 'wrong-pass'), passphrase: config.passphrase, expectedMerchantId: '10000100', expectedAmount: 149 }) as any).reason, /signature/)
  assert.match((checkItn({ data: itn().filter(([k]) => k !== 'signature'), passphrase: config.passphrase, expectedMerchantId: '10000100', expectedAmount: 149 }) as any).reason, /missing/)
  assert.match((checkItn({ data: itn(), passphrase: config.passphrase, expectedMerchantId: '10000100', expectedAmount: 150 }) as any).reason, /amount/)
})

test('parseFormBody: preserves order and decodes + as space', () => {
  assert.deepEqual(parseFormBody('b=2&a=one+two&c=%26'), [['b', '2'], ['a', 'one two'], ['c', '&']])
})
