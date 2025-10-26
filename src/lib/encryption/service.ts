import crypto from 'crypto'

/**
 * Encryption Service
 * - AES-256-GCM encryption for sensitive data
 * - Encryption keys stored in environment variables
 * - Used for IPFS and blockchain data
 */

export class EncryptionService {
  private encryptionKey: Buffer
  private algorithm = 'aes-256-gcm'

  constructor() {
    // Get encryption key from environment
    const keyHex = process.env.ENCRYPTION_KEY
    if (!keyHex) {
      throw new Error('ENCRYPTION_KEY environment variable not set')
    }
    // Key should be 64 hex characters (32 bytes for AES-256)
    this.encryptionKey = Buffer.from(keyHex, 'hex')
    if (this.encryptionKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)')
    }
  }

  /**
   * Encrypt data with AES-256-GCM
   * Returns: iv:authTag:encryptedData (all hex encoded)
   */
  encrypt(data: any): string {
    try {
      // Convert data to JSON string
      const plaintext = JSON.stringify(data)

      // Generate random IV (initialization vector)
      const iv = crypto.randomBytes(16)

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv)

      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      // Get authentication tag
      const authTag = (cipher as any).getAuthTag()

      // Return format: iv:authTag:encrypted
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * Decrypt data encrypted with AES-256-GCM
   * Input format: iv:authTag:encryptedData (all hex encoded)
   */
  decrypt(encryptedData: string): any {
    try {
      // Split the encrypted data
      const parts = encryptedData.split(':')
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format')
      }

      const iv = Buffer.from(parts[0], 'hex')
      const authTag = Buffer.from(parts[1], 'hex')
      const encrypted = parts[2]

      // Create decipher
      const decipher: any = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv)
      decipher.setAuthTag(authTag)

      // Decrypt data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      // Parse JSON
      return JSON.parse(decrypted)
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  /**
   * Encrypt and return as base64 for storage
   */
  encryptToBase64(data: any): string {
    const encrypted = this.encrypt(data)
    return Buffer.from(encrypted).toString('base64')
  }

  /**
   * Decrypt from base64
   */
  decryptFromBase64(encryptedBase64: string): any {
    const encrypted = Buffer.from(encryptedBase64, 'base64').toString('utf8')
    return this.decrypt(encrypted)
  }

  /**
   * Hash data (for verification without decryption)
   */
  hash(data: any): string {
    const plaintext = JSON.stringify(data)
    return crypto.createHash('sha256').update(plaintext).digest('hex')
  }

  /**
   * Verify data integrity using hash
   */
  verifyHash(data: any, hash: string): boolean {
    return this.hash(data) === hash
  }

  /**
   * Generate a random encryption key (for setup)
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }
}

export const encryptionService = new EncryptionService()
