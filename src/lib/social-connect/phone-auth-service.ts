/**
 * Social Connect Phone Authentication Service
 * Phone-based Web3 authentication without wallet setup
 */

import { ethers } from 'ethers'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!

export class PhoneAuthService {
  /**
   * Hash phone number for privacy
   */
  hashPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    
    // Keccak256 hash (same as Solidity)
    return ethers.keccak256(ethers.toUtf8Bytes(cleanPhone))
  }

  /**
   * Encrypt phone number with AES-256-GCM
   */
  encryptPhoneNumber(phoneNumber: string): string {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    
    const iv = crypto.randomBytes(16)
    const key = Buffer.from(ENCRYPTION_KEY, 'hex')
    
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    
    let encrypted = cipher.update(cleanPhone, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  /**
   * Decrypt phone number
   */
  decryptPhoneNumber(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':')
    
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const key = Buffer.from(ENCRYPTION_KEY, 'hex')
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  /**
   * Generate verification code
   */
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Hash verification code for storage
   */
  hashVerificationCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex')
  }

  /**
   * Verify code
   */
  verifyCode(inputCode: string, storedHash: string): boolean {
    const inputHash = this.hashVerificationCode(inputCode)
    return inputHash === storedHash
  }

  /**
   * Generate wallet address from phone number (deterministic)
   */
  async generateWalletFromPhone(phoneNumber: string): Promise<{
    address: string
    privateKey: string
  }> {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    
    // Generate deterministic seed from phone + secret
    const seed = ethers.keccak256(
      ethers.toUtf8Bytes(cleanPhone + ENCRYPTION_KEY)
    )
    
    // Create wallet from seed
    const wallet = new ethers.Wallet(seed)
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    }
  }

  /**
   * Send verification SMS (mock - integrate with Twilio/etc)
   */
  async sendVerificationSMS(phoneNumber: string, code: string): Promise<boolean> {
    // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
    console.log(`📱 Sending verification code ${code} to ${phoneNumber}`)
    
    // In production, use actual SMS service:
    // await twilioClient.messages.create({
    //   body: `Your HireNexa verification code is: ${code}`,
    //   to: phoneNumber,
    //   from: process.env.TWILIO_PHONE_NUMBER
    // })
    
    return true
  }

  /**
   * Format phone number for display (privacy)
   */
  formatPhoneForDisplay(phoneNumber: string): string {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    
    if (cleanPhone.length < 4) return '***'
    
    // Show only last 4 digits
    const lastFour = cleanPhone.slice(-4)
    return `***-***-${lastFour}`
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): {
    valid: boolean
    error?: string
  } {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    
    // Check length (10-15 digits for international)
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return {
        valid: false,
        error: 'Phone number must be 10-15 digits',
      }
    }
    
    // Check if all digits
    if (!/^\d+$/.test(cleanPhone)) {
      return {
        valid: false,
        error: 'Phone number must contain only digits',
      }
    }
    
    return { valid: true }
  }

  /**
   * Check rate limiting for verification attempts
   */
  checkRateLimit(attempts: number, lastAttempt: Date): {
    allowed: boolean
    waitTime?: number
  } {
    const MAX_ATTEMPTS = 5
    const COOLDOWN_MINUTES = 15
    
    if (attempts >= MAX_ATTEMPTS) {
      const timeSinceLastAttempt = Date.now() - lastAttempt.getTime()
      const cooldownMs = COOLDOWN_MINUTES * 60 * 1000
      
      if (timeSinceLastAttempt < cooldownMs) {
        const waitTime = Math.ceil((cooldownMs - timeSinceLastAttempt) / 1000 / 60)
        return {
          allowed: false,
          waitTime,
        }
      }
    }
    
    return { allowed: true }
  }

  /**
   * Create shareable credential link
   */
  createShareableLink(userId: string, phoneHash: string): string {
    const token = ethers.keccak256(
      ethers.toUtf8Bytes(userId + phoneHash + Date.now())
    )
    
    return `https://hirenexa.com/share/${token.slice(0, 16)}`
  }
}

export const phoneAuthService = new PhoneAuthService()
