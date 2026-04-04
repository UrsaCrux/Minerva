"use client"
import { useState, useEffect } from "react"
import TaskDetailsDialog from "./TaskDetailsDialog"
import { getMyTasks } from "../utils/supa"

export default function AssignedTasksCol({ userId, teams }) {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedTask, setSelectedTask] = useState(null)

    useEffect(() => {
        if (!userId) return
        async function loadTasks() {
            setLoading(true)
            const { tasks, error } = await getMyTasks(userId)
            if (!error) {
                setTasks(tasks || [])
            }
            setLoading(false)
        }
        loadTasks()
    }, [userId])

    return (
        <div className="home_card db_col_assigned">
            <h2 className="db_card_title" style={{ marginBottom: 12 }}>Tus Asignaciones</h2>
            <div className="db_tasks_list">
                {loading ? (
                    <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem" }}>Cargando tareas...</p>
                ) : tasks.length === 0 ? (
                    <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem" }}>No tienes trabajos asignados.</p>
                ) : (
                    tasks.map(task => {
                        const isPrimary = task.assigned_to === userId
                        const roleLabel = isPrimary ? "Responsable" : "Participante"
                        
                        return (
                            <div key={task.id} className="task_mini_card">
                                <div className="task_mini_header">
                                    <span className="task_mini_title">{task.title}</span>
                                    <span className={`task_status_badge ${isPrimary ? 'en_progreso' : 'completado'}`}>
                                        {roleLabel}
                                    </span>
                                </div>
                                <div className="db_task_footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                                    <div className="task_mini_date">
                                        {task.due_date ? `Vence: ${new Date(task.due_date + "T00:00:00").toLocaleDateString()}` : "Sin fecha"}
                                    </div>
                                    <button 
                                        className="profile_popup_trigger"
                                        style={{ background: 'transparent', padding: '4px 8px', fontSize: '0.8rem' }}
                                        onClick={() => setSelectedTask(task)}
                                    >
                                        Ver detalles
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
            
            {selectedTask && (
                <TaskDetailsDialog 
                    task={selectedTask} 
                    onClose={() => setSelectedTask(null)} 
                    teams={teams}
                />
            )}
        </div>
    )
}
