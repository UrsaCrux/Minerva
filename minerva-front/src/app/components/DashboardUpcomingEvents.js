"use client"
import { useState, useEffect } from "react"
import { getEventos } from "../utils/supa"

export default function DashboardUpcomingEvents({ userId }) {
    const [eventos, setEventos] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true
        async function load() {
            setLoading(true)
            const { eventos, error } = await getEventos()
            if (isMounted && !error) {
                // Filter to upcoming/current events only
                const now = new Date()
                const future = (eventos || []).filter(e => {
                    if (e.fin) {
                        return new Date(e.fin) >= now
                    }
                    return new Date(e.inicio) >= now
                })
                
                // only take the first 5
                setEventos(future.slice(0, 5))
            }
            if (isMounted) setLoading(false)
        }
        load()
        return () => { isMounted = false }
    }, [])

    return (
        <div className="home_card db_col_eventos">
            <h2 className="db_card_title" style={{ marginBottom: 12 }}>Próximos Eventos</h2>
            <div className="db_scroll_list">
                {loading ? (
                    <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem" }}>Cargando eventos...</p>
                ) : eventos.length === 0 ? (
                    <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem" }}>No hay eventos próximos.</p>
                ) : (
                    eventos.map(evento => {
                        const participation = evento.eventos_usuarios?.find(eu => eu.id_usuario === userId)
                        
                        let statusText = "No inscrito"
                        let statusClass = "status_none"
                        
                        if (participation) {
                            if (participation.asistencia === 1) {
                                statusText = "Confirmado"
                                statusClass = "status_confirmed"
                            } else if (participation.asistencia === 2) {
                                statusText = "Justificado"
                                statusClass = "status_absent"
                            } else {
                                statusText = "Pendiente de respuesta"
                                statusClass = "status_pending"
                            }
                        }

                        return (
                            <div key={evento.id_evento} className="db_evento_item">
                                <h3 className="db_evento_title">{evento.titulo}</h3>
                                <div className="db_evento_date">
                                    {new Date(evento.inicio).toLocaleDateString()} - {new Date(evento.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className={`db_evento_status ${statusClass}`}>
                                    {statusText}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
