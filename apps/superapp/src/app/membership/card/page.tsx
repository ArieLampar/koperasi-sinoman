'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Download, Share2, QrCode, Star, Award, CreditCard,
  User, Calendar, MapPin, Phone, Mail, IdCard, Smartphone,
  Copy, CheckCircle, ExternalLink, RefreshCw, Wallet
} from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'

interface MemberData {
  id: number
  member_number: string
  full_name: string
  email: string
  phone: string
  status: string
  avatar_url?: string
  joined_date: string
  membership_level?: string
  total_savings?: number
}

export default function DigitalCardPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [memberData, setMemberData] = useState<MemberData | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isFlipped, setIsFlipped] = useState(false)
  const [sharing, setSharing] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      fetchMemberData()
    }
  }, [user])

  const fetchMemberData = async () => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
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

      // Fetch savings data for membership level calculation
      const { data: savingsData } = await supabase
        .from('savings_accounts')
        .select('balance')
        .eq('member_id', memberData.id)

      const totalSavings = savingsData?.reduce((sum, account) => sum + (account.balance || 0), 0) || 0

      // Calculate membership level
      let membershipLevel = 'Bronze'
      if (totalSavings >= 100000000) {
        membershipLevel = 'Platinum'
      } else if (totalSavings >= 50000000) {
        membershipLevel = 'Gold'
      } else if (totalSavings >= 10000000) {
        membershipLevel = 'Silver'
      }

      const enrichedMemberData: MemberData = {
        ...memberData,
        membership_level: membershipLevel,
        total_savings: totalSavings,
      }

      setMemberData(enrichedMemberData)

      // Generate QR Code
      await generateQRCode(enrichedMemberData)
    } catch (error: any) {
      console.error('Error fetching member data:', error)
      toast.error('Gagal memuat data anggota')
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async (member: MemberData) => {
    try {
      const qrData = {
        type: 'koperasi_sinoman_member',
        member_id: member.id,
        member_number: member.member_number,
        name: member.full_name,
        status: member.status,
        verified_at: new Date().toISOString(),
      }

      const qrUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 200,
        margin: 2,
        color: {
          dark: '#059669', // primary-600
          light: '#FFFFFF',
        },
      })

      setQrCodeUrl(qrUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const downloadCard = async () => {
    if (!cardRef.current) return

    try {
      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default

      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      })

      const link = document.createElement('a')
      link.download = `kartu-anggota-${memberData?.member_number || 'koperasi-sinoman'}.png`
      link.href = canvas.toDataURL()
      link.click()

      toast.success('Kartu berhasil diunduh!')
    } catch (error) {
      console.error('Error downloading card:', error)
      toast.error('Gagal mengunduh kartu')
    }
  }

  const shareCard = async () => {
    if (!memberData) return

    setSharing(true)
    try {
      const shareData = {
        title: 'Kartu Anggota Koperasi Sinoman',
        text: `${memberData.full_name} - Anggota Koperasi Sinoman`,
        url: `${window.location.origin}/membership/verify/${memberData.member_number}`,
      }

      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareData.url)
        toast.success('Link kartu berhasil disalin!')
      }
    } catch (error) {
      console.error('Error sharing card:', error)
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error('Gagal membagikan kartu')
      }
    } finally {
      setSharing(false)
    }
  }

  const copyMemberNumber = async () => {
    if (!memberData?.member_number) return

    try {
      await navigator.clipboard.writeText(memberData.member_number)
      toast.success('Nomor anggota disalin!')
    } catch (error) {
      console.error('Error copying member number:', error)
      toast.error('Gagal menyalin nomor anggota')
    }
  }

  const getMembershipLevelColor = (level?: string) => {
    switch (level) {
      case 'Platinum': return 'from-purple-500 to-purple-700'
      case 'Gold': return 'from-yellow-500 to-yellow-700'
      case 'Silver': return 'from-gray-400 to-gray-600'
      default: return 'from-orange-500 to-orange-700'
    }
  }

  const getMembershipIcon = (level?: string) => {
    switch (level) {
      case 'Platinum': return <Award className="h-6 w-6 text-white" />
      case 'Gold': return <Award className="h-6 w-6 text-white" />
      case 'Silver': return <Award className="h-6 w-6 text-white" />
      default: return <Star className="h-6 w-6 text-white" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400'
      case 'pending_verification': return 'text-yellow-400'
      case 'suspended': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'AKTIF'
      case 'pending_verification': return 'PENDING'
      case 'suspended': return 'SUSPENDED'
      default: return 'UNKNOWN'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-loading mx-auto mb-4"></div>
          <p className="text-neutral-600">Memuat kartu anggota...</p>
        </div>
      </div>
    )
  }

  if (!memberData) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="h-8 w-8 text-error-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">
            Kartu Tidak Tersedia
          </h1>
          <p className="text-neutral-600 mb-6">
            Data anggota tidak ditemukan atau belum lengkap.
          </p>
          <Link href="/membership" className="btn-primary">
            Kembali ke Profil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/membership"
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-primary-700" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-primary-900">Kartu Anggota Digital</h1>
            <p className="text-primary-700">Kartu keanggotaan resmi Koperasi Sinoman</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={downloadCard}
            className="btn-primary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Unduh Kartu
          </button>
          <button
            onClick={shareCard}
            disabled={sharing}
            className="btn-outline border-white text-primary-700 hover:bg-white hover:bg-opacity-20 flex items-center disabled:opacity-50"
          >
            {sharing ? (
              <div className="w-4 h-4 border-2 border-primary-700 border-t-transparent rounded-full animate-loading mr-2"></div>
            ) : (
              <Share2 className="h-4 w-4 mr-2" />
            )}
            Bagikan
          </button>
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="btn-outline border-white text-primary-700 hover:bg-white hover:bg-opacity-20 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isFlipped ? 'Tampak Depan' : 'Tampak Belakang'}
          </button>
        </div>

        {/* Digital Card */}
        <div className="flex justify-center mb-8">
          <div className="perspective-1000">
            <div
              ref={cardRef}
              className={`relative w-96 h-60 transition-transform duration-700 transform-style-preserve-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front Side */}
              <div className="absolute inset-0 w-full h-full backface-hidden">
                <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${getMembershipLevelColor(memberData.membership_level)} p-6 text-white shadow-2xl relative overflow-hidden`}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 right-4 w-32 h-32 border-2 border-white rounded-full"></div>
                    <div className="absolute bottom-4 left-4 w-20 h-20 border-2 border-white rounded-full"></div>
                  </div>

                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                      <h3 className="text-lg font-bold">KOPERASI SINOMAN</h3>
                      <p className="text-sm opacity-90">Kartu Anggota Digital</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getMembershipIcon(memberData.membership_level)}
                      <span className="text-sm font-medium">{memberData.membership_level}</span>
                    </div>
                  </div>

                  {/* Member Photo & Basic Info */}
                  <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center overflow-hidden">
                      {memberData.avatar_url ? (
                        <img
                          src={memberData.avatar_url}
                          alt={memberData.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold">{memberData.full_name}</h4>
                      <p className="text-sm opacity-90">No. Anggota: {memberData.member_number}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex justify-between items-end relative z-10">
                    <div>
                      <p className="text-xs opacity-75">Status Keanggotaan</p>
                      <p className={`text-sm font-bold ${getStatusColor(memberData.status)}`}>
                        {getStatusText(memberData.status)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-75">Bergabung</p>
                      <p className="text-sm font-medium">
                        {new Date(memberData.joined_date).toLocaleDateString('id-ID', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Chip simulation */}
                  <div className="absolute bottom-6 right-6 w-8 h-6 bg-white bg-opacity-30 rounded-sm"></div>
                </div>
              </div>

              {/* Back Side */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 p-6 text-white shadow-2xl relative overflow-hidden">
                  {/* QR Code Section */}
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="bg-white p-4 rounded-lg mb-4">
                      {qrCodeUrl && (
                        <img
                          src={qrCodeUrl}
                          alt="QR Code"
                          className="w-32 h-32"
                        />
                      )}
                    </div>
                    <h4 className="text-lg font-bold mb-2">Kode Verifikasi</h4>
                    <p className="text-sm text-center opacity-90 mb-4">
                      Scan QR code ini untuk verifikasi keanggotaan
                    </p>
                    <div className="text-center">
                      <p className="text-xs opacity-75">Nomor Anggota</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-lg">{memberData.member_number}</p>
                        <button
                          onClick={copyMemberNumber}
                          className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Member Details */}
          <div className="card">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Detail Anggota</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <IdCard className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-600">Nomor Anggota</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-medium text-neutral-900">{memberData.member_number}</p>
                    <button
                      onClick={copyMemberNumber}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-600">Tanggal Bergabung</p>
                  <p className="font-medium text-neutral-900">
                    {new Date(memberData.joined_date).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-600">Total Simpanan</p>
                  <p className="font-medium text-neutral-900">
                    Rp {(memberData.total_savings || 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Features */}
          <div className="card">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Fitur Kartu</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-success-50 rounded-lg">
                <QrCode className="h-5 w-5 text-success-600" />
                <div>
                  <p className="font-medium text-success-900">QR Code Verification</p>
                  <p className="text-sm text-success-700">Verifikasi keanggotaan dengan QR code</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-info-50 rounded-lg">
                <Smartphone className="h-5 w-5 text-info-600" />
                <div>
                  <p className="font-medium text-info-900">Digital Wallet Ready</p>
                  <p className="text-sm text-info-700">Simpan di Apple Wallet atau Google Pay</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-warning-50 rounded-lg">
                <Share2 className="h-5 w-5 text-warning-600" />
                <div>
                  <p className="font-medium text-warning-900">Shareable Link</p>
                  <p className="text-sm text-warning-700">Bagikan untuk verifikasi pihak ketiga</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Penting untuk Diperhatikan</h3>
          <div className="space-y-3 text-sm text-neutral-600">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
              <p>
                Kartu anggota digital ini memiliki validitas yang sama dengan kartu fisik dan dapat digunakan
                untuk semua transaksi koperasi.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
              <p>
                QR code pada kartu berisi informasi terenkripsi dan aman untuk verifikasi identitas anggota.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
              <p>
                Jangan membagikan nomor anggota atau QR code kepada pihak yang tidak berwenang.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
              <p>
                Laporkan segera ke customer service jika kartu digital Anda disalahgunakan.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }

        /* Enhanced animations */
        @keyframes cardGlow {
          0%, 100% { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
          50% { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
        }

        .card-container:hover .card-face {
          animation: cardGlow 2s ease-in-out infinite;
        }

        /* Offline indicator pulse */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .offline-indicator {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}