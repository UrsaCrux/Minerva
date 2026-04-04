"use client"
import { useState, useEffect } from "react"
import { getAnuncios } from "../utils/supa"

export default function DashboardAnnouncements() {
    const [anuncios, setAnuncios] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true
        async function load() {
            setLoading(true)
            const { anuncios, error } = await getAnuncios()
            if (isMounted && !error) {
                setAnuncios(anuncios || [])
            }
            if (isMounted) setLoading(false)
        }
        load()
        return () => { isMounted = false }
    }, [])

    return (
        <div className="home_card db_col_anuncios">
            <h2 className="db_card_title" style={{ marginBottom: 12 }}>Anuncios</h2>
            <div className="db_scroll_list">
                {loading ? (
                    <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem" }}>Cargando anuncios...</p>
                ) : anuncios.length === 0 ? (
                    <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem" }}>No hay anuncios recientes.</p>
                ) : (
                    anuncios.map(anuncio => (
                        <div key={anuncio.id} className="db_anuncio_item">
                            <h3 className="db_anuncio_title">{anuncio.titulo}</h3>
                            <div className="db_anuncio_meta">
                                {anuncio.fecha && <span>{new Date(anuncio.fecha + "T00:00:00").toLocaleDateString()}</span>}
                                {anuncio.fecha && anuncio.publicado_por && <span> • </span>}
                                {anuncio.publicado_por && <span>{anuncio.publicado_por.full_name || "Usuario"}</span>}
                            </div>
                            <p className="db_anuncio_cuerpo">{anuncio.cuerpo}</p>
                            {anuncio.imagen_url && (
                                <img src={anuncio.imagen_url} alt="Adjunto" className="db_anuncio_img" />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
