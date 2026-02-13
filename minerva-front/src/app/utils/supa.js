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

/**
 * Uploads an avatar image to storage and updates the user profile.
 * @param {string} userId 
 * @param {File} file 
 */
export async function uploadAvatar(userId, file) {
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}-${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    // Upload image to storage
    const { error: uploadError } = await supaClient.storage
        .from("avatars")
        .upload(filePath, file)

    if (uploadError) {
        return { error: uploadError }
    }

    // Get public URL
    const { data: { publicUrl } } = supaClient.storage
        .from("avatars")
        .getPublicUrl(filePath)

    // Update profile
    const { error: updateError } = await supaClient
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId)

    return { publicUrl, error: updateError }
}

/**
 * Fetches tasks where the user is assigned or related via tasks_profiles.
 * @param {string} userId 
 */
export async function getMyTasks(userId) {
    // 1. Tasks assigned to user
    const { data: assignedTasks, error: assignedError } = await supaClient
        .from("tasks")
        .select("*")
        .eq("assigned_to", userId)

    if (assignedError) return { tasks: [], error: assignedError }

    // 2. Tasks where user is in tasks_profiles
    const { data: relatedTasksData, error: relatedError } = await supaClient
        .from("tasks_profiles")
        .select("id_task, tasks(*)")
        .eq("id_profile", userId)

    if (relatedError) return { tasks: [], error: relatedError }

    // Extract task objects from relatedTasksData
    const relatedTasks = relatedTasksData.map(item => item.tasks).filter(Boolean)

    // Merge and deduplicate
    const allTasks = [...assignedTasks, ...relatedTasks]
    const uniqueTasks = Array.from(new Map(allTasks.map(task => [task.id, task])).values())

    // Sort by due_date (ascending), then created_at
    uniqueTasks.sort((a, b) => {
        const dateA = new Date(a.due_date || a.created_at)
        const dateB = new Date(b.due_date || b.created_at)
        return dateA - dateB
    })

    return { tasks: uniqueTasks, error: null }
}

/**
 * Fetches all teams.
 */
export async function getTeams() {
    const { data, error } = await supaClient
        .from("teams")
        .select("*")
        .order("id")
    return { teams: data ?? [], error }
}

/**
 * Fetches tasks that are "Goals" (have no unlocking task above them, i.e., desbloquea is NULL).
 */
export async function getGoalTasks() {
    const { data, error } = await supaClient
        .from("tasks")
        .select("*")
        .is("desbloquea", null)
        .order("created_at")
    return { tasks: data ?? [], error }
}

/**
 * Fetches tasks that unlock a specific task (prerequisites).
 * @param {number} unlockedTaskId 
 */
export async function getPrerequisiteTasks(unlockedTaskId) {
    const { data, error } = await supaClient
        .from("tasks")
        .select("*")
        .eq("desbloquea", unlockedTaskId)
        .order("created_at")
    return { tasks: data ?? [], error }
}

/**
 * Creates a new task.
 * @param {object} taskData
 */
export async function createTask(taskData) {
    const { data, error } = await supaClient
        .from("tasks")
        .insert(taskData)
        .select()
        .single()
    return { task: data, error }
}

/**
 * Adds multiple profiles to a task (tasks_profiles).
 * @param {number} taskId
 * @param {string[]} profileIds
 */
export async function addProfilesToTask(taskId, profileIds) {
    if (!profileIds || profileIds.length === 0) return { error: null }

    const rows = profileIds.map(pid => ({
        id_task: taskId,
        id_profile: pid
    }))

    const { error } = await supaClient
        .from("tasks_profiles")
        .insert(rows)

    return { error }
}

export { supaClient }
