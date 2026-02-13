import { createClient } from "./client"
import Perfil from "./perfil"

const supaClient = createClient()

/**
 * Fetches the current authenticated user's profile from Supabase Auth.
 * @returns {Promise<{user: object|null, error: object|null}>}
 */
export async function getUserProfile() {
    const { data, error } = await supaClient.auth.getUser()
    return { user: data?.user ?? null, error: error ?? null }
}

/**
 * Fetches a profile row from the profiles table by user id.
 * @param {string} userId
 * @returns {Promise<{profile: object|null, error: object|null}>}
 */
export async function getProfileById(userId) {
    const { data, error } = await supaClient
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()
    return { profile: data ?? null, error: error ?? null }
}

/**
 * Updates a profile row in the profiles table.
 * @param {string} userId
 * @param {object} updates - fields to update (e.g. { username, last_login })
 * @returns {Promise<{profile: object|null, error: object|null}>}
 */
export async function updateProfile(userId, updates) {
    const { data, error } = await supaClient
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single()
    return { profile: data ?? null, error: error ?? null }
}

/**
 * Checks if the current user has a specific permiso.
 * @param {number} permiso
 * @returns {Promise<boolean>}
 */
export async function hasPermiso(permiso) {
    const { data } = await supaClient
        .from("permisos_usuarios")
        .select("permiso")
        .eq("id_usuario", Perfil().getToken()?.id_usuario)
        .eq("permiso", permiso)
        .maybeSingle()
    return !!data
}

/**
 * Fetches all profiles.
 */
export async function getAllProfiles() {
    const { data, error } = await supaClient
        .from("profiles")
        .select("*")
        .order("full_name")
    return { profiles: data ?? [], error }
}

/**
 * Fetches all rows from permisos_usuarios.
 */
export async function getPermisosUsuarios() {
    const { data, error } = await supaClient
        .from("permisos_usuarios")
        .select("*")
    return { permisos: data ?? [], error }
}

/**
 * Inserts a permiso for a user.
 */
export async function setPermisoUsuario(userId, permiso) {
    const { data, error } = await supaClient
        .from("permisos_usuarios")
        .upsert({ id_usuario: userId, permiso }, { onConflict: "permiso" })
        .select()
    return { data, error }
}

/**
 * Deletes a permiso for a user.
 */
export async function deletePermisoUsuario(userId, permiso) {
    const { error } = await supaClient
        .from("permisos_usuarios")
        .delete()
        .eq("id_usuario", userId)
        .eq("permiso", permiso)
    return { error }
}

/**
 * Fetches all tasks.
 */
export async function getAllTasks() {
    const { data, error } = await supaClient
        .from("tasks")
        .select("*")
        .order("created_at")
    return { tasks: data ?? [], error }
}

/**
 * Creates a new user via the create-user Edge Function.
 * @param {string} username
 * @param {string} password
 * @param {string} [full_name]
 * @param {string} [email]
 */
export async function createUser(username, password, full_name, email) {
    const token = Perfil().getToken()?.token
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_dbUrl}/functions/v1/create-user`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                "apikey": process.env.NEXT_PUBLIC_dbKey,
            },
            body: JSON.stringify({ username, password, full_name, email }),
        }
    )
    const data = await res.json()
    if (!res.ok) {
        return { user: null, error: data.error || "Error al crear usuario" }
    }
    return { user: data.user, error: null }
}

export { supaClient }
