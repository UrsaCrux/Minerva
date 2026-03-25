"use client"
import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { getGoalTasks, getPrerequisiteTasks, getTeams, createTask, updateTask, hasPermiso, getAllProfiles, addProfilesToTask, syncTaskProfiles, getTaskProgresos } from "../utils/supa"
import { MdAdd, MdClose, MdVisibility, MdEdit } from "react-icons/md"
import Perfil from "../utils/perfil"
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../tareas.css';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Chip, OutlinedInput, Box, CircularProgress } from "@mui/material"

// Hardcoded colors for teams (since teams table doesn't have color column)
const TEAM_COLORS = {
    1: "#f87171", // Red
    2: "#60a5fa", // Blue
    3: "#facc15", // Yellow
    4: "#4ade80", // Green
    5: "#c084fc", // Purple
    default: "#94a3b8" // Gray
}

// Priority color bands
const PRIORITY_COLORS = {
    "1": "#ef4444", // Alta - Red
    "2": "#f97316", // Media - Orange
    "3": "#eab308", // Baja - Yellow
    default: "#cbd5e1" // Sin prioridad - Light gray
}

function getPriorityBorder(priority) {
    const color = PRIORITY_COLORS[String(priority)] || PRIORITY_COLORS.default
    return `10px solid ${color}`
}

