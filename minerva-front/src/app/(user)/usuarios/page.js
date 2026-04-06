"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, IconButton, Chip, CircularProgress, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    FormControl, InputLabel, Select, MenuItem
} from "@mui/material"
import { MdEdit, MdAdd, MdDelete } from "react-icons/md"
import {
    hasPermiso, getAllProfiles, getPermisosUsuarios,
    updateProfile, setPermisoUsuario, deletePermisoUsuario, createUser,
    getTeams, getUserTeams, addUserTeam, removeUserTeam, updateUserTeamRole
} from "../../utils/supa"

const PERMISOS_MAP = {
    1: "Editar usuarios",
    2: "Crear eventos en calendario",
    3: "Control sobre tareas",
    4: "Gestionar informes",
    5: "Crear anuncios",
}

export default function UsuariosPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [profiles, setProfiles] = useState([])
    const [permisos, setPermisos] = useState([])

    // Edit profile dialog
    const [editOpen, setEditOpen] = useState(false)
    const [editUser, setEditUser] = useState(null)
    const [editFullName, setEditFullName] = useState("")
    const [editUsername, setEditUsername] = useState("")
    const [editEmail, setEditEmail] = useState("")

    // Teams
    const [allTeams, setAllTeams] = useState([])
    const [editUserTeams, setEditUserTeams] = useState([])
    const [editSelectedTeam, setEditSelectedTeam] = useState("")
    const [editSelectedRole, setEditSelectedRole] = useState("miembro")
    // teamId -> "" (closed) | "editing" (role select open)
    const [editingRoleFor, setEditingRoleFor] = useState(null)

    // Permiso dialog
    const [permisoOpen, setPermisoOpen] = useState(false)
    const [permisoUser, setPermisoUser] = useState(null)
    const [selectedPermiso, setSelectedPermiso] = useState("")

    // Create user dialog
    const [createOpen, setCreateOpen] = useState(false)
    const [newUser, setNewUser] = useState("")
    const [newPass, setNewPass] = useState("")
    const [newFullName, setNewFullName] = useState("")
    const [newEmail, setNewEmail] = useState("")
    const [createError, setCreateError] = useState("")
    const [createLoading, setCreateLoading] = useState(false)

    useEffect(() => {
        async function init() {
            const allowed = await hasPermiso(1)
            if (!allowed) {
                router.replace("/")
                return
            }
            await loadData()
        }
        init()
    }, [router])

    async function loadData() {
        setLoading(true)
        const [profilesRes, permisosRes, teamsRes] = await Promise.all([
            getAllProfiles(),
            getPermisosUsuarios(),
            getTeams(),
        ])
        setProfiles(profilesRes.profiles)
        setPermisos(permisosRes.permisos)
        setAllTeams(teamsRes.teams)
        setLoading(false)
    }

    function getUserPermisos(userId) {
        return permisos.filter(p => p.id_usuario === userId)
    }

    // Edit profile handlers
    async function openEdit(user) {
        setEditUser(user)
        setEditFullName(user.full_name || "")
        setEditUsername(user.username || "")
        setEditEmail(user.email || "")
        setEditSelectedTeam("")
        const { teams } = await getUserTeams(user.id)
        setEditUserTeams(teams)
        setEditOpen(true)
    }

    async function handleEditSave() {
        await updateProfile(editUser.id, {
            full_name: editFullName,
            username: editUsername,
            email: editEmail,
        })
        setEditOpen(false)
        await loadData()
    }

    // Team handlers for edit dialog
    const ROLES = ["miembro", "lider", "subcomandante", "comandante"]

    async function handleAddTeam() {
        if (!editSelectedTeam || !editUser) return
        await addUserTeam(editUser.id, Number(editSelectedTeam), editSelectedRole)
        const { teams } = await getUserTeams(editUser.id)
        setEditUserTeams(teams)
        setEditSelectedTeam("")
        setEditSelectedRole("miembro")
    }

    async function handleUpdateTeamRole(teamId, newRole) {
        if (!editUser) return
        await updateUserTeamRole(editUser.id, teamId, newRole)
        const { teams } = await getUserTeams(editUser.id)
        setEditUserTeams(teams)
        setEditingRoleFor(null)
    }

    async function handleRemoveTeam(teamId) {
        if (!editUser) return
        await removeUserTeam(editUser.id, teamId)
        const { teams } = await getUserTeams(editUser.id)
        setEditUserTeams(teams)
    }

    // Permiso handlers
    function openAddPermiso(user) {
        setPermisoUser(user)
        setSelectedPermiso("")
        setPermisoOpen(true)
    }

    async function handleAddPermiso() {
        if (!selectedPermiso) return
        await setPermisoUsuario(permisoUser.id, Number(selectedPermiso))
        setPermisoOpen(false)
        await loadData()
    }

    async function handleDeletePermiso(userId, permiso) {
        if (!confirm(`¿Eliminar el permiso "${PERMISOS_MAP[permiso]}"?`)) return
        await deletePermisoUsuario(userId, permiso)
        await loadData()
    }

    // Create user handlers
    function openCreate() {
        setNewUser("")
        setNewPass("")
        setNewFullName("")
        setNewEmail("")
        setCreateError("")
        setCreateOpen(true)
    }

    async function handleCreate() {
        setCreateError("")
        if (!newUser || !newPass) {
            setCreateError("Todos los campos son requeridos")
            return
        }
        if (newPass.length < 8) {
            setCreateError("La contraseña debe tener al menos 8 caracteres")
            return
        }
        setCreateLoading(true)
        const { error } = await createUser(newUser, newPass, newFullName || undefined, newEmail || undefined)
        setCreateLoading(false)
        if (error) {
            setCreateError(typeof error === "string" ? error : error.message || "Error al crear usuario")
            return
        }
        setCreateOpen(false)
        await loadData()
    }

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                <CircularProgress />
            </div>
        )
    }

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Gestión de Usuarios
                </Typography>
                <Button variant="outlined" startIcon={<MdAdd />} onClick={openCreate}>
                    Crear Usuario
                </Button>
            </div>

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 'calc(100vh - 180px)', overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow sx={{ '& th': { backgroundColor: 'var(--surface)' } }}>
                            <TableCell><strong>Nombre completo</strong></TableCell>
                            <TableCell><strong>Username</strong></TableCell>
                            <TableCell><strong>Email</strong></TableCell>
                            <TableCell><strong>Permisos</strong></TableCell>
                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {profiles.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.full_name || "—"}</TableCell>
                                <TableCell>{user.username || "—"}</TableCell>
                                <TableCell>{user.email || "—"}</TableCell>
                                <TableCell>
                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                                        {getUserPermisos(user.id).map(p => (
                                            <Chip
                                                key={p.permiso}
                                                label={PERMISOS_MAP[p.permiso] || `Permiso ${p.permiso}`}
                                                size="small"
                                                onDelete={() => handleDeletePermiso(user.id, p.permiso)}
                                            />
                                        ))}
                                        <IconButton size="small" onClick={() => openAddPermiso(user)} title="Agregar permiso">
                                            <MdAdd size={16} />
                                        </IconButton>
                                    </div>
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton size="small" onClick={() => openEdit(user)} title="Editar perfil">
                                        <MdEdit size={18} />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit profile dialog */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Editar perfil</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
                    <TextField
                        label="Nombre completo"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        variant="standard"
                        size="small"
                    />
                    <TextField
                        label="Username"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        variant="standard"
                        size="small"
                    />
                    <TextField
                        label="Email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        variant="standard"
                        size="small"
                    />

                    {/* Team editing */}
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5 }}>
                        Equipos
                    </Typography>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                        {editUserTeams.length === 0 && (
                            <Typography variant="body2" color="text.secondary">Sin equipos asignados</Typography>
                        )}
                        {editUserTeams.map(tm => (
                            <div key={tm.teams.id} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                                {editingRoleFor === tm.teams.id ? (
                                    <>
                                        <Chip
                                            label={tm.teams.name}
                                            size="small"
                                            onDelete={() => handleRemoveTeam(tm.teams.id)}
                                        />
                                        <FormControl variant="standard" size="small" sx={{ minWidth: 120 }}>
                                            <Select
                                                value={tm.role}
                                                onChange={(e) => handleUpdateTeamRole(tm.teams.id, e.target.value)}
                                                autoFocus
                                                onClose={() => setEditingRoleFor(null)}
                                            >
                                                {ROLES.map(r => (
                                                    <MenuItem key={r} value={r}>{r}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </>
                                ) : (
                                    <Chip
                                        key={tm.teams.id}
                                        label={`${tm.teams.name} · ${tm.role}`}
                                        size="small"
                                        onClick={() => setEditingRoleFor(tm.teams.id)}
                                        onDelete={() => handleRemoveTeam(tm.teams.id)}
                                        title="Clic para cambiar rol"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                        <FormControl variant="standard" size="small" sx={{ flex: 1 }}>
                            <InputLabel>Agregar equipo</InputLabel>
                            <Select
                                value={editSelectedTeam}
                                onChange={(e) => setEditSelectedTeam(e.target.value)}
                            >
                                {allTeams
                                    .filter(t => !editUserTeams.some(ut => ut.teams.id === t.id))
                                    .map(t => (
                                        <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                        <FormControl variant="standard" size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Rol</InputLabel>
                            <Select
                                value={editSelectedRole}
                                onChange={(e) => setEditSelectedRole(e.target.value)}
                            >
                                {ROLES.map(r => (
                                    <MenuItem key={r} value={r}>{r}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button size="small" onClick={handleAddTeam} disabled={!editSelectedTeam}>
                            Agregar
                        </Button>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
                    <Button variant="outlined" onClick={handleEditSave}>Guardar</Button>
                </DialogActions>
            </Dialog>

            {/* Add permiso dialog */}
            <Dialog open={permisoOpen} onClose={() => setPermisoOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Agregar permiso</DialogTitle>
                <DialogContent sx={{ pt: "16px !important" }}>
                    <FormControl fullWidth variant="standard" size="small">
                        <InputLabel>Permiso</InputLabel>
                        <Select
                            value={selectedPermiso}
                            onChange={(e) => setSelectedPermiso(e.target.value)}
                        >
                            {Object.entries(PERMISOS_MAP).map(([key, label]) => (
                                <MenuItem key={key} value={key}>{label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPermisoOpen(false)}>Cancelar</Button>
                    <Button variant="outlined" onClick={handleAddPermiso}>Agregar</Button>
                </DialogActions>
            </Dialog>

            {/* Create user dialog */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Crear Usuario</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
                    <TextField
                        label="Nombre completo"
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        variant="standard"
                        size="small"
                    />
                    <TextField
                        label="Username"
                        value={newUser}
                        onChange={(e) => setNewUser(e.target.value)}
                        variant="standard"
                        size="small"
                        helperText="Se creará como username@ursacrux.cl"
                    />
                    <TextField
                        label="Email personal"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        variant="standard"
                        size="small"
                    />
                    <TextField
                        label="Contraseña"
                        type="password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        variant="standard"
                        size="small"
                        helperText="Mínimo 8 caracteres"
                    />
                    {createError && (
                        <Typography color="error" variant="body2">{createError}</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
                    <Button variant="outlined" onClick={handleCreate} disabled={createLoading}>
                        {createLoading ? <CircularProgress size={20} /> : "Crear"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}
