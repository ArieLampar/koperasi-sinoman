import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface Props {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: order, error } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        items:marketplace_order_items(
          *,
          product:marketplace_products(
            name,
            image,
            slug,
            store:marketplace_stores(
              id,
              name,
              location
            )
          )
        )
      `)
      .eq('id', params.id)
      .eq('user_id', user.id) // Ensure user can only access their own orders
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      console.error('Error fetching order:', error)
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: order })

  } catch (error) {
    console.error('Error in order GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Check if order exists and belongs to user
    const { data: existingOrder, error: fetchError } = await supabase
      .from('marketplace_orders')
      .select('id, status, payment_status')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      console.error('Error fetching order:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      )
    }

    // Update order
    const { data: order, error } = await supabase
      .from('marketplace_orders')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating order:', error)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: order })

  } catch (error) {
    console.error('Error in order PATCH API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if order exists and belongs to user
    const { data: existingOrder, error: fetchError } = await supabase
      .from('marketplace_orders')
      .select('id, status, payment_status')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      console.error('Error fetching order:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      )
    }

    // Only allow cancellation if order is still pending
    if (existingOrder.status !== 'pending' || existingOrder.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Cannot cancel order that has been paid or is being processed' },
        { status: 400 }
      )
    }

    // Update order status to cancelled instead of deleting
    const { data: order, error } = await supabase
      .from('marketplace_orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error cancelling order:', error)
      return NextResponse.json(
        { error: 'Failed to cancel order' },
        { status: 500 }
      )
    }

    // Restore product stock
    const { data: orderItems, error: itemsError } = await supabase
      .from('marketplace_order_items')
      .select('product_id, quantity')
      .eq('order_id', params.id)

    if (!itemsError && orderItems) {
      for (const item of orderItems) {
        await supabase.rpc('increase_product_stock', {
          product_id: item.product_id,
          quantity: item.quantity
        })
      }
    }

    return NextResponse.json({ data: order })

  } catch (error) {
    console.error('Error in order DELETE API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}