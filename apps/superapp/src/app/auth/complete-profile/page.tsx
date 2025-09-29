'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/components/providers/supabase-provider'
import { User, ArrowRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CompleteProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    phone: user?.user_metadata?.phone || '',
    address: '',
    date_of_birth: '',
    occupation: '',
  })

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Generate member ID
      const timestamp = Date.now().toString()
      const memberId = `M${timestamp.slice(-6)}`

      // Create member record
      const { error } = await supabase
        .from('members')
        .insert({
          user_id: user.id,
          member_id: memberId,
          email: user.email!,
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          date_of_birth: formData.date_of_birth || null,
          occupation: formData.occupation || null,
          status: 'pending',
          join_date: new Date().toISOString(),
        })

      if (error) {
        throw error
      }

      toast.success('Profil berhasil dibuat! Menunggu verifikasi admin.')
      router.push('/auth/account-status')
    } catch (error: any) {
      console.error('Error creating member profile:', error)
      toast.error(error.message || 'Gagal membuat profil')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-loading mx-auto mb-4"></div>
          <p className="text-neutral-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Lengkapi Profil Anda
          </h1>
          <p className="text-neutral-600">
            Isi data berikut untuk melengkapi pendaftaran sebagai anggota koperasi
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Nama Lengkap *</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div>
              <label className="form-label">Nomor Telepon *</label>
              <input
                type="tel"
                required
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Contoh: 081234567890"
              />
            </div>

            <div>
              <label className="form-label">Alamat</label>
              <textarea
                className="form-input"
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Masukkan alamat lengkap"
              />
            </div>

            <div>
              <label className="form-label">Tanggal Lahir</label>
              <input
                type="date"
                className="form-input"
                value={formData.date_of_birth}
                onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
              />
            </div>

            <div>
              <label className="form-label">Pekerjaan</label>
              <input
                type="text"
                className="form-input"
                value={formData.occupation}
                onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                placeholder="Contoh: Pegawai Swasta, Wiraswasta, dll."
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.full_name || !formData.phone}
              className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-loading mr-2"></div>
              ) : (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              {loading ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Setelah profil disimpan, akun Anda akan diverifikasi oleh admin koperasi
          </p>
        </div>
      </div>
    </div>
  )
}