'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Upload, FileText, Camera, Eye, Download, Trash2,
  CheckCircle, AlertCircle, Clock, XCircle, Shield, Info,
  RefreshCw, Send, User, IdCard, FileImage, DollarSign
} from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'
import toast from 'react-hot-toast'

interface KYCDocument {
  id: string
  type: 'id_document' | 'selfie_document' | 'income_document'
  file_name: string
  file_url: string
  file_size: number
  upload_date: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  verified_date?: string
}

interface MemberKYC {
  id: number
  kyc_status: 'pending' | 'verified' | 'rejected' | 'expired'
  kyc_documents: any
  verification_notes?: string
  verified_at?: string
  expires_at?: string
}

const DOCUMENT_TYPES = {
  id_document: {
    title: 'Foto KTP/Identitas',
    description: 'Upload foto KTP, SIM, atau Paspor yang masih berlaku',
    icon: IdCard,
    required: true,
    maxSize: '5MB',
    formats: ['JPG', 'PNG', 'PDF']
  },
  selfie_document: {
    title: 'Foto Selfie dengan KTP',
    description: 'Upload foto selfie sambil memegang KTP/identitas',
    icon: Camera,
    required: true,
    maxSize: '5MB',
    formats: ['JPG', 'PNG']
  },
  income_document: {
    title: 'Dokumen Penghasilan',
    description: 'Upload slip gaji, SPT, atau bukti penghasilan (opsional)',
    icon: DollarSign,
    required: false,
    maxSize: '10MB',
    formats: ['JPG', 'PNG', 'PDF']
  }
}

