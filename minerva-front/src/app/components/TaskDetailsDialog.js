import { useState, useEffect } from "react"
import { getTaskProgresos, createProgreso, completeTask, canCompleteTask } from "../utils/supa"
import { MdClose, MdAdd, MdCheckCircle } from "react-icons/md"
import { Button, Dialog, DialogContent, DialogActions, CircularProgress } from "@mui/material"

const MIN_TITULO_LENGTH = 3

function getInitials(name) {
    if (!name) return "?"
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

export function getTaskAvatars(task) {
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

const STATUS_META = {
    pendiente: { label: "Pendiente", color: "#a9a8cc", bg: "rgba(169,168,204,0.12)" },
    en_progreso: { label: "En Progreso", color: "#9fa3ff", bg: "rgba(159,163,255,0.15)" },
    completado: { label: "Completado", color: "#00dbe7", bg: "rgba(0,219,231,0.12)" },
}

const PRIORITY_META = {
    "1": { label: "Alta", color: "#fd6f85", bg: "rgba(253,111,133,0.15)" },
    "2": { label: "Media", color: "#ebb2ff", bg: "rgba(235,178,255,0.12)" },
    "3": { label: "Baja", color: "#9fa3ff", bg: "rgba(159,163,255,0.10)" },
}

export default function TaskDetailsDialog({ task, onClose, teams, userId, onTaskUpdated }) {
    const [progresos, setProgresos] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [titulo, setTitulo] = useState("")
    const [descripcion, setDescripcion] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [completable, setCompletable] = useState(false)
    const [completing, setCompleting] = useState(false)

    const isCompleted = task.status === "completado"

    useEffect(() => {
        let isMounted = true
        async function fetchData() {
            setLoading(true)
            const [{ progresos: data }, canComplete] = await Promise.all([
                getTaskProgresos(task.id),
                canCompleteTask(task.id),
            ])
            if (isMounted) {
                setProgresos(data || [])
                setCompletable(canComplete)
                setLoading(false)
            }
        }
        fetchData()
        return () => { isMounted = false }
    }, [task.id])

    async function handleAddProgreso(e) {
        e.preventDefault()
        if (titulo.trim().length < MIN_TITULO_LENGTH) return

        setSubmitting(true)
        const { progreso, error } = await createProgreso(task.id, titulo.trim(), descripcion.trim())
        setSubmitting(false)

        if (error) {
            console.error("Error creating progreso:", error)
            alert("Error al crear progreso: " + (error.message || "desconocido"))
            return
        }

        setProgresos(prev => [progreso, ...prev])
        setTitulo("")
        setDescripcion("")
        setShowForm(false)
    }

    async function handleComplete() {
        if (isCompleted || !completable) return

        setCompleting(true)
        const { task: updated, error } = await completeTask(task.id)
        setCompleting(false)

        if (error) {
            const isSubtaskError = error.message?.includes("not all subtasks")
                || error.code === "P0001"
            if (isSubtaskError) {
                alert("No se puede completar: hay subtareas pendientes.")
            } else {
                alert("Error al completar: " + (error.message || "desconocido"))
            }
            return
        }

        if (onTaskUpdated && updated) onTaskUpdated(updated)
        onClose()
    }

    const teamName = teams?.find(t => t.id === task.team_id)?.name
    const statusMeta = STATUS_META[task.status] || { label: task.status || "—", color: "#64748b", bg: "#f1f5f9" }
    const priorityMeta = task.priority ? (PRIORITY_META[String(task.priority)] || null) : null
    const participants = getTaskAvatars(task)

    return (
        <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm"
            PaperProps={{ style: { borderRadius: 16, overflow: "hidden" } }}
        >
            {/* ── Header ── */}
            <div className="td_header">
                <div className="td_header_inner">
                    <div className="td_title">{task.title}</div>
                    <button className="td_close_btn" onClick={onClose} title="Cerrar">
                        <MdClose size={18} />
                    </button>
                </div>
            </div>

            <DialogContent style={{ padding: "20px 24px 8px", display: "flex", flexDirection: "column", gap: 20 }}>
                {/* ── Badge Row ── */}
                <div className="td_badge_row">
                    <span className="td_badge" style={{ color: statusMeta.color, background: statusMeta.bg }}>
                        {statusMeta.label}
                    </span>
                    {priorityMeta && (
                        <span className="td_badge" style={{ color: priorityMeta.color, background: priorityMeta.bg }}>
                            {priorityMeta.label} prioridad
                        </span>
                    )}
                    {teamName && (
                        <span className="td_badge" style={{ color: "#ebb2ff", background: "rgba(235,178,255,0.12)" }}>
                            {teamName}
                        </span>
                    )}
                </div>

                {/* ── Description ── */}
                {task.description && (
                    <div className="td_section">
                        <div className="td_section_label">Descripción</div>
                        <div className="td_description">{task.description}</div>
                    </div>
                )}

                {/* ── Info Grid ── */}
                <div className="td_info_grid">
                    <div className="td_info_cell">
                        <div className="td_info_label">Asignado a</div>
                        <div className="td_info_value td_person_row">
                            {task.assigned_to_profile ? (
                                <>
                                    <div className="td_mini_avatar">
                                        {task.assigned_to_profile.avatar_url
                                            ? <img src={task.assigned_to_profile.avatar_url} alt="" />
                                            : getInitials(task.assigned_to_profile.full_name || task.assigned_to_profile.username)
                                        }
                                    </div>
                                    <span>{task.assigned_to_profile.full_name || task.assigned_to_profile.username}</span>
                                </>
                            ) : (
                                <span className="td_empty_value">Sin asignar</span>
                            )}
                        </div>
                    </div>

                    <div className="td_info_cell">
                        <div className="td_info_label">Fecha límite</div>
                        <div className="td_info_value">
                            {task.due_date
                                ? new Date(task.due_date + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
                                : <span className="td_empty_value">Sin fecha</span>
                            }
                        </div>
                    </div>
                </div>

                {/* ── Participants ── */}
                {participants.length > 0 && (
                    <div className="td_section">
                        <div className="td_section_label">Participantes ({participants.length})</div>
                        <div className="td_participants_row">
                            {participants.map(p => (
                                <div key={p.id} className="td_participant" title={p.full_name || p.username || "Usuario"}>
                                    <div className="td_mini_avatar">
                                        {p.avatar_url
                                            ? <img src={p.avatar_url} alt="" />
                                            : getInitials(p.full_name || p.username)
                                        }
                                    </div>
                                    <span>{p.full_name || p.username || "Usuario"}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Divider ── */}
                <div className="td_divider" />

                {/* ── Progresos Section ── */}
                <div className="td_progresos_section">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div className="td_section_label" style={{ marginBottom: 0 }}>Historial de Progreso</div>
                        {!isCompleted && (
                            <button
                                className="td_progreso_toggle_btn"
                                onClick={() => setShowForm(prev => !prev)}
                                title="Añadir progreso"
                            >
                                <MdAdd size={16} />
                                <span>{showForm ? "Cancelar" : "Añadir"}</span>
                            </button>
                        )}
                    </div>

                    {/* ── Inline Progreso Form ── */}
                    {showForm && (
                        <form className="td_progreso_form" onSubmit={handleAddProgreso}>
                            <input
                                className="td_progreso_input"
                                type="text"
                                placeholder="Título del progreso"
                                value={titulo}
                                onChange={e => setTitulo(e.target.value)}
                                required
                                minLength={MIN_TITULO_LENGTH}
                                autoFocus
                            />
                            <textarea
                                className="td_progreso_textarea"
                                placeholder="Descripción (opcional)"
                                value={descripcion}
                                onChange={e => setDescripcion(e.target.value)}
                                rows={2}
                            />
                            <button
                                className="td_progreso_submit_btn"
                                type="submit"
                                disabled={submitting || titulo.trim().length < MIN_TITULO_LENGTH}
                            >
                                {submitting ? "Guardando..." : "Guardar Progreso"}
                            </button>
                        </form>
                    )}

                    {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                            <CircularProgress size={28} />
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
                </div>
            </DialogContent>

            <DialogActions style={{ padding: "12px 24px 20px", gap: 8 }}>
                <Button onClick={onClose} variant="outlined" color="inherit">Cerrar</Button>
                {!isCompleted && (
                    <button
                        className={`td_complete_btn${!completable ? " td_complete_btn--disabled" : ""}`}
                        onClick={handleComplete}
                        disabled={!completable || completing}
                        title={completable ? "Marcar como completada" : "Hay subtareas pendientes"}
                    >
                        <MdCheckCircle size={18} />
                        <span>{completing ? "Completando..." : "Completar Tarea"}</span>
                    </button>
                )}
            </DialogActions>
        </Dialog>
    )
}
