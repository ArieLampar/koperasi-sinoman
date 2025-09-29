# QR Code Utilities - Digital Member Cards

This document provides comprehensive examples and documentation for the QR code utilities specifically designed for Koperasi Sinoman's digital member card system.

## Overview

The QR code utilities provide secure member ID encoding, digital member card generation, and verification functions for Indonesian cooperative (koperasi) business operations.

## Features

- 🆔 **Secure Member ID Encoding** with checksums and branch codes
- 💳 **Digital Member Card QR Generation** with multiple security levels
- 🔍 **QR Code Verification** with tamper detection
- 🎫 **Attendance QR Codes** for member events
- 🔐 **Encryption Support** for sensitive member data
- 🇮🇩 **Indonesian Localization** with proper formatting

## Quick Start

### Basic Usage

```typescript
import {
  generateMemberCardQR,
  verifyMemberCardQR,
  generateMemberIdWithChecksum,
  validateMemberId
} from '@koperasi-sinoman/utils/qr-code'

// Generate a secure member ID
const memberId = generateMemberIdWithChecksum('12345', 'JKT')
console.log(memberId) // "JKT-12345-ABC123-CHECKSUM"

// Validate member ID
const isValid = validateMemberId(memberId)
console.log(isValid) // true

// Create member data
const memberData = {
  memberId,
  memberNumber: '12345',
  fullName: 'Budi Santoso',
  nik: '3273010101900001',
  phoneNumber: '+628123456789',
  email: 'budi.santoso@email.com',
  membershipType: 'regular' as const,
  membershipStatus: 'active' as const,
  joinDate: new Date('2020-01-15'),
  branchCode: 'JKT'
}

// Generate QR code for digital member card
const qrResult = generateMemberCardQR(memberData)
console.log('QR Data:', qrResult.qrData)
console.log('Card Data:', qrResult.cardData)

// Verify the QR code
const verification = verifyMemberCardQR(qrResult.qrData)
console.log('Is Valid:', verification.isValid)
console.log('Member ID:', verification.memberId)
```

## Detailed Examples

### 1. Member ID Generation and Validation

```typescript
import {
  generateMemberIdWithChecksum,
  validateMemberId,
  extractMemberNumber,
  extractBranchCode
} from '@koperasi-sinoman/utils/qr-code'

// Generate member IDs for different branches
const jakartaMemberId = generateMemberIdWithChecksum('12345', 'JKT')
const bandungMemberId = generateMemberIdWithChecksum('67890', 'BDG')
const surabayaMemberId = generateMemberIdWithChecksum('11111', 'SBY')

console.log('Jakarta Member:', jakartaMemberId)
console.log('Bandung Member:', bandungMemberId)
console.log('Surabaya Member:', surabayaMemberId)

// Validate and extract information
console.log('Jakarta Valid:', validateMemberId(jakartaMemberId))
console.log('Member Number:', extractMemberNumber(jakartaMemberId))
console.log('Branch Code:', extractBranchCode(jakartaMemberId))

// Example outputs:
// Jakarta Member: JKT-12345-1ABCD2E-F123A4B5
// Bandung Member: BDG-67890-2CDEF3G-H456B7C8
// Surabaya Member: SBY-11111-3GHIJ4K-L789D0E1
```

### 2. Digital Member Card QR Generation

#### Basic Member Card

```typescript
import { generateMemberCardQR } from '@koperasi-sinoman/utils/qr-code'

const basicMemberData = {
  memberId: 'JKT-12345-ABC123-DEF456',
  memberNumber: '12345',
  fullName: 'Siti Rahayu',
  phoneNumber: '+628123456789',
  membershipType: 'premium' as const,
  membershipStatus: 'active' as const,
  joinDate: new Date('2021-03-15'),
  branchCode: 'JKT'
}

// Generate basic QR code
const basicQR = generateMemberCardQR(basicMemberData)
console.log('Basic QR Size:', basicQR.metadata.size, 'characters')
console.log('Has Checksum:', basicQR.checksum.length > 0)
```

#### Member Card with Personal Data

