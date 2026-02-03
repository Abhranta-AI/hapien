import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'

// Initialize Razorpay lazily to avoid build errors
let razorpay: Razorpay | null = null
function getRazorpay() {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
  }
  return razorpay
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, currency = 'INR', payment_type, reference_id, metadata = {} } = body

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!payment_type || !['hangout', 'subscription', 'feature'].includes(payment_type)) {
      return NextResponse.json(
        { error: 'Invalid payment type' },
        { status: 400 }
      )
    }

    // Create Razorpay order
    const options = {
      amount: amount, // amount in paisa
      currency,
      receipt: `hapien_${Date.now()}`,
      notes: {
        user_id: user.id,
        payment_type,
        reference_id: reference_id || '',
      },
    }

    const order = await getRazorpay().orders.create(options)

    // Store order in database
    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        amount,
        currency,
        payment_type,
        reference_id: reference_id || null,
        metadata,
        status: 'pending',
      })

    if (dbError) {
      console.error('Error storing payment:', dbError)
      // Don't fail the request, the payment can still proceed
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      key: process.env.RAZORPAY_KEY_ID,
    })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    )
  }
}
