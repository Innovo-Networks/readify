import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isValidVatNumber, isValidCipcNumber, isValidAccountNumber, isValidBranchCode,
  documentError, documentExtension, DOCUMENT_MAX_BYTES,
} from '../lib/publisher-validation'

test('VAT: 10 digits starting with 4', () => {
  assert.equal(isValidVatNumber('4123456789'), true)
  assert.equal(isValidVatNumber('5123456789'), false)
  assert.equal(isValidVatNumber('412345678'), false)
  assert.equal(isValidVatNumber('41234567890'), false)
  assert.equal(isValidVatNumber('412345678a'), false)
})

test('CIPC: YYYY/NNNNNN/NN', () => {
  assert.equal(isValidCipcNumber('2023/123456/07'), true)
  assert.equal(isValidCipcNumber(' 2023/123456/07 '), true)
  assert.equal(isValidCipcNumber('202312345607'), false)
  assert.equal(isValidCipcNumber('23/123456/07'), false)
  assert.equal(isValidCipcNumber('2023/12345/07'), false)
})

test('account number: 6 to 16 digits', () => {
  assert.equal(isValidAccountNumber('123456'), true)
  assert.equal(isValidAccountNumber('1234567890123456'), true)
  assert.equal(isValidAccountNumber('12345'), false)
  assert.equal(isValidAccountNumber('12345678901234567'), false)
  assert.equal(isValidAccountNumber('12 345 678'), false)
})

test('branch code: exactly 6 digits', () => {
  assert.equal(isValidBranchCode('250655'), true)
  assert.equal(isValidBranchCode('25065'), false)
  assert.equal(isValidBranchCode('25065a'), false)
})

test('documents: PDF/JPG/PNG up to 5 MB', () => {
  assert.equal(documentError({ type: 'application/pdf', size: 1000, name: 'a.pdf' }), null)
  assert.equal(documentError({ type: 'image/png', size: DOCUMENT_MAX_BYTES, name: 'a.png' }), null)
  assert.match(documentError({ type: 'application/msword', size: 1000, name: 'a.doc' }) ?? '', /PDF, JPG or PNG/)
  assert.match(documentError({ type: 'application/pdf', size: DOCUMENT_MAX_BYTES + 1, name: 'big.pdf' }) ?? '', /over 5 MB/)
})

test('document extension follows the MIME type', () => {
  assert.equal(documentExtension('application/pdf'), 'pdf')
  assert.equal(documentExtension('image/png'), 'png')
  assert.equal(documentExtension('image/jpeg'), 'jpg')
})