```typescript
const detailedMemberData = {
  ...basicMemberData,
  nik: '3273010101900001',
  email: 'siti.rahayu@email.com'
}

// Generate QR with personal data included
const detailedQR = generateMemberCardQR(detailedMemberData, {
  includePersonalData: true,
  expirationDays: 365
})

console.log('Detailed QR includes NIK and email')
console.log('Expires at:', detailedQR.cardData.expiresAt)
```

#### Encrypted Member Card

```typescript
// Generate encrypted QR for high-security scenarios
const encryptedQR = generateMemberCardQR(detailedMemberData, {
  includePersonalData: true,
  encryptData: true,
  expirationDays: 180
})

console.log('Is Encrypted:', encryptedQR.isEncrypted)
console.log('QR cannot be read without decryption key')
```

#### Member Card with Custom Fields

```typescript
// Add custom fields for specific business needs
const customQR = generateMemberCardQR(basicMemberData, {
  customFields: {
    department: 'Simpan Pinjam',
    position: 'Anggota Aktif',
    joinedPrograms: ['Simpanan Wajib', 'Simpanan Sukarela'],
    lastActivity: new Date().toISOString()
  }
})

console.log('Custom fields added to member card')
```

### 3. QR Code Verification

#### Basic Verification

```typescript
import { verifyMemberCardQR, quickVerifyMemberQR } from '@koperasi-sinoman/utils/qr-code'

// Full verification with detailed results
const fullVerification = verifyMemberCardQR(qrData)

if (fullVerification.isValid) {
  console.log('✅ Valid member card')
  console.log('Member:', fullVerification.cardData?.fullName)
  console.log('Status:', fullVerification.cardData?.membershipStatus)
  console.log('Type:', fullVerification.cardData?.membershipType)
} else {
  console.log('❌ Invalid member card')
  console.log('Errors:', fullVerification.errors)

  if (fullVerification.isExpired) {
    console.log('⚠️ Card has expired')
  }
}

// Quick verification for simple checks
const quickCheck = quickVerifyMemberQR(qrData)
if (quickCheck.isValid) {
  console.log(`Valid member: ${quickCheck.memberId}`)
}
```

#### Handling Different Verification Scenarios

```typescript
// Scenario 1: Expired card
const expiredCardData = {
  ...basicMemberData,
  membershipStatus: 'active' as const
}

const expiredQR = generateMemberCardQR(expiredCardData, {
  expirationDays: -1 // Already expired
})

const expiredVerification = verifyMemberCardQR(expiredQR.qrData)
console.log('Expired:', expiredVerification.isExpired)

// Scenario 2: Suspended member
const suspendedCardData = {
  ...basicMemberData,
  membershipStatus: 'suspended' as const
}

const suspendedQR = generateMemberCardQR(suspendedCardData)
const suspendedVerification = verifyMemberCardQR(suspendedQR.qrData)
console.log('Suspended errors:', suspendedVerification.errors)

// Scenario 3: Corrupted QR data
const corruptedQR = expiredQR.qrData.replace('a', 'x')
const corruptedVerification = verifyMemberCardQR(corruptedQR)
console.log('Corrupted:', !corruptedVerification.isValid)
```

### 4. Member Verification QR

```typescript
import { generateMemberVerificationQR } from '@koperasi-sinoman/utils/qr-code'

// Simple verification QR for quick member lookup
const verificationQR = generateMemberVerificationQR(
  'JKT-12345-ABC123-DEF456',
  '12345',
  'Ahmad Wijaya',
  'active'
)

console.log('Verification QR generated for quick scans')

// Parse the verification QR
const verificationData = JSON.parse(verificationQR)
console.log('Format:', verificationData.format)
console.log('Member:', verificationData.data.fullName)
console.log('Status:', verificationData.data.membershipStatus)
```

### 5. Attendance QR Codes

```typescript
import { generateAttendanceQR, verifyAttendanceQR } from '@koperasi-sinoman/utils/qr-code'

// Generate attendance QR for member events
const eventDate = new Date('2024-06-15')
const attendanceQR = generateAttendanceQR(
  'JKT-12345-ABC123-DEF456',
  'RAT-2024-001',
  'Rapat Anggota Tahunan 2024',
  eventDate
)

console.log('Attendance QR generated for event')

// Verify attendance QR
const attendanceVerification = verifyAttendanceQR(attendanceQR, 'RAT-2024-001')

if (attendanceVerification.isValid) {
  console.log('✅ Valid attendance QR')
  console.log('Member ID:', attendanceVerification.memberId)
} else {
  console.log('❌ Invalid attendance QR')
  console.log('Errors:', attendanceVerification.errors)

  if (attendanceVerification.isExpired) {
    console.log('⚠️ Attendance period has expired')
  }
}
```

