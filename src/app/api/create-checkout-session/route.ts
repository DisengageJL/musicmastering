import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    const { priceType, trackInfo, successUrl, cancelUrl } = await request.json();

    console.log('🔐 Creating Stripe checkout session for:', priceType);

    let priceData;
    let mode: 'payment' | 'subscription';

    if (priceType === 'single') {
      // One-time payment for single track
      mode = 'payment';
      priceData = {
        currency: 'usd',
        product_data: {
          name: `AI Audio Mastering - ${trackInfo?.name || 'Single Track'}`,
          description: `Professional mastering using ${trackInfo?.preset || 'AI'} preset`,
          metadata: {
            productId: process.env.STRIPE_SINGLE_PRODUCT_ID!,
          },
        },
        unit_amount: 500, // $5.00 in cents
      };
    } else {
      // Subscription for unlimited
      mode = 'subscription';
      priceData = {
        currency: 'usd',
        product_data: {
          name: 'MasterAI - Unlimited Monthly',
          description: 'Unlimited AI audio mastering with premium features',
          metadata: {
            productId: process.env.STRIPE_MONTHLY_PRODUCT_ID!,
          },
        },
        unit_amount: 1500, // $15.00 in cents
        recurring: {
          interval: 'month',
        },
      };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode,
      line_items: [
        {
          price_data: priceData,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        priceType,
        trackName: trackInfo?.name || '',
        preset: trackInfo?.preset || '',
        mode: trackInfo?.mode || '',
        hasReference: trackInfo?.hasReference ? 'true' : 'false',
      },
      // For subscriptions, you might want to add customer email collection
      ...(mode === 'subscription' && {
        customer_email: undefined, // Let user enter email
        allow_promotion_codes: true,
      }),
    });

    console.log('✅ Stripe checkout session created:', session.id);

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('❌ Stripe checkout session creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({
    message: 'Stripe checkout API is running',
    timestamp: new Date().toISOString(),
    products: {
      single: process.env.STRIPE_SINGLE_PRODUCT_ID,
      monthly: process.env.STRIPE_MONTHLY_PRODUCT_ID,
    },
  });
}