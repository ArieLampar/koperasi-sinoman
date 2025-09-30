import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Types
interface CartItem {
  product_id: string
  quantity: number
}

interface UpdateCartRequest {
  items: CartItem[]
}

export async function GET(request: NextRequest) {
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

    // Fetch cart items with product details
    const { data: cartItems, error } = await supabase
      .from('marketplace_cart')
      .select(`
        *,
        product:marketplace_products(
          id,
          name,
          slug,
          price,
          member_price,
          images,
          stock,
          is_flash_sale,
          flash_sale_price,
          flash_sale_end,
          store:marketplace_stores(
            id,
            name,
            location
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cart:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cart' },
        { status: 500 }
      )
    }

    // Filter out items where product is null (deleted products)
    const validCartItems = cartItems?.filter(item => item.product) || []

    // Clean up invalid cart items
    if (cartItems && cartItems.length !== validCartItems.length) {
      const invalidItems = cartItems.filter(item => !item.product)
      if (invalidItems.length > 0) {
        await supabase
          .from('marketplace_cart')
          .delete()
          .in('id', invalidItems.map(item => item.id))
      }
    }

    // Transform cart items to include computed fields
    const transformedItems = validCartItems.map(item => ({
      ...item,
      current_price: item.product.is_flash_sale && item.product.flash_sale_price
        ? item.product.flash_sale_price
        : item.product.price,
      subtotal: (item.product.is_flash_sale && item.product.flash_sale_price
        ? item.product.flash_sale_price
        : item.product.price) * item.quantity
    }))

    return NextResponse.json({
      data: transformedItems,
      count: transformedItems.length,
      total_amount: transformedItems.reduce((sum, item) => sum + item.subtotal, 0)
    })

  } catch (error) {
    console.error('Error in cart GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const { product_id, quantity } = body

    // Validate input
    if (!product_id || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Product ID and valid quantity are required' },
        { status: 400 }
      )
    }

    // Check if product exists and is available
    const { data: product, error: productError } = await supabase
      .from('marketplace_products')
      .select('id, name, stock, status')
      .eq('id', product_id)
      .eq('status', 'active')
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found or not available' },
        { status: 404 }
      )
    }

    // Check stock availability
    if (product.stock < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Check if item already exists in cart
    const { data: existingItem, error: existingError } = await supabase
      .from('marketplace_cart')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing cart item:', existingError)
      return NextResponse.json(
        { error: 'Failed to check cart' },
        { status: 500 }
      )
    }

    let cartItem

    if (existingItem) {
      // Update existing item
      const newQuantity = existingItem.quantity + quantity

      // Check total stock availability
      if (product.stock < newQuantity) {
        return NextResponse.json(
          { error: 'Insufficient stock for requested quantity' },
          { status: 400 }
        )
      }

      const { data, error } = await supabase
        .from('marketplace_cart')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating cart item:', error)
        return NextResponse.json(
          { error: 'Failed to update cart' },
          { status: 500 }
        )
      }

      cartItem = data
    } else {
      // Add new item
      const { data, error } = await supabase
        .from('marketplace_cart')
        .insert({
          user_id: user.id,
          product_id,
          quantity,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding cart item:', error)
        return NextResponse.json(
          { error: 'Failed to add to cart' },
          { status: 500 }
        )
      }

      cartItem = data
    }

    return NextResponse.json({ data: cartItem }, { status: 201 })

  } catch (error) {
    console.error('Error in cart POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const body: UpdateCartRequest = await request.json()

    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      )
    }

    // Clear existing cart
    await supabase
      .from('marketplace_cart')
      .delete()
      .eq('user_id', user.id)

    // Add new items
    if (body.items.length > 0) {
      const cartItems = body.items.map(item => ({
        user_id: user.id,
        product_id: item.product_id,
        quantity: item.quantity,
        created_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from('marketplace_cart')
        .insert(cartItems)
        .select()

      if (error) {
        console.error('Error updating cart:', error)
        return NextResponse.json(
          { error: 'Failed to update cart' },
          { status: 500 }
        )
      }

      return NextResponse.json({ data })
    }

    return NextResponse.json({ data: [] })

  } catch (error) {
    console.error('Error in cart PUT API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')

    if (productId) {
      // Delete specific item
      const { error } = await supabase
        .from('marketplace_cart')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)

      if (error) {
        console.error('Error deleting cart item:', error)
        return NextResponse.json(
          { error: 'Failed to delete cart item' },
          { status: 500 }
        )
      }
    } else {
      // Clear entire cart
      const { error } = await supabase
        .from('marketplace_cart')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error('Error clearing cart:', error)
        return NextResponse.json(
          { error: 'Failed to clear cart' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ message: 'Cart updated successfully' })

  } catch (error) {
    console.error('Error in cart DELETE API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}