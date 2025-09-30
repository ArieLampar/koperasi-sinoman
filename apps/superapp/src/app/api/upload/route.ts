import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CloudinaryService, fileToCloudinaryFile, CloudinaryError } from '@koperasi-sinoman/integrations/cloudinary'

// =============================================================================
// CONFIGURATION
// =============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const cloudinary = new CloudinaryService()

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface UploadContext {
  userId: string
  uploadType: 'product' | 'profile' | 'document' | 'general'
  productId?: string
  folder?: string
  tags?: string[]
}

interface UploadResponse {
  success: boolean
  data?: {
    id: string
    url: string
    publicId: string
    originalFilename: string
    format: string
    size: number
    width?: number
    height?: number
    uploadType: string
    createdAt: string
  }
  error?: string
  code?: string
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

const validateAuthentication = async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED')
  }

  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new Error('INVALID_TOKEN')
  }

  return user
}

const validateFile = (file: File): void => {
  // File size validation (max 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('FILE_TOO_LARGE')
  }

  // File type validation
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  const allowedTypes = [...allowedImageTypes, ...allowedDocumentTypes]

  if (!allowedTypes.includes(file.type)) {
    throw new Error('INVALID_FILE_TYPE')
  }

  // Filename validation
  if (!file.name || file.name.length > 255) {
    throw new Error('INVALID_FILENAME')
  }
}

