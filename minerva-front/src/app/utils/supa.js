import { createClient } from "./client"

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
    const { data: { session } } = await supaClient.auth.getSession()
    const id_usuario = session?.user?.id
    if (!id_usuario) return false
    const { data } = await supaClient
        .from("permisos_usuarios")
        .select("permiso")
        .eq("id_usuario", id_usuario)
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
        .upsert({ id_usuario: userId, permiso }, { onConflict: "id_usuario, permiso" })
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
    const { data: { session } } = await supaClient.auth.getSession()
    const token = session?.access_token
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
        .select("*, assigned_to_profile:assigned_to(id, full_name, username, avatar_url), tasks_profiles(id_profile, profiles:id_profile(id, full_name, username, avatar_url))")
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
        .select("*, assigned_to_profile:assigned_to(id, full_name, username, avatar_url), tasks_profiles(id_profile, profiles:id_profile(id, full_name, username, avatar_url))")
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
 * Updates an existing task. RLS will determine if the user has permission.
 * @param {number} taskId
 * @param {object} updates - fields to update
 */
export async function updateTask(taskId, updates) {
    const { data, error } = await supaClient
        .from("tasks")
        .update(updates)
        .eq("id", taskId)
        .select("*, assigned_to_profile:assigned_to(id, full_name, username, avatar_url), tasks_profiles(id_profile, profiles:id_profile(id, full_name, username, avatar_url))")
    return { task: data?.[0] ?? null, error }
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

/**
 * Syncs the participants of a task: removes all existing and inserts the new list.
 * @param {number} taskId
 * @param {string[]} profileIds
 */
export async function syncTaskProfiles(taskId, profileIds) {
    // Delete all existing
    const { error: delError } = await supaClient
        .from("tasks_profiles")
        .delete()
        .eq("id_task", taskId)

    if (delError) return { error: delError }

    // Insert new list
    if (profileIds.length === 0) return { error: null }

    const rows = profileIds.map(pid => ({
        id_task: taskId,
        id_profile: pid
    }))

    const { error } = await supaClient
        .from("tasks_profiles")
        .insert(rows)

    return { error }
}

/**
 * Fetches the team membership for a user, including team name.
 * @param {string} userId
 * @returns {Promise<{team: object|null, error: object|null}>}
 */
export async function getUserTeam(userId) {
    const { data, error } = await supaClient
        .from("team_members")
        .select("role, teams(id, name)")
        .eq("user_id", userId)
        .maybeSingle()
    return { team: data ?? null, error: error ?? null }
}

/**
 * Fetches all team memberships for a user, including team id and name.
 * @param {string} userId
 * @returns {Promise<{teams: object[], error: object|null}>}
 */
export async function getUserTeams(userId) {
    const { data, error } = await supaClient
        .from("team_members")
        .select("role, teams(id, name)")
        .eq("user_id", userId)
    return { teams: data ?? [], error: error ?? null }
}

/**
 * Adds a user to a team.
 * @param {string} userId
 * @param {number} teamId
 * @param {string} [role="miembro"]
 */
export async function addUserTeam(userId, teamId, role = "miembro") {
    const { data, error } = await supaClient
        .from("team_members")
        .insert({ user_id: userId, team_id: teamId, role })
        .select("role, teams(id, name)")
        .single()
    return { data, error }
}

/**
 * Updates the role of a user in a team.
 * @param {string} userId
 * @param {number} teamId
 * @param {string} role
 */
export async function updateUserTeamRole(userId, teamId, role) {
    const { data, error } = await supaClient
        .from("team_members")
        .update({ role })
        .eq("user_id", userId)
        .eq("team_id", teamId)
        .select("role, teams(id, name)")
        .single()
    return { data, error }
}

/**
 * Removes a user from a team.
 * @param {string} userId
 * @param {number} teamId
 */
export async function removeUserTeam(userId, teamId) {
    const { error } = await supaClient
        .from("team_members")
        .delete()
        .eq("user_id", userId)
        .eq("team_id", teamId)
    return { error }
}

/**
 * Fetches all progresos for a given task, with creator profile info.
 * @param {number} taskId
 */
export async function getTaskProgresos(taskId) {
    const { data, error } = await supaClient
        .from("progresos")
        .select("*, profiles:created_by(full_name, username, avatar_url)")
        .eq("id_task", taskId)
        .order("created_at", { ascending: false })
    return { progresos: data ?? [], error }
}

/**
 * Fetches all non-deleted eventos, ordered by inicio (ascending).
 */
export async function getEventos() {
    const { data, error } = await supaClient
        .from("eventos")
        .select("*, eventos_usuarios(asistencia, id_usuario)")
        .eq("deleted", false)
        .order("inicio", { ascending: true })
    return { eventos: data ?? [], error }
}

/**
 * Creates a new evento and initializes attendees.
 * @param {object} eventoData 
 * @param {string[]} userIds 
 */
export async function createEvento(eventoData, userIds = []) {
    const { data: evento, error: eventoError } = await supaClient
        .from("eventos")
        .insert(eventoData)
        .select()
        .single()
    
    if (eventoError || !evento) return { evento: null, error: eventoError }

    if (userIds.length > 0) {
        const rows = userIds.map(uid => ({
            id_evento: evento.id_evento,
            id_usuario: uid,
            asistencia: 0
        }))
        const { error: asisError } = await supaClient
            .from("eventos_usuarios")
            .insert(rows)
        if (asisError) console.error("Error creating attendance rows", asisError)
    }

    return { evento, error: null }
}

/**
 * Updates an evento.
 * @param {string} id_evento 
 * @param {object} eventoData 
 * @param {string[]} userIds 
 */
export async function updateEvento(id_evento, eventoData, userIds = []) {
    const { data: evento, error: eventoError } = await supaClient
        .from("eventos")
        .update(eventoData)
        .eq("id_evento", id_evento)
        .select()
        .single()
    
    if (eventoError) return { evento: null, error: eventoError }

    // Sync users
    const { data: existing } = await supaClient
        .from("eventos_usuarios")
        .select("id_usuario")
        .eq("id_evento", id_evento)

    const existingIds = existing ? existing.map(e => e.id_usuario) : []
    const toAdd = userIds.filter(uid => !existingIds.includes(uid))
    const toRemove = existingIds.filter(uid => !userIds.includes(uid))

    if (toAdd.length > 0) {
        const rows = toAdd.map(uid => ({
            id_evento,
            id_usuario: uid,
            asistencia: 0
        }))
        await supaClient.from("eventos_usuarios").insert(rows)
    }

    if (toRemove.length > 0) {
        await supaClient.from("eventos_usuarios")
            .delete()
            .eq("id_evento", id_evento)
            .in("id_usuario", toRemove)
    }

    return { evento, error: null }
}

/**
 * Soft deletes an evento.
 * @param {string} id_evento 
 * @param {string} userId 
 */
export async function deleteEvento(id_evento, userId) {
    const { error } = await supaClient
        .from("eventos")
        .update({ deleted: true, deleted_by: userId })
        .eq("id_evento", id_evento)
    return { error }
}

/**
 * Fetches users assigned to an evento grouped by their attendance status.
 * @param {string} id_evento 
 */
export async function getEventUsers(id_evento) {
    const { data, error } = await supaClient
        .from("eventos_usuarios")
        .select("asistencia, profiles(*)")
        .eq("id_evento", id_evento)

    if (error) return { data: null, error }

    // Supabase returns profiles as an object or array. Usually object because it's a many-to-one mapping
    const confirmados = data.filter(d => d.asistencia === 1).map(d => d.profiles)
    const justificados = data.filter(d => d.asistencia === 2).map(d => d.profiles)
    const nr = data.filter(d => d.asistencia === 0).map(d => d.profiles)

    return { 
        data: { confirmados, justificados, nr }, 
        error: null 
    }
}

/**
 * Confirm user's attendance for an event.
 * @param {string} id_evento 
 * @param {string} id_usuario 
 */
export async function confirmarAsistencia(id_evento, id_usuario) {
    const { error } = await supaClient
        .from("eventos_usuarios")
        .update({ asistencia: 1 })
        .eq("id_evento", id_evento)
        .eq("id_usuario", id_usuario)
    return { error }
}

/**
 * Submit justification for absence. Upload files to storage and update db.
 * @param {string} id_evento 
 * @param {string} id_usuario 
 * @param {string} motivo 
 * @param {File[]} archivos 
 */
export async function enviarJustificacion(id_evento, id_usuario, motivo, archivos = []) {
    const uploadedUrls = []

    for (const file of archivos) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${id_evento}/${id_usuario}-${Math.random()}.${fileExt}`
        
        const { error: uploadError } = await supaClient.storage
            .from("justificaciones")
            .upload(fileName, file)
        
        if (!uploadError) {
            const { data: { publicUrl } } = supaClient.storage
                .from("justificaciones")
                .getPublicUrl(fileName)
            uploadedUrls.push(publicUrl)
        }
    }

    const { error } = await supaClient
        .from("eventos_usuarios")
        .update({ 
            asistencia: 2, 
            motivo_justificacion: motivo,
            archivos: uploadedUrls
        })
        .eq("id_evento", id_evento)
        .eq("id_usuario", id_usuario)
        
    return { error }
}

/**
 * Fetches all announcements.
 */
export async function getAnuncios() {
    const { data, error } = await supaClient
        .from('anuncios')
        .select(`
            id, fecha, titulo, cuerpo, imagen_url, created_at,
            publicado_por ( id, full_name, avatar_url )
        `)
        .order('created_at', { ascending: false })

    return { anuncios: data ?? [], error }
}

/**
 * Creates a new announcement.
 * @param {object} anuncioData
 */
export async function createAnuncio(anuncioData) {
    const { data, error } = await supaClient
        .from("anuncios")
        .insert(anuncioData)
        .select()
        .single()
    return { anuncio: data ?? null, error }
}

/**
 * Fetches attendance stats for mandatory events for a user, based on Informes structure.
 */
export async function getAsistenciaStats(userId) {
    // 1. Get mandatory events where the user is invited
    const { data: mandatoryEvents, error: eventsErr } = await supaClient
        .from("eventos_usuarios")
        .select("asistencia, eventos!inner(id_evento, obligatorio)")
        .eq("id_usuario", userId)
        .eq("eventos.obligatorio", true)

    if (eventsErr) return { stats: null, error: eventsErr }

    const mandatoryEventIds = mandatoryEvents.map(e => e.eventos.id_evento)
    if (mandatoryEventIds.length === 0) {
        return { stats: { percentage: 100, total: 0, attended: 0, justified: 0 }, error: null }
    }

    // 2. Get informes linked to those mandatory events
    const { data: informes, error: infErr } = await supaClient
        .from("informes")
        .select("id_evento, informe_asistentes(id_profile)")
        .in("id_evento", mandatoryEventIds)

    if (infErr) return { stats: null, error: infErr }

    const total = informes.length
    if (total === 0) {
        return { stats: { percentage: 100, total: 0, attended: 0, justified: 0 }, error: null }
    }

    let attended = 0
    let justified = 0

    for (const inf of informes) {
        const present = inf.informe_asistentes?.some(a => a.id_profile === userId)
        if (present) {
            attended++
        } else {
            // Check if they were justified in the event
            const eventUser = mandatoryEvents.find(e => e.eventos.id_evento === inf.id_evento)
            if (eventUser && eventUser.asistencia === 2) justified++
        }
    }

    const effectiveTotal = total - justified
    const percentage = effectiveTotal === 0 ? 100 : Math.round((attended / effectiveTotal) * 100)

    return { stats: { percentage, total, attended, justified }, error: null }
}

/**
 * Creates a new progreso entry for a task.
 * @param {number} taskId
 * @param {string} titulo
 * @param {string} [descripcion]
 */
export async function createProgreso(taskId, titulo, descripcion) {
    const { data: { session } } = await supaClient.auth.getSession()
    const userId = session?.user?.id
    if (!userId) return { progreso: null, error: { message: "No session" } }

    const { data, error } = await supaClient
        .from("progresos")
        .insert({ id_task: taskId, titulo, descripcion: descripcion || null, created_by: userId })
        .select("*, profiles:created_by(full_name, username, avatar_url)")
        .single()

    return { progreso: data ?? null, error }
}

/**
 * Attempts to mark a task as completed. Server trigger blocks if subtasks pending.
 * @param {number} taskId
 */
export async function completeTask(taskId) {
    const { data: { session } } = await supaClient.auth.getSession()
    const userId = session?.user?.id

    const { data, error } = await supaClient
        .from("tasks")
        .update({ status: "completado", last_edited_by: userId, updated_at: new Date().toISOString() })
        .eq("id", taskId)
        .select("*, assigned_to_profile:assigned_to(id, full_name, username, avatar_url), tasks_profiles(id_profile, profiles:id_profile(id, full_name, username, avatar_url))")

    return { task: data?.[0] ?? null, error }
}

/**
 * Client-side check: returns true if all subtasks of a task are completed.
 * @param {number} taskId
 */
export async function canCompleteTask(taskId) {
    const { data, error } = await supaClient
        .from("tasks")
        .select("id, status")
        .eq("desbloquea", taskId)
        .neq("status", "completado")

    if (error) return false
    return data.length === 0
}

// ── Informes (Meeting Reports) ──

/**
 * Fetches all informes with creator profile and attendee count.
 */
export async function getInformes() {
    const { data, error } = await supaClient
        .from("informes")
        .select("*, profiles:created_by(full_name, username, avatar_url), informe_asistentes(id_profile)")
        .order("fecha", { ascending: false })
    return { informes: data ?? [], error }
}

/**
 * Fetches a single informe with full attendee profiles.
 * @param {number} informeId
 */
export async function getInformeById(informeId) {
    const { data, error } = await supaClient
        .from("informes")
        .select("*, profiles:created_by(full_name, username, avatar_url), informe_asistentes(id_profile, profiles:id_profile(id, full_name, username, avatar_url))")
        .eq("id", informeId)
        .single()
    return { informe: data ?? null, error }
}

/**
 * Creates an informe, uploads PDF, and inserts attendees.
 * @param {{ titulo: string, fecha: string, tipo: string }} informeData
 * @param {File} pdfFile
 * @param {string[]} asistentesIds
 */
export async function createInforme(informeData, pdfFile, asistentesIds) {
    const { data: { session } } = await supaClient.auth.getSession()
    const userId = session?.user?.id
    if (!userId) return { informe: null, error: { message: "No session" } }

    // Upload PDF
    let pdfUrl = null
    if (pdfFile) {
        const fileName = `${Date.now()}-${pdfFile.name}`
        const { error: uploadError } = await supaClient.storage
            .from("informes")
            .upload(fileName, pdfFile)

        if (uploadError) return { informe: null, error: uploadError }

        const { data: { publicUrl } } = supaClient.storage
            .from("informes")
            .getPublicUrl(fileName)
        pdfUrl = publicUrl
    }

    // Insert informe
    const { data: informe, error: insertError } = await supaClient
        .from("informes")
        .insert({ ...informeData, pdf_url: pdfUrl, created_by: userId })
        .select()
        .single()

    if (insertError || !informe) return { informe: null, error: insertError }

    // Insert attendees
    if (asistentesIds.length > 0) {
        const rows = asistentesIds.map(pid => ({ id_informe: informe.id, id_profile: pid }))
        const { error: asisError } = await supaClient
            .from("informe_asistentes")
            .insert(rows)
        if (asisError) console.error("Error inserting attendees:", asisError)
    }

    return { informe, error: null }
}

/**
 * Deletes an informe (cascade deletes attendees).
 * @param {number} informeId
 */
export async function deleteInforme(informeId) {
    const { error } = await supaClient
        .from("informes")
        .delete()
        .eq("id", informeId)
    return { error }
}

export { supaClient }
