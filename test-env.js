require('dotenv').config({ path: '.env.local' })

console.log('Testing .env.local configuration...\n')

console.log('CELO_PRIVATE_KEY exists:', !!process.env.CELO_PRIVATE_KEY)
console.log('CELO_PRIVATE_KEY length:', process.env.CELO_PRIVATE_KEY?.length || 0)
console.log('CELO_PRIVATE_KEY (first 10 chars):', process.env.CELO_PRIVATE_KEY?.substring(0, 10) || 'NOT FOUND')

console.log('\nNEXT_PUBLIC_CELO_NETWORK:', process.env.NEXT_PUBLIC_CELO_NETWORK)
console.log('NEXT_PUBLIC_CELO_RPC_URL:', process.env.NEXT_PUBLIC_CELO_RPC_URL)

if (!process.env.CELO_PRIVATE_KEY) {
  console.log('\n❌ ERROR: CELO_PRIVATE_KEY not found in .env.local')
  console.log('Make sure the file is saved and the key is on one line')
} else if (process.env.CELO_PRIVATE_KEY.length !== 64) {
  console.log('\n⚠️  WARNING: Private key should be 64 characters (without 0x prefix)')
  console.log('Current length:', process.env.CELO_PRIVATE_KEY.length)
} else {
  console.log('\n✅ Configuration looks good!')
}
