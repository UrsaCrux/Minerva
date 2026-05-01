"use client"
import { useState, useEffect, useCallback } from "react"
import useEmblaCarousel from 'embla-carousel-react'
import { getAnuncios, createAnuncio, hasPermiso } from "../utils/supa"
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material"
import { MdAdd, MdChevronLeft, MdChevronRight } from "react-icons/md"
import { createClient } from "../utils/client"
import Markdown, { stripMarkdown } from "./Markdown"

function CreateAnuncioModal({ onClose, onCreated }) {
    const [titulo, setTitulo] = useState("")
    const [cuerpo, setCuerpo] = useState("")
    const [saving, setSaving] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setSaving(true)

        // The database handles _publicado_por_ defaulting to auth.uid()
        // and fecha defaulting to CURRENT_DATE.
        const { anuncio, error } = await createAnuncio({
            titulo,
            cuerpo
        })

        if (error) {
            setSaving(false)
            console.error(error)
            alert("Error publicando el anuncio: " + error.message)
            return
        }

        onCreated(anuncio)
    }

    return (
        <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Nuevo Anuncio</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <TextField
                        autoFocus
                        label="Título"
                        type="text"
                        fullWidth
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        required
                    />
                    <TextField
                        label="Cuerpo"
                        multiline
                        rows={6}
                        fullWidth
                        value={cuerpo}
                        onChange={(e) => setCuerpo(e.target.value)}
                        required
                        helperText="Soporta Markdown: **negrita**, *cursiva*, `código`, listas, [enlaces](url)"
                    />
                </DialogContent>
                <DialogActions style={{ padding: 24 }}>
                    <Button onClick={onClose} variant="outlined" color="inherit" disabled={saving}>Cancelar</Button>
                    <Button type="submit" variant="contained" color="primary" disabled={saving}>Publicar</Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

function ViewAnuncioModal({ anuncio, onClose }) {
    if (!anuncio) return null
    return (
        <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: "bold", color: "var(--primary)" }}>
                {anuncio.titulo}
            </DialogTitle>
            <DialogContent>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>
                    {anuncio.publicado_por?.avatar_url ? (
                        <img src={anuncio.publicado_por.avatar_url} alt="Avatar" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--surface-container-high)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: "bold", color: "var(--on-surface)" }}>
                            {(anuncio.publicado_por?.full_name || "U")[0].toUpperCase()}
                        </div>
                    )}
                    <span>{anuncio.publicado_por?.full_name || "Usuario"}</span>
                    <span style={{ opacity: 0.6 }}>•</span>
                    <span>{new Date(anuncio.created_at).toLocaleDateString()}</span>
                </div>
                <Markdown
                    className="anuncio_body"
                >
                    {anuncio.cuerpo}
                </Markdown>
            </DialogContent>
            <DialogActions style={{ padding: "16px 24px" }}>
                <Button onClick={onClose} variant="outlined" color="inherit">Cerrar</Button>
            </DialogActions>
        </Dialog>
    )
}