### 6. Member Card Preview and Validation

```typescript
import {
  generateMemberCardPreview,
  validateMemberCardData
} from '@koperasi-sinoman/utils/qr-code'

// Validate member data before generating QR
const memberData = {
  memberId: 'JKT-12345-ABC123-DEF456',
  memberNumber: '12345',
  fullName: 'Indira Sari',
  nik: '3273010101900001',
  phoneNumber: '+628123456789',
  email: 'indira.sari@email.com',
  membershipType: 'investor' as const,
  membershipStatus: 'active' as const,
  joinDate: new Date('2019-08-20'),
  branchCode: 'JKT'
}

// Validate the data
const validation = validateMemberCardData(memberData)

if (validation.isValid) {
  console.log('✅ Member data is valid')

  // Generate preview for UI display
  const preview = generateMemberCardPreview(memberData)

  console.log('Member Preview:')
  console.log('Name:', preview.displayName)
  console.log('Type:', preview.membershipTypeDisplay) // "Anggota Investor"
  console.log('Status:', preview.statusDisplay) // "Aktif"
  console.log('Join Date:', preview.joinDateDisplay) // "20 Agustus 2019"
  console.log('Branch:', preview.branchDisplay) // "Jakarta Pusat"

} else {
  console.log('❌ Member data validation failed')
  console.log('Errors:', validation.errors)
}
```

## Error Handling

### Common Error Scenarios

```typescript
import { generateMemberCardQR, verifyMemberCardQR } from '@koperasi-sinoman/utils/qr-code'

// 1. Invalid member data
try {
  const invalidData = {
    memberId: '', // Empty member ID
    memberNumber: '12345',
    fullName: '',
    phoneNumber: '',
    membershipType: 'invalid' as any,
    membershipStatus: 'active' as const,
    joinDate: new Date('invalid-date'),
    branchCode: 'XXX'
  }

  const result = generateMemberCardQR(invalidData)
} catch (error) {
  console.log('Generation failed:', error.message)
}

// 2. QR data too large
try {
  const largeData = {
    memberId: 'JKT-12345-ABC123-DEF456',
    memberNumber: '12345',
    fullName: 'Test User',
    phoneNumber: '+628123456789',
    membershipType: 'regular' as const,
    membershipStatus: 'active' as const,
    joinDate: new Date(),
    branchCode: 'JKT'
  }

  // Add too much custom data
  const largeCustomFields = {}
  for (let i = 0; i < 1000; i++) {
    largeCustomFields[`field${i}`] = 'x'.repeat(100)
  }

  const result = generateMemberCardQR(largeData, {
    customFields: largeCustomFields
  })
} catch (error) {
  console.log('QR data too large:', error.message)
}

// 3. Verification error handling
const invalidQRData = 'invalid-qr-data'
const verification = verifyMemberCardQR(invalidQRData)

if (!verification.isValid) {
  console.log('Verification failed:')
  verification.errors.forEach((error, index) => {
    console.log(`${index + 1}. ${error}`)
  })
}
```

## Best Practices

### Security Considerations

```typescript
// 1. Use encryption for sensitive member data
const secureQR = generateMemberCardQR(memberData, {
  includePersonalData: true,
  encryptData: true,
  expirationDays: 90 // Shorter expiration for security
})

// 2. Always validate member data before QR generation
const validation = validateMemberCardData(memberData)
if (!validation.isValid) {
  throw new Error(`Invalid member data: ${validation.errors.join(', ')}`)
}

// 3. Verify QR codes before processing
const verification = verifyMemberCardQR(qrData)
if (!verification.isValid) {
  console.log('Rejecting invalid QR code:', verification.errors)
  return
}

// 4. Check member status before allowing access
if (verification.cardData?.membershipStatus !== 'active') {
  console.log('Member account is not active')
  return
}
```

### Performance Optimization