const validateUploadPermissions = async (userId: string, uploadType: string, productId?: string) => {
  // Check user permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_verified')
    .eq('id', userId)
    .single()

  if (!profile) {
    throw new Error('USER_NOT_FOUND')
  }

  // Product uploads require seller verification or ownership
  if (uploadType === 'product') {
    if (!productId) {
      throw new Error('PRODUCT_ID_REQUIRED')
    }

    // Check if user owns the product or is admin
    const { data: product } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', productId)
      .single()

    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND')
    }

    if (product.seller_id !== userId && profile.role !== 'admin') {
      throw new Error('INSUFFICIENT_PERMISSIONS')
    }
  }

  // Document uploads require verification
  if (uploadType === 'document' && !profile.is_verified) {
    throw new Error('VERIFICATION_REQUIRED')
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getUploadContext = (formData: FormData, userId: string): UploadContext => {
  const uploadType = (formData.get('uploadType') as string) || 'general'
  const productId = formData.get('productId') as string
  const customFolder = formData.get('folder') as string
  const customTags = formData.get('tags') as string

  // Generate folder path based on upload type
  let folder = customFolder || 'koperasi-sinoman'
  if (uploadType === 'product') {
    folder = `${folder}/products`
  } else if (uploadType === 'profile') {
    folder = `${folder}/profiles`
  } else if (uploadType === 'document') {
    folder = `${folder}/documents`
  }

  // Generate tags
  const tags = customTags ? customTags.split(',').map(tag => tag.trim()) : []
  tags.push(uploadType, userId)
  if (productId) tags.push(`product-${productId}`)

  return {
    userId,
    uploadType: uploadType as any,
    productId,
    folder,
    tags
  }
}

const logUploadActivity = async (
  userId: string,
  uploadContext: UploadContext,
  result: any,
  success: boolean,
  error?: string
) => {
  try {
    await supabase
      .from('upload_logs')
      .insert({
        user_id: userId,
        upload_type: uploadContext.uploadType,
        product_id: uploadContext.productId,
        file_url: success ? result.url : null,
        public_id: success ? result.publicId : null,
        file_size: success ? result.bytes : null,
        success,
        error_message: error,
        metadata: {
          folder: uploadContext.folder,
          tags: uploadContext.tags,
          original_filename: success ? result.originalFilename : null
        }
      })
  } catch (logError) {
    console.error('Failed to log upload activity:', logError)
  }
}

// =============================================================================
// MAIN UPLOAD HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Validate authentication
    const user = await validateAuthentication(request)

    // 2. Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided', code: 'NO_FILE' },
        { status: 400 }
      )
    }

    // 3. Get upload context
    const uploadContext = getUploadContext(formData, user.id)

    // 4. Validate file
    validateFile(file)

    // 5. Validate permissions
    await validateUploadPermissions(user.id, uploadContext.uploadType, uploadContext.productId)

    // 6. Convert file to Cloudinary format
    const cloudinaryFile = await fileToCloudinaryFile(file)

    // 7. Upload to Cloudinary
    const uploadResult = await cloudinary.uploadFromBuffer(
      cloudinaryFile.buffer!,
      {
        folder: uploadContext.folder,
        tags: uploadContext.tags,
        useFilename: true,
        uniqueFilename: true,
        overwrite: false,
        context: {
          userId: user.id,
          uploadType: uploadContext.uploadType,
          ...(uploadContext.productId && { productId: uploadContext.productId })
        }
      }
    )

    // 8. Save upload record to database
    const { data: uploadRecord, error: dbError } = await supabase
      .from('file_uploads')
      .insert({
        id: uploadResult.publicId,
        user_id: user.id,
        upload_type: uploadContext.uploadType,
        product_id: uploadContext.productId,
        file_url: uploadResult.url,
        public_id: uploadResult.publicId,
        original_filename: uploadResult.originalFilename,
        file_size: uploadResult.bytes,
        file_format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        metadata: {
          folder: uploadContext.folder,
          tags: uploadContext.tags,
          resourceType: uploadResult.resourceType,
          signature: uploadResult.signature
        }
      })
      .select()
      .single()

    if (dbError) {
      // If database save fails, try to clean up Cloudinary upload
      try {
        await cloudinary.deleteFile(uploadResult.publicId)
      } catch (cleanupError) {
        console.error('Failed to cleanup Cloudinary file:', cleanupError)
      }
      throw new Error('DATABASE_ERROR')
    }

    // 9. Log upload activity
    await logUploadActivity(user.id, uploadContext, uploadResult, true)

    // 10. Return success response
    const response: UploadResponse = {
      success: true,
      data: {
        id: uploadRecord.id,
        url: uploadRecord.file_url,
        publicId: uploadRecord.public_id,
        originalFilename: uploadRecord.original_filename || file.name,
        format: uploadRecord.file_format,
        size: uploadRecord.file_size,
        width: uploadRecord.width,
        height: uploadRecord.height,
        uploadType: uploadRecord.upload_type,
        createdAt: uploadRecord.created_at
      }
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error('Upload error:', error)

    // Log failed upload attempt
    try {
      const formData = await request.formData().catch(() => new FormData())
      const uploadContext = getUploadContext(formData, 'unknown')
      await logUploadActivity('unknown', uploadContext, null, false, error.message)
    } catch (logError) {
      console.error('Failed to log upload error:', logError)
    }

    // Handle specific error types
    let statusCode = 500
    let errorCode = 'INTERNAL_ERROR'
    let errorMessage = 'An unexpected error occurred'

    if (error instanceof CloudinaryError) {
      statusCode = 400
      errorCode = 'CLOUDINARY_ERROR'
      errorMessage = error.message
    } else {
      switch (error.message) {
        case 'UNAUTHORIZED':
        case 'INVALID_TOKEN':
          statusCode = 401
          errorCode = error.message
          errorMessage = 'Authentication required'
          break
        case 'USER_NOT_FOUND':
        case 'PRODUCT_NOT_FOUND':
          statusCode = 404
          errorCode = error.message
          errorMessage = 'Resource not found'
          break
        case 'INSUFFICIENT_PERMISSIONS':
        case 'VERIFICATION_REQUIRED':
          statusCode = 403
          errorCode = error.message
          errorMessage = 'Insufficient permissions'
          break
        case 'FILE_TOO_LARGE':
          statusCode = 413
          errorCode = error.message
          errorMessage = 'File size exceeds 10MB limit'
          break
        case 'INVALID_FILE_TYPE':
          statusCode = 415
          errorCode = error.message
          errorMessage = 'Invalid file type. Only images and documents are allowed'
          break
        case 'INVALID_FILENAME':
        case 'PRODUCT_ID_REQUIRED':
          statusCode = 400
          errorCode = error.message
          errorMessage = 'Invalid request parameters'
          break
        case 'DATABASE_ERROR':
          statusCode = 500
          errorCode = error.message
          errorMessage = 'Database operation failed'
          break
      }
    }

    const response: UploadResponse = {
      success: false,
      error: errorMessage,
      code: errorCode
    }

    return NextResponse.json(response, { status: statusCode })
  }
}