export default function DashboardAnnouncements() {
    const [anuncios, setAnuncios] = useState([])
    const [loading, setLoading] = useState(true)
    const [canCreate, setCanCreate] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedAnuncio, setSelectedAnuncio] = useState(null)
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, watchDrag: false })

    const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
    const [nextBtnDisabled, setNextBtnDisabled] = useState(true)

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

    const onSelect = useCallback(() => {
        if (!emblaApi) return
        setPrevBtnDisabled(!emblaApi.canScrollPrev())
        setNextBtnDisabled(!emblaApi.canScrollNext())
    }, [emblaApi])

    useEffect(() => {
        if (!emblaApi) return
        onSelect()
        emblaApi.on('select', onSelect)
        emblaApi.on('reInit', onSelect)
    }, [emblaApi, onSelect])

    useEffect(() => {
        let isMounted = true
        async function load() {
            setLoading(true)
            const { anuncios, error } = await getAnuncios()
            if (isMounted && !error) {
                setAnuncios(anuncios || [])
            }
            const hasAdmin = await hasPermiso(5)
            if (isMounted) setCanCreate(hasAdmin)

            if (isMounted) setLoading(false)
        }
        load()
        return () => { isMounted = false }
    }, [])

    return (
        <div className="home_card db_col_anuncios" style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 className="db_card_title" style={{ margin: 0 }}>Anuncios</h2>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "2px" }}>
                        <button 
                            onClick={scrollPrev} 
                            disabled={prevBtnDisabled} 
                            style={{ 
                                background: "transparent", border: "none", padding: "4px", borderRadius: "50%",
                                color: prevBtnDisabled ? "rgba(169, 168, 204, 0.2)" : "var(--on-surface-variant)", 
                                cursor: prevBtnDisabled ? "not-allowed" : "pointer" 
                            }}
                            title="Anuncio Anterior"
                        >
                            <MdChevronLeft size={24} />
                        </button>
                        <button 
                            onClick={scrollNext} 
                            disabled={nextBtnDisabled} 
                            style={{ 
                                background: "transparent", border: "none", padding: "4px", borderRadius: "50%",
                                color: nextBtnDisabled ? "rgba(169, 168, 204, 0.2)" : "var(--on-surface-variant)", 
                                cursor: nextBtnDisabled ? "not-allowed" : "pointer" 
                            }}
                            title="Siguiente Anuncio"
                        >
                            <MdChevronRight size={24} />
                        </button>
                    </div>

                    {canCreate && (
                        <button 
                            className="flowchart_float_btn flowchart_float_btn--primary" 
                            style={{ padding: "6px 12px", width: "auto", height: "auto", borderRadius: "1rem" }}
                            onClick={() => setShowCreateModal(true)}
                            title="Publicar Anuncio"
                        >
                            <MdAdd size={18} />
                            <span style={{ fontSize: "0.85rem", marginLeft: 4 }}>Publicar</span>
                        </button>
                    )}
                </div>
            </div>
            
            <div className="db_scroll_list" style={{ overflow: "hidden", padding: 0 }}>
                {loading ? (
                    <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem" }}>Cargando anuncios...</p>
                ) : anuncios.length === 0 ? (
                    <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem" }}>No hay anuncios recientes.</p>
                ) : (
                    <div className="embla" ref={emblaRef} style={{ overflow: "hidden", height: "100%", width: "100%" }}>
                        <div className="embla__container" style={{ display: "flex", height: "100%" }}>
                            {anuncios.map(anuncio => (
                                <div className="embla__slide" key={anuncio.id} style={{ flex: "0 0 100%", minWidth: 0, paddingRight: 16 }}>
                                    <div 
                                        onClick={() => setSelectedAnuncio(anuncio)}
                                        style={{ 
                                            display: "flex", 
                                            flexDirection: "column", 
                                            gap: "6px", 
                                            height: "100%",
                                            cursor: "pointer"
                                        }}
                                    >
                                        <div style={{ color: "var(--on-surface-variant)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "8px" }}>
                                            {anuncio.publicado_por?.avatar_url ? (
                                                <img src={anuncio.publicado_por.avatar_url} alt="Avatar" style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} />
                                            ) : (
                                                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--surface-container-high)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: "bold", color: "var(--on-surface)" }}>
                                                    {(anuncio.publicado_por?.full_name || "U")[0].toUpperCase()}
                                                </div>
                                            )}
                                            {anuncio.publicado_por?.full_name || "Usuario"}
                                        </div>
                                        <div style={{ fontSize: "1.1rem", fontWeight: "bold", fontFamily: "'Space Grotesk', sans-serif", color: "var(--primary)", lineHeight: 1.2 }}>
                                            {anuncio.titulo}
                                        </div>
                                        <div style={{
                                            color: "var(--on-surface-variant)",
                                            fontSize: "0.8rem",
                                            lineHeight: 1.4,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            flex: 1,
                                            wordBreak: "break-word"
                                        }}>
                                            {(() => {
                                                const plain = stripMarkdown(anuncio.cuerpo).replace(/\s+/g, " ").trim()
                                                return plain.length > 160 ? plain.substring(0, 160).trimEnd() + "…" : plain
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <CreateAnuncioModal 
                    onClose={() => setShowCreateModal(false)}
                    onCreated={async (newAnuncio) => {
                        setShowCreateModal(false)
                        // Refresh the list to get full normalized data (e.g. author profile)
                        // This handles getting the joined `publicado_por` profile info naturally
                        const { anuncios } = await getAnuncios()
                        if (anuncios) setAnuncios(anuncios)
                    }}
                />
            )}

            {selectedAnuncio && (
                <ViewAnuncioModal 
                    anuncio={selectedAnuncio}
                    onClose={() => setSelectedAnuncio(null)}
                />
            )}
        </div>
    )
}
