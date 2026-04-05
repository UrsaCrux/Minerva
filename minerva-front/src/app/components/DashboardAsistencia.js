"use client"
import { useState, useEffect } from "react"
import { getAsistenciaStats } from "../utils/supa"

export default function DashboardAsistencia({ userId }) {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true
        async function load() {
            if (!userId) return;
            setLoading(true)
            const { stats: fetchedStats, error } = await getAsistenciaStats(userId)

            if (isMounted) {
                if (!error && fetchedStats) {
                    setStats(fetchedStats)
                }
                setLoading(false)
            }
        }
        load()
        return () => { isMounted = false }
    }, [userId])

    if (loading || !stats) {
        return null;
    }

    return (
        <div style={{
            background: "var(--surface-container-high)",
            borderRadius: 12,
            padding: 16,
            border: "var(--ghost-border)"
        }}>
            <h2 className="db_card_title" style={{ marginBottom: 8, fontSize: "0.85rem", color: "var(--on-surface-variant)" }}>
                Tu Asistencia
            </h2>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: "var(--primary)" }}>
                    {stats.percentage}%
                </span>
                <span style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)" }}>
                    ({stats.attended} de {stats.total - stats.justified} reuniones)
                </span>
            </div>

            {stats.total === 0 && (
                <div style={{ marginTop: 8, fontSize: "0.75rem", color: "var(--on-surface-variant)", fontStyle: "italic" }}>
                    No hay informes registrados de eventos obligatorios.
                </div>
            )}
        </div>
    )
}