// =============================================================================
// GET HANDLER - Retrieve upload information
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // 1. Validate authentication
    const user = await validateAuthentication(request)

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const uploadId = searchParams.get('id')
    const uploadType = searchParams.get('type')
    const productId = searchParams.get('productId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 3. Build query
    let query = supabase
      .from('file_uploads')
      .select('*')
      .eq('user_id', user.id)

    if (uploadId) {
      query = query.eq('id', uploadId)
    }

    if (uploadType) {
      query = query.eq('upload_type', uploadType)
    }

    if (productId) {
      query = query.eq('product_id', productId)
    }

    // 4. Execute query
    const { data: uploads, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error('DATABASE_ERROR')
    }

    // 5. Return results
    return NextResponse.json({
      success: true,
      data: uploads || [],
      pagination: {
        limit,
        offset,
        total: uploads?.length || 0
      }
    })

  } catch (error: any) {
    console.error('Get uploads error:', error)

    let statusCode = 500
    let errorMessage = 'Failed to retrieve uploads'

    if (error.message === 'UNAUTHORIZED' || error.message === 'INVALID_TOKEN') {
      statusCode = 401
      errorMessage = 'Authentication required'
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}

// =============================================================================
// DELETE HANDLER - Remove uploaded file
// =============================================================================

export async function DELETE(request: NextRequest) {
  try {
    // 1. Validate authentication
    const user = await validateAuthentication(request)

    // 2. Parse request body
    const { uploadId, publicId } = await request.json()

    if (!uploadId && !publicId) {
      return NextResponse.json(
        { success: false, error: 'Upload ID or Public ID required' },
        { status: 400 }
      )
    }

    // 3. Get upload record
    let query = supabase
      .from('file_uploads')
      .select('*')
      .eq('user_id', user.id)

    if (uploadId) {
      query = query.eq('id', uploadId)
    } else {
      query = query.eq('public_id', publicId)
    }

    const { data: upload, error: fetchError } = await query.single()

    if (fetchError || !upload) {
      return NextResponse.json(
        { success: false, error: 'Upload not found' },
        { status: 404 }
      )
    }

    // 4. Delete from Cloudinary
    try {
      await cloudinary.deleteFile(upload.public_id)
    } catch (cloudinaryError) {
      console.error('Cloudinary deletion failed:', cloudinaryError)
      // Continue with database deletion even if Cloudinary fails
    }

    // 5. Delete from database
    const { error: deleteError } = await supabase
      .from('file_uploads')
      .delete()
      .eq('id', upload.id)

    if (deleteError) {
      throw new Error('DATABASE_ERROR')
    }

    // 6. Log deletion activity
    await logUploadActivity(
      user.id,
      {
        userId: user.id,
        uploadType: upload.upload_type,
        productId: upload.product_id,
        folder: upload.metadata?.folder,
        tags: upload.metadata?.tags
      },
      null,
      true
    )

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Delete upload error:', error)

    let statusCode = 500
    let errorMessage = 'Failed to delete upload'

    if (error.message === 'UNAUTHORIZED' || error.message === 'INVALID_TOKEN') {
      statusCode = 401
      errorMessage = 'Authentication required'
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}