export default function KYCPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [memberData, setMemberData] = useState<MemberKYC | null>(null)
  const [documents, setDocuments] = useState<KYCDocument[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { file: File; preview: string }>>({})

  useEffect(() => {
    if (user) {
      fetchKYCData()
    }
  }, [user])

  const fetchKYCData = async () => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, kyc_status, kyc_documents, verification_notes, verified_at, expires_at')
        .eq('user_id', user?.id)
        .single()

      if (memberError) {
        if (memberError.code === 'PGRST116') {
          toast.error('Profil anggota tidak ditemukan')
          router.push('/membership')
          return
        }
        throw memberError
      }

      setMemberData(memberData)

      // Parse existing documents from kyc_documents JSON
      if (memberData.kyc_documents) {
        const parsedDocs: KYCDocument[] = []

        Object.entries(memberData.kyc_documents).forEach(([type, path]) => {
          if (path && typeof path === 'string') {
            // Get public URL for the document
            const { data: urlData } = supabase.storage
              .from('kyc-documents')
              .getPublicUrl(path)

            parsedDocs.push({
              id: `${type}-${Date.now()}`,
              type: type as KYCDocument['type'],
              file_name: path.split('/').pop() || '',
              file_url: urlData.publicUrl,
              file_size: 0, // We don't store file size in the current schema
              upload_date: memberData.created_at || new Date().toISOString(),
              status: memberData.kyc_status === 'verified' ? 'approved' :
                      memberData.kyc_status === 'rejected' ? 'rejected' : 'pending',
              verified_date: memberData.verified_at,
            })
          }
        })

        setDocuments(parsedDocs)
      }
    } catch (error: any) {
      console.error('Error fetching KYC data:', error)
      toast.error('Gagal memuat data KYC')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = useCallback(async (file: File, type: string) => {
    if (!file) return

    const docType = DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES]
    if (!docType) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Format file tidak didukung. Gunakan ${docType.formats.join(', ')}.`)
      return
    }

    // Validate file size
    const maxSizeBytes = type === 'income_document' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast.error(`Ukuran file maksimal ${docType.maxSize}`)
      return
    }

    // Create preview for images
    let preview = ''
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file)
    }

    setUploadedFiles(prev => ({
      ...prev,
      [type]: { file, preview }
    }))

    toast.success(`${docType.title} siap untuk diupload`)
  }, [])

  const removeFile = (type: string) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev }
      if (newFiles[type]?.preview) {
        URL.revokeObjectURL(newFiles[type].preview)
      }
      delete newFiles[type]
      return newFiles
    })
  }

  const uploadDocument = async (type: string, file: File) => {
    setUploading(type)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${type}-${Date.now()}.${fileExt}`
      const filePath = `${user?.id}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      return uploadData.path
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error)
      throw new Error(`Gagal upload ${DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES]?.title}`)
    } finally {
      setUploading(null)
    }
  }

  const submitKYC = async () => {
    // Validate required documents
    const requiredDocs = Object.entries(DOCUMENT_TYPES)
      .filter(([_, config]) => config.required)
      .map(([type, _]) => type)

    const missingDocs = requiredDocs.filter(type =>
      !uploadedFiles[type] && !documents.find(doc => doc.type === type)
    )

    if (missingDocs.length > 0) {
      const missingTitles = missingDocs.map(type =>
        DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES]?.title
      ).join(', ')
      toast.error(`Dokumen wajib belum lengkap: ${missingTitles}`)
      return
    }

    setSubmitting(true)

    try {
      const documentUrls: Record<string, string> = { ...memberData?.kyc_documents }

      // Upload new files
      for (const [type, fileData] of Object.entries(uploadedFiles)) {
        if (fileData?.file) {
          const uploadPath = await uploadDocument(type, fileData.file)
          documentUrls[type] = uploadPath
        }
      }

      // Update member KYC data
      const { error } = await supabase
        .from('members')
        .update({
          kyc_documents: documentUrls,
          kyc_status: 'pending',
          verification_notes: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id)

      if (error) throw error

      // Clear uploaded files
      Object.values(uploadedFiles).forEach(fileData => {
        if (fileData.preview) {
          URL.revokeObjectURL(fileData.preview)
        }
      })
      setUploadedFiles({})

      toast.success('Dokumen KYC berhasil disubmit untuk review!')
      await fetchKYCData() // Refresh data

    } catch (error: any) {
      console.error('Error submitting KYC:', error)
      toast.error(error.message || 'Gagal submit dokumen KYC')
    } finally {
      setSubmitting(false)
    }
  }

  const downloadDocument = async (documentUrl: string, fileName: string) => {
    try {
      const response = await fetch(documentUrl)
      const blob = await response.blob()

      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = fileName
      link.click()

      URL.revokeObjectURL(link.href)
      toast.success('File berhasil diunduh!')
    } catch (error) {
      console.error('Error downloading document:', error)
      toast.error('Gagal mengunduh file')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-success-600 bg-success-100'
      case 'pending': return 'text-warning-600 bg-warning-100'
      case 'rejected': return 'text-error-600 bg-error-100'
      case 'expired': return 'text-neutral-600 bg-neutral-100'
      default: return 'text-neutral-600 bg-neutral-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-5 w-5" />
      case 'pending': return <Clock className="h-5 w-5" />
      case 'rejected': return <XCircle className="h-5 w-5" />
      case 'expired': return <AlertCircle className="h-5 w-5" />
      default: return <AlertCircle className="h-5 w-5" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Terverifikasi'
      case 'pending': return 'Menunggu Review'
      case 'rejected': return 'Ditolak'
      case 'expired': return 'Kedaluwarsa'
      default: return 'Belum Submit'
    }
  }

  const canEditDocuments = memberData?.kyc_status !== 'verified'

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-loading mx-auto mb-4"></div>
          <p className="text-neutral-600">Memuat data KYC...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/membership"
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Verifikasi KYC</h1>
            <p className="text-neutral-600">Kelola dokumen dan status verifikasi identitas</p>
          </div>
        </div>

        {/* KYC Status Overview */}
        <div className="card mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Status Verifikasi KYC</h3>
                <p className="text-neutral-600">Verifikasi identitas untuk keamanan akun</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(memberData?.kyc_status || 'pending')}`}>
                {getStatusIcon(memberData?.kyc_status || 'pending')}
                {getStatusText(memberData?.kyc_status || 'pending')}
              </div>
              {memberData?.verified_at && (
                <p className="text-xs text-neutral-500 mt-1">
                  Diverifikasi: {new Date(memberData.verified_at).toLocaleDateString('id-ID')}
                </p>
              )}
            </div>
          </div>

          {/* Status Details */}
          {memberData?.kyc_status === 'rejected' && memberData.verification_notes && (
            <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg">
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-error-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-error-900">Dokumen Ditolak</p>
                  <p className="text-sm text-error-700 mt-1">{memberData.verification_notes}</p>
                </div>
              </div>
            </div>
          )}

          {memberData?.kyc_status === 'verified' && (
            <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-success-900">Verifikasi Berhasil</p>
                  <p className="text-sm text-success-700 mt-1">
                    Identitas Anda telah terverifikasi. Semua layanan koperasi dapat diakses penuh.
                  </p>
                </div>
              </div>
            </div>
          )}

          {memberData?.kyc_status === 'pending' && (
            <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-warning-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-warning-900">Sedang Diproses</p>
                  <p className="text-sm text-warning-700 mt-1">
                    Dokumen KYC Anda sedang direview oleh tim verifikasi. Proses ini biasanya memakan waktu 1-3 hari kerja.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Document Upload/Management */}
        <div className="space-y-6">
          {Object.entries(DOCUMENT_TYPES).map(([type, config]) => {
            const existingDoc = documents.find(doc => doc.type === type)
            const uploadedFile = uploadedFiles[type]
            const Icon = config.icon

            return (
              <div key={type} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        {config.title}
                        {config.required && <span className="text-error-500 ml-1">*</span>}
                      </h3>
                      <p className="text-sm text-neutral-600">{config.description}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Format: {config.formats.join(', ')} • Maksimal: {config.maxSize}
                      </p>
                    </div>
                  </div>

                  {existingDoc && (
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(existingDoc.status)}`}>
                      {getStatusIcon(existingDoc.status)}
                      {getStatusText(existingDoc.status)}
                    </div>
                  )}
                </div>

                {/* Existing Document */}
                {existingDoc && (
                  <div className="p-4 bg-neutral-50 rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-neutral-400" />
                        <div>
                          <p className="font-medium text-neutral-900">{existingDoc.file_name}</p>
                          <p className="text-sm text-neutral-600">
                            Diupload: {new Date(existingDoc.upload_date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(existingDoc.file_url, '_blank')}
                          className="btn-ghost text-primary-600 hover:text-primary-700 p-2"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadDocument(existingDoc.file_url, existingDoc.file_name)}
                          className="btn-ghost text-neutral-600 hover:text-neutral-700 p-2"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload New Document */}
                {canEditDocuments && (
                  <div>
                    {uploadedFile ? (
                      <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {uploadedFile.preview ? (
                              <img
                                src={uploadedFile.preview}
                                alt="Preview"
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            ) : (
                              <FileText className="h-5 w-5 text-primary-600" />
                            )}
                            <div>
                              <p className="font-medium text-primary-900">{uploadedFile.file.name}</p>
                              <p className="text-sm text-primary-700">
                                {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(type)}
                            className="text-error-600 hover:text-error-700 p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                        <div className="space-y-2">
                          <Upload className="mx-auto h-12 w-12 text-neutral-400" />
                          <div>
                            <label className="cursor-pointer">
                              <span className="text-primary-600 font-medium hover:text-primary-700">
                                Upload {config.title}
                              </span>
                              <input
                                type="file"
                                className="sr-only"
                                accept={type === 'income_document' ? 'image/*,.pdf' : 'image/*'}
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], type)}
                                disabled={uploading === type}
                              />
                            </label>
                          </div>
                          <p className="text-xs text-neutral-500">
                            Atau drag and drop file ke sini
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!canEditDocuments && !existingDoc && (
                  <div className="p-4 bg-neutral-50 rounded-lg text-center">
                    <p className="text-neutral-600">Dokumen belum diupload</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Submit Button */}
        {canEditDocuments && Object.keys(uploadedFiles).length > 0 && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={submitKYC}
              disabled={submitting || uploading !== null}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-loading mr-2"></div>
              ) : (
                <Send className="h-5 w-5 mr-2" />
              )}
              {submitting ? 'Mengirim...' : 'Submit untuk Review'}
            </button>
          </div>
        )}

        {/* KYC Information */}
        <div className="card mt-8">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            <Info className="h-5 w-5 inline mr-2" />
            Informasi Verifikasi KYC
          </h3>
          <div className="space-y-3 text-sm text-neutral-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-neutral-900 mb-2">Dokumen Yang Diperlukan:</h4>
                <ul className="space-y-1">
                  <li>• Foto KTP/SIM/Paspor yang jelas dan masih berlaku</li>
                  <li>• Foto selfie sambil memegang KTP/identitas</li>
                  <li>• Dokumen penghasilan (opsional, untuk limit yang lebih tinggi)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-neutral-900 mb-2">Tips Upload Dokumen:</h4>
                <ul className="space-y-1">
                  <li>• Pastikan foto jelas dan tidak buram</li>
                  <li>• Semua text pada dokumen dapat terbaca</li>
                  <li>• Hindari pantulan cahaya atau bayangan</li>
                  <li>• Gunakan pencahayaan yang cukup</li>
                </ul>
              </div>
            </div>
            <div className="pt-3 border-t border-neutral-200">
              <h4 className="font-medium text-neutral-900 mb-2">Proses Verifikasi:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-neutral-50 rounded-lg">
                  <Upload className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                  <p className="font-medium">1. Upload Dokumen</p>
                  <p className="text-xs">Submit dokumen yang diperlukan</p>
                </div>
                <div className="text-center p-3 bg-neutral-50 rounded-lg">
                  <Clock className="h-6 w-6 text-warning-600 mx-auto mb-2" />
                  <p className="font-medium">2. Review Tim</p>
                  <p className="text-xs">Verifikasi oleh tim KYC (1-3 hari)</p>
                </div>
                <div className="text-center p-3 bg-neutral-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-success-600 mx-auto mb-2" />
                  <p className="font-medium">3. Selesai</p>
                  <p className="text-xs">Akses penuh ke semua layanan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}