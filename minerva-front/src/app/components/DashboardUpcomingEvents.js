"use client"
import { useMemo } from "react"

export default function DashboardUpcomingEvents({ userId, eventos }) {
    const upcomingEventos = useMemo(() => {
        if (!eventos || eventos.length === 0) return []
        const now = new Date()
        return eventos
            .filter(e => {
                if (e.fin) return new Date(e.fin) >= now
                return new Date(e.inicio) >= now
            })
            .slice(0, 5)
    }, [eventos])

    return (
        <div className="home_card db_col_eventos">
            <h2 className="db_card_title" style={{ marginBottom: 12 }}>Próximos Eventos</h2>
            <div className="db_scroll_list">
                {!eventos ? (
                    <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem" }}>Cargando eventos...</p>
                ) : upcomingEventos.length === 0 ? (
                    <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem" }}>No hay eventos próximos.</p>
                ) : (
                    upcomingEventos.map(evento => {
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