function getInitials(name) {
    if (!name) return "?"
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

// Collect unique profiles from assigned_to + tasks_profiles
function getTaskAvatars(task) {
    const map = new Map()
    if (task.assigned_to_profile) {
        const p = task.assigned_to_profile
        map.set(p.id, p)
    }
    if (task.tasks_profiles) {
        task.tasks_profiles.forEach(tp => {
            const p = tp.profiles
            if (p && !map.has(p.id)) map.set(p.id, p)
        })
    }
    return Array.from(map.values())
}

// ── Custom Node Component ──
function TaskNode({ data }) {
    const [hovered, setHovered] = useState(false)
    const [showProgresos, setShowProgresos] = useState(false)
    const [progresos, setProgresos] = useState([])
    const [loadingProgresos, setLoadingProgresos] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const hoverTimeout = useRef(null)

    const task = data.task
    const avatars = getTaskAvatars(task)
    const MAX_AVATARS = 4

    const bgColor = TEAM_COLORS[task.team_id] || TEAM_COLORS.default

    function handleMouseEnter() {
        clearTimeout(hoverTimeout.current)
        setHovered(true)
    }

    function handleMouseLeave() {
        hoverTimeout.current = setTimeout(() => setHovered(false), 200)
    }

    async function handleViewDetails(e) {
        e.stopPropagation()
        setHovered(false)
        setShowProgresos(true)
        setLoadingProgresos(true)
        const { progresos: data } = await getTaskProgresos(task.id)
        setProgresos(data)
        setLoadingProgresos(false)
    }

    function handleEdit(e) {
        e.stopPropagation()
        setHovered(false)
        setShowEditModal(true)
    }

    return (
        <>
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            <div
                className="flowchart_node"
                style={{
                    background: bgColor,
                    borderLeft: getPriorityBorder(task.priority),
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className="flowchart_node_title">{task.title}</div>
                {avatars.length > 0 && (
                    <div className="flowchart_node_avatars">
                        {avatars.slice(0, MAX_AVATARS).map(p => (
                            <div key={p.id} className="flowchart_avatar" title={p.full_name || p.username || "Usuario"}>
                                {p.avatar_url ? (
                                    <img src={p.avatar_url} alt={p.full_name || "Avatar"} />
                                ) : (
                                    getInitials(p.full_name || p.username)
                                )}
                            </div>
                        ))}
                        {avatars.length > MAX_AVATARS && (
                            <div className="flowchart_avatar_more">
                                +{avatars.length - MAX_AVATARS}
                            </div>
                        )}
                    </div>
                )}

                {/* Hover Tooltip */}
                {hovered && (
                    <div
                        className="flowchart_tooltip"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <button className="flowchart_tooltip_edit_icon" onClick={handleEdit} title="Editar tarea">
                            <MdEdit size={14} />
                        </button>
                        <div className="flowchart_tooltip_title">{task.title}</div>
                        {task.description && (
                            <div className="flowchart_tooltip_desc">{task.description}</div>
                        )}
                        <div className="flowchart_tooltip_assigned">
                            <span>Asignado a:</span>
                            <strong>
                                {task.assigned_to_profile
                                    ? (task.assigned_to_profile.full_name || task.assigned_to_profile.username)
                                    : "Sin asignar"
                                }
                            </strong>
                        </div>
                        <Button variant="outlined" color="primary" className="flowchart_tooltip_tn" onClick={handleViewDetails}>
                            Ver Detalles
                        </Button>
                    </div>
                )}
            </div>
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

            {/* Progresos Dialog */}
            {showProgresos && (
                <ProgresosDialog
                    task={task}
                    progresos={progresos}
                    loading={loadingProgresos}
                    onClose={() => setShowProgresos(false)}
                />
            )}

            {/* Edit Task Dialog */}
            {showEditModal && (
                <EditTaskModal
                    task={task}
                    teams={data.teams || []}
                    profiles={data.profiles || []}
                    onClose={() => setShowEditModal(false)}
                    onUpdated={(updatedTask) => {
                        setShowEditModal(false)
                        if (data.onTaskUpdated) data.onTaskUpdated(updatedTask)
                    }}
                />
            )}
        </>
    )
}

// ── Progresos Dialog ──
function ProgresosDialog({ task, progresos, loading, onClose }) {
    return (
        <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Progresos — {task.title}</span>
                <MdClose style={{ cursor: "pointer", fontSize: "1.2rem" }} onClick={onClose} />
            </DialogTitle>
            <DialogContent>
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
                        <CircularProgress size={32} />
                    </div>
                ) : progresos.length === 0 ? (
                    <div className="progreso_empty">No hay progresos registrados.</div>
                ) : (
                    <div className="progreso_list">
                        {progresos.map(p => (
                            <div key={p.id} className="progreso_card">
                                <div className="progreso_card_title">{p.titulo || "Sin título"}</div>
                                {p.descripcion && (
                                    <div className="progreso_card_desc">{p.descripcion}</div>
                                )}
                                <div className="progreso_card_meta">
                                    <div className="progreso_card_author">
                                        {p.profiles?.avatar_url && (
                                            <img src={p.profiles.avatar_url} alt="" />
                                        )}
                                        <span>{p.profiles?.full_name || p.profiles?.username || "Usuario"}</span>
                                    </div>
                                    <span>{new Date(p.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
            <DialogActions style={{ padding: "12px 24px" }}>
                <Button onClick={onClose} variant="outlined" color="inherit">Cerrar</Button>
            </DialogActions>
        </Dialog>
    )
}

// Define nodeTypes outside the component to prevent React re-renders
const nodeTypes = { taskNode: TaskNode }

export default function TaskFlowchart() {
    const [tasks, setTasks] = useState([])
    const [teams, setTeams] = useState([])
    const [selectedTask, setSelectedTask] = useState(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [canCreateGoal, setCanCreateGoal] = useState(false)
    const [isCreatingGoal, setIsCreatingGoal] = useState(false)
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [profiles, setProfiles] = useState([])

    // Load initial data
    useEffect(() => {
        loadInitialData()
        checkPermissions()
    }, [])

    async function checkPermissions() {
        const has = await hasPermiso(3)
        setCanCreateGoal(has)
    }

    function handleTaskUpdated(updatedTask) {
        // Update the node data in-place so the flowchart reflects the edit
        setNodes(nds => nds.map(n => {
            if (n.id === updatedTask.id.toString()) {
                return {
                    ...n,
                    data: { ...n.data, label: updatedTask.title, task: updatedTask },
                }
            }
            return n
        }))
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
    }

    function buildNode(task, position, teamsData, profilesData) {
        return {
            id: task.id.toString(),
            type: 'taskNode',
            position,
            data: {
                label: task.title,
                task,
                teams: teamsData || teams,
                profiles: profilesData || profiles,
                onTaskUpdated: handleTaskUpdated
            },
        }
    }

    async function loadInitialData() {
        const { teams: loadedTeams } = await getTeams()
        setTeams(loadedTeams)

        const { profiles: loadedProfiles } = await getAllProfiles()
        setProfiles(loadedProfiles)

        const { tasks: goals } = await getGoalTasks()
        setTasks(goals)

        // Map goals to nodes — pass loaded data directly since state hasn't updated yet
        const initialNodes = goals.map((task, index) => buildNode(task, { x: index * 250, y: 0 }, loadedTeams, loadedProfiles))
        setNodes(initialNodes)
    }

    const onNodesChange = useCallback(
        (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
        [],
    );
    const onEdgesChange = useCallback(
        (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
        [],
    );
    const onConnect = useCallback(
        (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
        [],
    );

    const onNodeClick = async (event, node) => {
        const task = node.data.task
        if (!task) return
        setSelectedTask(task)

        // Fetch prerequisites
        const { tasks: prereqs } = await getPrerequisiteTasks(task.id)
        if (!prereqs || prereqs.length === 0) return

        setNodes((nds) => {
            const newNodes = []

            // Check which prereqs are already in the graph
            prereqs.forEach((p, idx) => {
                if (nds.find(n => n.id === p.id.toString())) {
                    return
                }

                // Position new nodes BELOW the target
                newNodes.push(buildNode(p, {
                    x: node.position.x + (idx * 220) - ((prereqs.length - 1) * 110),
                    y: node.position.y + 150
                }))
            })
            return [...nds, ...newNodes]
        })

        setEdges((eds) => {
            const newEdges = []
            prereqs.forEach(p => {
                const edgeId = `${p.id}-${task.id}`
                if (!eds.find(e => e.id === edgeId)) {
                    newEdges.push({
                        id: edgeId,
                        source: task.id.toString(),
                        target: p.id.toString(),
                        animated: true
                    })
                }
            })
            return [...eds, ...newEdges]
        })

        // Also update local tasks state for the chart context
        setTasks(prev => {
            const newTasks = [...prev]
            prereqs.forEach(p => {
                if (!newTasks.find(t => t.id === p.id)) newTasks.push(p)
            })
            return newTasks
        })

    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 16 }}>
            {/* Toolbar / Selected Task Info */}
            <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <div>
                        {selectedTask ? (
                            <>
                                <span style={{ fontWeight: 600, marginRight: 8 }}>{selectedTask.title}</span>
                                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                    {selectedTask.status} | Team: {teams.find(t => t.id === selectedTask.team_id)?.name || "N/A"}
                                </span>
                            </>
                        ) : (
                            <span style={{ color: "#64748b" }}>Selecciona una tarea para ver detalles o añadir prerrequisitos.</span>
                        )}
                    </div>
                    {selectedTask && (
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            variant="contained"
                            color="primary"
                            startIcon={<MdAdd />}
                            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.9rem", padding: "6px 12px" }}
                        >
                            Añadir Prerrequisito
                        </Button>
                    )}
                </div>

                {/* Toolbar for Goal Creation (Top Level) */}
                {canCreateGoal && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8, minWidth: "150px" }}>
                        <Button
                            onClick={() => {
                                setSelectedTask(null) // Ensure no task is selected implies top-level creation
                                setIsCreatingGoal(true)
                                setShowCreateModal(true)
                            }}
                            className="btn-outline"
                            style={{ display: "flex", alignItems: "center", gap: 6 }}
                        >
                            <MdAdd /> Añadir Tarea
                        </Button>
                    </div>
                )}

            </div>

            {/* Graph Container */}
            <div style={{ flex: 1, overflow: "auto", background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16, minHeight: 400 }}>
                <div style={{ width: '100%', height: '100%' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        nodesConnectable={false}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        fitView
                    />
                    {/* Create Task Modal */}
                    {showCreateModal && (
                        <CreateTaskModal
                            unlockedTask={isCreatingGoal ? null : selectedTask}
                            onClose={() => {
                                setShowCreateModal(false)
                                setIsCreatingGoal(false)
                            }}
                            onCreated={(newTask) => {
                                setTasks(prev => [...prev, newTask])
                                setShowCreateModal(false)
                                setIsCreatingGoal(false)

                                if (!selectedTask && !isCreatingGoal) {
                                    // Should not happen if logic is correct
                                    return
                                }

                                if (isCreatingGoal) {
                                    // Add new goal node at top level
                                    const topLevelNodes = nodes.filter(n => n.position.y === 0)
                                    const newX = topLevelNodes.length * 250

                                    setNodes(prev => [...prev, buildNode(newTask, { x: newX, y: 0 })])
                                    return
                                }

                                // ... existing prerequisite creation logic ...
                                const targetNode = nodes.find(n => n.id === selectedTask.id.toString())
                                const targetPos = targetNode ? targetNode.position : { x: 0, y: 0 }

                                // Add new node BELOW
                                setNodes(prev => [...prev, buildNode(newTask, { x: targetPos.x, y: targetPos.y + 150 })])

                                // Add edge
                                const newEdge = {
                                    id: `${newTask.id}-${selectedTask.id}`,
                                    source: selectedTask.id.toString(),
                                    target: newTask.id.toString(),
                                    animated: true
                                }
                                setEdges(prev => [...prev, newEdge])
                            }}
                            teams={teams}
                            profiles={profiles}
                        />
                    )}</div>
            </div>
        </div>
    )
}

function CreateTaskModal({ unlockedTask, onClose, onCreated, teams, profiles }) {
    const [title, setTitle] = useState("")
    const [teamId, setTeamId] = useState("")
    const [assignedTo, setAssignedTo] = useState("")
    const [participantIds, setParticipantIds] = useState([])
    const { id_usuario } = Perfil().getToken()

    // Set default assignedTo to current user if available
    useEffect(() => {
        if (id_usuario) {
            setAssignedTo(id_usuario)
        }
    }, [id_usuario])

    async function handleSubmit(e) {
        e.preventDefault()

        // 1. Create Task
        const { task, error } = await createTask({
            title,
            team_id: teamId || null,
            desbloquea: unlockedTask ? unlockedTask.id : null,
            assigned_to: assignedTo || null,
            created_by: id_usuario,
            status: "pendiente"
        })

        if (error) {
            console.error(error)
            if (error.code === "42501") {
                alert("No tienes permitido crear/editar/borrar esta tarea")
            } else {
                alert("Error creando la tarea: " + error.message)
            }
            return
        }

        // 2. Add Participants (tasks_profiles)
        if (participantIds.length > 0) {
            const { error: profileError } = await addProfilesToTask(task.id, participantIds)
            if (profileError) {
                console.error("Error adding participants:", profileError)
                alert("Tarea creada, pero hubo un error añadiendo participantes.")
            }
        }

        // Enrich task with profile data so avatars render immediately
        const assignedProfile = assignedTo ? (profiles || []).find(p => p.id === assignedTo) : null
        task.assigned_to_profile = assignedProfile
            ? { id: assignedProfile.id, full_name: assignedProfile.full_name, username: assignedProfile.username, avatar_url: assignedProfile.avatar_url }
            : null
        task.tasks_profiles = participantIds.map(pid => {
            const prof = (profiles || []).find(p => p.id === pid)
            return prof
                ? { id_profile: pid, profiles: { id: prof.id, full_name: prof.full_name, username: prof.username, avatar_url: prof.avatar_url } }
                : { id_profile: pid, profiles: null }
        })

        onCreated(task)
    }

    return (
        <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                {unlockedTask ? `Nuevo Prerrequisito para "${unlockedTask.title}"` : "Nuevo Objetivo"}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <TextField
                        autoFocus
                        label="Título"
                        type="text"
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <FormControl fullWidth>
                        <InputLabel>Equipo</InputLabel>
                        <Select
                            value={teamId}
                            label="Equipo"
                            onChange={(e) => setTeamId(e.target.value)}
                        >
                            <MenuItem value=""><em>Sin equipo</em></MenuItem>
                            {teams.map((t) => (
                                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Asignado a</InputLabel>
                        <Select
                            value={assignedTo}
                            label="Asignado a"
                            onChange={(e) => setAssignedTo(e.target.value)}
                        >
                            <MenuItem value=""><em>Sin asignar</em></MenuItem>
                            {profiles.map((p) => (
                                <MenuItem key={p.id} value={p.id}>{p.full_name || p.username || "Usuario"}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel id="participants-label">Participantes</InputLabel>
                        <Select
                            labelId="participants-label"
                            multiple
                            value={participantIds}
                            onChange={(e) => {
                                const { target: { value } } = e;
                                setParticipantIds(
                                    // On autofill we get a stringified value.
                                    typeof value === 'string' ? value.split(',') : value,
                                );
                            }}
                            input={<OutlinedInput label="Participantes" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        // Ensure profiles is an array before finding
                                        const profile = (profiles || []).find(p => p.id === value)
                                        return (
                                            <Chip key={value} label={profile?.full_name || profile?.username || "Usuario"} />
                                        )
                                    })}
                                </Box>
                            )}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: 224,
                                        width: 250,
                                    },
                                },
                            }}
                        >
                            {(profiles || []).map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                    {p.full_name || p.username || "Usuario"}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                </DialogContent>
                <DialogActions style={{ padding: 24 }}>
                    <Button onClick={onClose} variant="outlined" color="inherit">
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained" color="primary">
                        Crear
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

function EditTaskModal({ task, teams, profiles, onClose, onUpdated }) {
    const [title, setTitle] = useState(task.title || "")
    const [description, setDescription] = useState(task.description || "")
    const [status, setStatus] = useState(task.status || "pendiente")
    const [priority, setPriority] = useState(task.priority ?? "")
    const [teamId, setTeamId] = useState(task.team_id ?? "")
    const [assignedTo, setAssignedTo] = useState(task.assigned_to || "")
    const [dueDate, setDueDate] = useState(task.due_date || "")
    const [participantIds, setParticipantIds] = useState(
        (task.tasks_profiles || []).map(tp => tp.id_profile)
    )
    const [saving, setSaving] = useState(false)
    const { id_usuario } = Perfil().getToken()

    async function handleSubmit(e) {
        e.preventDefault()
        setSaving(true)

        // 1. Update task fields
        const { task: updated, error } = await updateTask(task.id, {
            title,
            description: description || null,
            status,
            priority: priority === "" ? null : Number(priority),
            team_id: teamId || null,
            assigned_to: assignedTo || null,
            due_date: dueDate || null,
            last_edited_by: id_usuario,
            updated_at: new Date().toISOString(),
        })

        if (error) {
            setSaving(false)
            console.error(error)
            if (error.code === "42501") {
                alert("No tienes permitido editar esta tarea.")
            } else {
                alert("Error actualizando la tarea: " + error.message)
            }
            return
        }

        if (!updated) {
            setSaving(false)
            alert("No tienes permitido editar esta tarea.")
            return
        }

        // 2. Sync participants
        const { error: syncError } = await syncTaskProfiles(task.id, participantIds)
        if (syncError) {
            console.error("Error syncing participants:", syncError)
            alert("Tarea actualizada, pero hubo un error actualizando participantes.")
        }

        // Enrich updated task with participant profiles for immediate avatar rendering
        updated.tasks_profiles = participantIds.map(pid => {
            const prof = (profiles || []).find(p => p.id === pid)
            return prof
                ? { id_profile: pid, profiles: { id: prof.id, full_name: prof.full_name, username: prof.username, avatar_url: prof.avatar_url } }
                : { id_profile: pid, profiles: null }
        })

        setSaving(false)
        onUpdated(updated)
    }

    return (
        <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Editar Tarea</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <TextField
                        autoFocus
                        label="Título"
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <TextField
                        label="Descripción"
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Estado</InputLabel>
                        <Select value={status} label="Estado" onChange={(e) => setStatus(e.target.value)}>
                            <MenuItem value="pendiente">Pendiente</MenuItem>
                            <MenuItem value="en_progreso">En Progreso</MenuItem>
                            <MenuItem value="completado">Completado</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Prioridad</InputLabel>
                        <Select value={priority} label="Prioridad" onChange={(e) => setPriority(e.target.value)}>
                            <MenuItem value=""><em>Sin prioridad</em></MenuItem>
                            <MenuItem value={1}>Alta</MenuItem>
                            <MenuItem value={2}>Media</MenuItem>
                            <MenuItem value={3}>Baja</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Equipo</InputLabel>
                        <Select value={teamId} label="Equipo" onChange={(e) => setTeamId(e.target.value)}>
                            <MenuItem value=""><em>Sin equipo</em></MenuItem>
                            {teams.map((t) => (
                                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Asignado a</InputLabel>
                        <Select value={assignedTo} label="Asignado a" onChange={(e) => setAssignedTo(e.target.value)}>
                            <MenuItem value=""><em>Sin asignar</em></MenuItem>
                            {profiles.map((p) => (
                                <MenuItem key={p.id} value={p.id}>{p.full_name || p.username || "Usuario"}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel id="edit-participants-label">Participantes</InputLabel>
                        <Select
                            labelId="edit-participants-label"
                            multiple
                            value={participantIds}
                            onChange={(e) => {
                                const { target: { value } } = e;
                                setParticipantIds(
                                    typeof value === 'string' ? value.split(',') : value,
                                );
                            }}
                            input={<OutlinedInput label="Participantes" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const profile = (profiles || []).find(p => p.id === value)
                                        return (
                                            <Chip key={value} label={profile?.full_name || profile?.username || "Usuario"} />
                                        )
                                    })}
                                </Box>
                            )}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: 224,
                                        width: 250,
                                    },
                                },
                            }}
                        >
                            {(profiles || []).map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                    {p.full_name || p.username || "Usuario"}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Fecha límite"
                        type="date"
                        fullWidth
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                </DialogContent>
                <DialogActions style={{ padding: 24 }}>
                    <Button onClick={onClose} variant="outlined" color="inherit" disabled={saving}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained" color="primary" disabled={saving}>
                        {saving ? "Guardando..." : "Guardar"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}