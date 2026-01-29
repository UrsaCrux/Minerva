"use client"
import { redirect } from 'next/navigation'
import Perfil from './perfil'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_dbUrl, process.env.NEXT_PUBLIC_dbKey)

async function signInUser(user, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: user + "@ursacrux.cl",
    password: password,
  })

  if (error) {
    console.error('Login error:', error.message)
    alert("Credenciales Incorrectas")
    return null
  } else {
    console.log('User logged in successfully:', data)
    Perfil().setToken(data.session.access_token, data.user.id)
    redirect("/")
    return data.user
  }
}

async function changePassword(newUser, newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
    email: newUser + "@ursacrux.cl"
  })
  if (error) {
    console.error('Password change error:', error.message)
    alert("Error al cambiar la contraseña")
    return null
  } else {
    console.log('Password changed successfully:', data.user)
    alert("Contraseña cambiada exitosamente")
    return data.user
  }
}

async function signOutUser() {
  await supabase.auth.signOut()
}

export {
  signInUser,
  changePassword,
  signOutUser
}