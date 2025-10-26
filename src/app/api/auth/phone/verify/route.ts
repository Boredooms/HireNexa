import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { phoneAuthService } from '@/lib/social-connect/phone-auth-service'

/**
 * POST /api/auth/phone/verify
 * Send verification code to phone number
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { phoneNumber } = await req.json()

    // Validate phone number
    const validation = phoneAuthService.validatePhoneNumber(phoneNumber)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check if phone already registered
    const phoneHash = phoneAuthService.hashPhoneNumber(phoneNumber)
    const { data: existingMapping } = await supabase
      .from('phone_mappings')
      .select('user_id')
      .eq('phone_hash', phoneHash)
      .single()

    if (existingMapping && existingMapping.user_id !== userId) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 400 }
      )
    }

    // Check rate limiting
    const { data: currentMapping } = await supabase
      .from('phone_mappings')
      .select('verification_attempts, last_verification_attempt')
      .eq('user_id', userId)
      .single()

    if (currentMapping) {
      const rateLimit = phoneAuthService.checkRateLimit(
        currentMapping.verification_attempts,
        new Date(currentMapping.last_verification_attempt)
      )

      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: `Too many attempts. Please wait ${rateLimit.waitTime} minutes.`,
          },
          { status: 429 }
        )
      }
    }

    // Generate verification code
    const code = phoneAuthService.generateVerificationCode()
    const codeHash = phoneAuthService.hashVerificationCode(code)

    // Encrypt phone number
    const encryptedPhone = phoneAuthService.encryptPhoneNumber(phoneNumber)

    // Generate wallet address from phone
    const { address: walletAddress } = await phoneAuthService.generateWalletFromPhone(
      phoneNumber
    )

    // Store or update phone mapping
    const { error: mappingError } = await supabase.from('phone_mappings').upsert(
      {
        user_id: userId,
        phone_hash: phoneHash,
        encrypted_phone: encryptedPhone,
        wallet_address: walletAddress,
        verification_code_hash: codeHash,
        verification_attempts: (currentMapping?.verification_attempts || 0) + 1,
        last_verification_attempt: new Date().toISOString(),
        verified: false,
      },
      { onConflict: 'user_id' }
    )

    if (mappingError) {
      console.error('Error storing phone mapping:', mappingError)
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      )
    }

    // Send SMS (in production, use actual SMS service)
    await phoneAuthService.sendVerificationSMS(phoneNumber, code)

    // For development, return code (REMOVE IN PRODUCTION!)
    const isDevelopment = process.env.NODE_ENV === 'development'

    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
      phoneDisplay: phoneAuthService.formatPhoneForDisplay(phoneNumber),
      walletAddress,
      ...(isDevelopment && { code }), // Only in development
    })
  } catch (error: any) {
    console.error('Error in POST /api/auth/phone/verify:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/auth/phone/verify
 * Verify phone number with code
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { code } = await req.json()

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    // Get phone mapping
    const { data: mapping, error: fetchError } = await supabase
      .from('phone_mappings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError || !mapping) {
      return NextResponse.json(
        { error: 'No verification in progress' },
        { status: 404 }
      )
    }

    // Verify code
    const isValid = phoneAuthService.verifyCode(code, mapping.verification_code_hash)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from('phone_mappings')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        verification_attempts: 0,
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating phone mapping:', updateError)
      return NextResponse.json(
        { error: 'Failed to verify phone' },
        { status: 500 }
      )
    }

    // Update user's wallet address
    await supabase
      .from('users')
      .update({ wallet_address: mapping.wallet_address })
      .eq('id', userId)

    return NextResponse.json({
      success: true,
      message: 'Phone verified successfully',
      walletAddress: mapping.wallet_address,
    })
  } catch (error: any) {
    console.error('Error in PUT /api/auth/phone/verify:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
