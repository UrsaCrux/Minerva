"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { getGoalTasks, getPrerequisiteTasks, getTeams, createTask, hasPermiso, getAllProfiles, addProfilesToTask } from "../utils/supa"
import { MdAdd, MdClose } from "react-icons/md"
import Perfil from "../utils/perfil"
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Chip, OutlinedInput, Box } from "@mui/material"

// Hardcoded colors for teams (since teams table doesn't have color column)
const TEAM_COLORS = {
    1: "#f87171", // Red
    2: "#60a5fa", // Blue
    3: "#facc15", // Yellow
    4: "#4ade80", // Green
    5: "#c084fc", // Purple
    default: "#94a3b8" // Gray
}



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

    async function loadInitialData() {
        const { teams } = await getTeams()
        setTeams(teams)

        const { profiles } = await getAllProfiles()
        setProfiles(profiles)

        const { tasks: goals } = await getGoalTasks()
        setTasks(goals)

        // Map goals to nodes
        const initialNodes = goals.map((task, index) => ({
            id: task.id.toString(),
            // Position goals horizontally at y=0 (Top)
            position: { x: index * 250, y: 0 },
            data: { label: task.title, task: task },
            style: {
                background: TEAM_COLORS[task.team_id] || TEAM_COLORS.default,
                color: '#fff',
                border: '1px solid #333',
                width: 180
            },
        }))
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

    const onNodeClick = useCallback(async (event, node) => {
        const task = node.data.task
        if (!task) return
        setSelectedTask(task)

        // Fetch prerequisites
        const { tasks: prereqs } = await getPrerequisiteTasks(task.id)
        if (!prereqs || prereqs.length === 0) return

        setNodes((nds) => {
            const newNodes = []
            let existingNodesCount = 0

            // Check which prereqs are already in the graph
            prereqs.forEach((p, idx) => {
                if (nds.find(n => n.id === p.id.toString())) {
                    existingNodesCount++
                    return
                }

                // Position new nodes BELOW the target
                newNodes.push({
                    id: p.id.toString(),
                    position: {
                        // Spread horizontally
                        x: node.position.x + (idx * 220) - ((prereqs.length - 1) * 110),
                        // Move down
                        y: node.position.y + 150
                    },
                    data: { label: p.title, task: p },
                    style: {
                        background: TEAM_COLORS[p.team_id] || TEAM_COLORS.default,
                        color: '#fff',
                        border: '1px solid #333',
                        width: 180
                    }
                })
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

    }, [])

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
                                    // Calculate simple position based on existing top-level nodes count or just append
                                    const topLevelNodes = nodes.filter(n => n.position.y === 0)
                                    const newX = topLevelNodes.length * 250

                                    const newNode = {
                                        id: newTask.id.toString(),
                                        position: { x: newX, y: 0 },
                                        data: { label: newTask.title, task: newTask },
                                        style: {
                                            background: TEAM_COLORS[newTask.team_id] || TEAM_COLORS.default,
                                            color: '#fff',
                                            border: '1px solid #333',
                                            width: 180
                                        }
                                    }
                                    setNodes(prev => [...prev, newNode])
                                    return
                                }

                                // ... existing prerequisite creation logic ...
                                const targetNode = nodes.find(n => n.id === selectedTask.id.toString())
                                const targetPos = targetNode ? targetNode.position : { x: 0, y: 0 }

                                // Add new node BELOW
                                const newNode = {
                                    id: newTask.id.toString(),
                                    position: { x: targetPos.x, y: targetPos.y + 150 },
                                    data: { label: newTask.title, task: newTask },
                                    style: {
                                        background: TEAM_COLORS[newTask.team_id] || TEAM_COLORS.default,
                                        color: '#fff',
                                        border: '1px solid #333',
                                        width: 180
                                    }
                                }
                                setNodes(prev => [...prev, newNode])

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