```typescript
// 1. Use quick verification for simple checks
const quickCheck = quickVerifyMemberQR(qrData)
if (!quickCheck.isValid) {
  return // Early exit for invalid QR
}

// 2. Generate verification QR for frequent scans
const verificationQR = generateMemberVerificationQR(
  memberId,
  memberNumber,
  fullName,
  'active'
)

// 3. Avoid including unnecessary personal data
const basicQR = generateMemberCardQR(memberData, {
  includePersonalData: false, // Faster generation and smaller QR
  addChecksum: true
})
```

## Integration Examples

### React Component Example

```typescript
import React, { useState } from 'react'
import { generateMemberCardQR, verifyMemberCardQR } from '@koperasi-sinoman/utils/qr-code'

const MemberCardGenerator = () => {
  const [memberData, setMemberData] = useState({
    memberId: '',
    memberNumber: '',
    fullName: '',
    phoneNumber: '',
    membershipType: 'regular' as const,
    membershipStatus: 'active' as const,
    joinDate: new Date(),
    branchCode: 'JKT'
  })

  const [qrResult, setQRResult] = useState(null)

  const generateQR = () => {
    try {
      const result = generateMemberCardQR(memberData)
      setQRResult(result)
    } catch (error) {
      console.error('QR generation failed:', error)
    }
  }

  return (
    <div>
      {/* Form inputs for memberData */}
      <button onClick={generateQR}>Generate QR Code</button>

      {qrResult && (
        <div>
          <h3>QR Code Generated</h3>
          <p>Size: {qrResult.metadata.size} characters</p>
          <p>Encrypted: {qrResult.isEncrypted ? 'Yes' : 'No'}</p>
          <textarea value={qrResult.qrData} readOnly />
        </div>
      )}
    </div>
  )
}
```

### Node.js API Example

```typescript
import express from 'express'
import { generateMemberCardQR, verifyMemberCardQR } from '@koperasi-sinoman/utils/qr-code'

const app = express()
app.use(express.json())

// Generate member card QR
app.post('/api/member-cards/qr', (req, res) => {
  try {
    const { memberData, options } = req.body
    const result = generateMemberCardQR(memberData, options)

    res.json({
      success: true,
      qrData: result.qrData,
      metadata: result.metadata
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

// Verify member card QR
app.post('/api/member-cards/verify', (req, res) => {
  try {
    const { qrData } = req.body
    const verification = verifyMemberCardQR(qrData)

    res.json({
      success: true,
      verification
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

app.listen(3000, () => {
  console.log('QR API server running on port 3000')
})
```

## Constants Reference

### Branch Codes
```typescript
const BRANCH_CODES = {
  'JAKARTA': 'JKT',
  'BANDUNG': 'BDG',
  'SURABAYA': 'SBY',
  'MEDAN': 'MDN',
  'SEMARANG': 'SMG',
  'MAKASSAR': 'MKS',
  'PALEMBANG': 'PLM',
  'DENPASAR': 'DPS',
  'YOGYAKARTA': 'YGY',
  'MALANG': 'MLG'
}
```

### Membership Types
```typescript
const MEMBERSHIP_TYPE_CODES = {
  regular: 'REG',    // Anggota Reguler
  premium: 'PRM',    // Anggota Premium
  investor: 'INV'    // Anggota Investor
}
```

### Status Codes
```typescript
const STATUS_CODES = {
  active: 'ACT',     // Aktif
  inactive: 'INA',   // Tidak Aktif
  suspended: 'SUS'   // Dibekukan
}
```

## Troubleshooting

### Common Issues

1. **QR Data Too Large**
   - Reduce custom fields
   - Don't include unnecessary personal data
   - Use shorter expiration periods

2. **Invalid Member ID Format**
   - Ensure proper branch code (3 letters)
   - Member number must be numeric
   - Use `generateMemberIdWithChecksum()` for valid IDs

3. **Verification Fails**
   - Check QR data for corruption
   - Verify checksum integrity
   - Ensure version compatibility

4. **Expired QR Codes**
   - Check expiration dates
   - Regenerate QR codes for expired cards
   - Consider appropriate expiration periods

This documentation provides comprehensive guidance for implementing QR code utilities in the Koperasi Sinoman digital member card system.