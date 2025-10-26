/**
 * Role Consistency Fix Script
 * 
 * This script fixes inconsistent role and flag values in the database.
 * Run this after deploying the code changes to sync existing users.
 * 
 * Usage:
 *   node scripts/fix-roles.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixRoleConsistency() {
  console.log('🔧 Starting role consistency fix...\n')

  try {
    // Fetch all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, is_admin, is_recruiter')

    if (error) {
      throw error
    }

    console.log(`📊 Found ${users.length} users to check\n`)

    let fixedCount = 0
    const fixes = []

    for (const user of users) {
      const issues = []
      const updates = {}

      // Check admin consistency
      if (user.role === 'admin') {
        if (!user.is_admin) {
          issues.push('is_admin should be true')
          updates.is_admin = true
        }
        if (!user.is_recruiter) {
          issues.push('is_recruiter should be true (admins have recruiter access)')
          updates.is_recruiter = true
        }
      }

      // Check recruiter consistency
      if (user.role === 'recruiter') {
        if (!user.is_recruiter) {
          issues.push('is_recruiter should be true')
          updates.is_recruiter = true
        }
        if (user.is_admin) {
          issues.push('is_admin should be false (not an admin)')
          updates.is_admin = false
        }
      }

      // Check student consistency
      if (user.role === 'student') {
        if (user.is_admin) {
          issues.push('is_admin should be false')
          updates.is_admin = false
        }
        if (user.is_recruiter) {
          issues.push('is_recruiter should be false')
          updates.is_recruiter = false
        }
      }

      // Check verifier consistency
      if (user.role === 'verifier') {
        if (user.is_admin) {
          issues.push('is_admin should be false')
          updates.is_admin = false
        }
        if (user.is_recruiter) {
          issues.push('is_recruiter should be false')
          updates.is_recruiter = false
        }
      }

      // Check flag-based role mismatches
      if (user.is_admin && user.role !== 'admin') {
        issues.push('role should be admin (is_admin is true)')
        updates.role = 'admin'
        updates.is_recruiter = true
      }

      if (user.is_recruiter && user.role === 'student' && !user.is_admin) {
        issues.push('role should be recruiter (is_recruiter is true)')
        updates.role = 'recruiter'
      }

      // Apply fixes if needed
      if (Object.keys(updates).length > 0) {
        console.log(`\n🔍 User: ${user.email} (${user.id})`)
        console.log(`   Current: role='${user.role}', is_admin=${user.is_admin}, is_recruiter=${user.is_recruiter}`)
        console.log(`   Issues: ${issues.join(', ')}`)
        console.log(`   Fixing: ${JSON.stringify(updates)}`)

        const { error: updateError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id)

        if (updateError) {
          console.error(`   ❌ Error updating user: ${updateError.message}`)
        } else {
          console.log(`   ✅ Fixed!`)
          fixedCount++
          fixes.push({
            email: user.email,
            before: { role: user.role, is_admin: user.is_admin, is_recruiter: user.is_recruiter },
            after: { ...user, ...updates }
          })
        }
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`\n✅ Role consistency fix completed!`)
    console.log(`   Total users checked: ${users.length}`)
    console.log(`   Users fixed: ${fixedCount}`)
    console.log(`   Users already consistent: ${users.length - fixedCount}`)

    if (fixes.length > 0) {
      console.log('\n📋 Summary of fixes:')
      fixes.forEach(fix => {
        console.log(`\n   ${fix.email}`)
        console.log(`   Before: role='${fix.before.role}', is_admin=${fix.before.is_admin}, is_recruiter=${fix.before.is_recruiter}`)
        console.log(`   After:  role='${fix.after.role}', is_admin=${fix.after.is_admin}, is_recruiter=${fix.after.is_recruiter}`)
      })
    }

    console.log('\n' + '='.repeat(60))

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the fix
fixRoleConsistency()
  .then(() => {
    console.log('\n✨ Done! Your users now have consistent roles.\n')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
