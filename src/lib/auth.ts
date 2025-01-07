import { createClient } from '@/lib/supabase/client'

export const sendPasswordResetEmail = async (email: string) => {
  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  
  if (error) {
    throw error
  }
}

export const resetPassword = async (newPassword: string) => {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw error
  }
} 