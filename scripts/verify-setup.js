#!/usr/bin/env node

/**
 * HireNexa Setup Verification Script
 * Checks if all required environment variables and services are configured
 */

require('dotenv').config({ path: '.env.local' })

const checks = {
  passed: [],
  failed: [],
  warnings: []
}

console.log('🔍 HireNexa Setup Verification\n')
console.log('=' .repeat(50))

// Check Supabase
console.log('\n📦 Checking Supabase Configuration...')
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  checks.passed.push('✅ Supabase URL and Anon Key configured')
  console.log('  ✅ Supabase URL: ' + process.env.NEXT_PUBLIC_SUPABASE_URL)
} else {
  checks.failed.push('❌ Supabase credentials missing')
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  checks.passed.push('✅ Supabase Service Role Key configured')
} else {
  checks.warnings.push('⚠️  Supabase Service Role Key missing (needed for admin operations)')
}

// Check Celo
console.log('\n⛓️  Checking Celo Blockchain Configuration...')
if (process.env.NEXT_PUBLIC_CELO_RPC_URL) {
  checks.passed.push('✅ Celo RPC URL configured')
  console.log('  ✅ Network: ' + (process.env.NEXT_PUBLIC_USE_MAINNET === 'true' ? 'Mainnet' : 'Alfajores Testnet'))
} else {
  checks.failed.push('❌ Celo RPC URL missing')
}

if (process.env.CELO_PRIVATE_KEY) {
  checks.passed.push('✅ Celo deployer private key configured')
} else {
  checks.warnings.push('⚠️  Celo private key missing (needed for contract deployment)')
}

// Check IPFS/Pinata
console.log('\n📦 Checking IPFS/Pinata Configuration...')
if (process.env.PINATA_JWT) {
  checks.passed.push('✅ Pinata JWT configured')
} else {
  checks.failed.push('❌ Pinata JWT missing')
}

// Check GitHub
console.log('\n🐙 Checking GitHub OAuth Configuration...')
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  checks.passed.push('✅ GitHub OAuth configured')
} else {
  checks.warnings.push('⚠️  GitHub OAuth missing (needed for GitHub login)')
}

// Check AI Services
console.log('\n🤖 Checking AI Services...')
if (process.env.OPENAI_API_KEY) {
  checks.passed.push('✅ OpenAI API Key configured')
} else {
  checks.warnings.push('⚠️  OpenAI API Key missing (optional, but recommended for skill analysis)')
}

if (process.env.HUGGINGFACE_API_KEY) {
  checks.passed.push('✅ Hugging Face API Key configured')
} else {
  checks.warnings.push('⚠️  Hugging Face API Key missing (optional alternative to OpenAI)')
}

// Check Email
console.log('\n📧 Checking Email Service...')
if (process.env.RESEND_API_KEY) {
  checks.passed.push('✅ Resend API Key configured')
} else {
  checks.warnings.push('⚠️  Resend API Key missing (needed for email notifications)')
}

// Check Redis
console.log('\n🔴 Checking Redis Configuration...')
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  checks.passed.push('✅ Upstash Redis configured')
} else {
  checks.warnings.push('⚠️  Upstash Redis missing (needed for background jobs)')
}

// Summary
console.log('\n' + '='.repeat(50))
console.log('\n📊 Summary:\n')
console.log(`✅ Passed: ${checks.passed.length}`)
console.log(`⚠️  Warnings: ${checks.warnings.length}`)
console.log(`❌ Failed: ${checks.failed.length}`)

if (checks.failed.length > 0) {
  console.log('\n❌ Critical Issues:')
  checks.failed.forEach(f => console.log('  ' + f))
}

if (checks.warnings.length > 0) {
  console.log('\n⚠️  Warnings (optional but recommended):')
  checks.warnings.forEach(w => console.log('  ' + w))
}

console.log('\n' + '='.repeat(50))

if (checks.failed.length === 0) {
  console.log('\n🎉 Setup verification complete! Your HireNexa platform is ready.')
  console.log('\n📝 Next Steps:')
  console.log('  1. Run database migrations: npx supabase db push')
  console.log('  2. Deploy smart contracts: npm run deploy:alfajores')
  console.log('  3. Start development: npm run dev')
  console.log('  4. Visit: http://localhost:3000\n')
  process.exit(0)
} else {
  console.log('\n❌ Setup incomplete. Please fix the critical issues above.\n')
  process.exit(1)
}
