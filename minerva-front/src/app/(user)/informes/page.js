"use client"
import { useState, useEffect } from "react"
import { MdAdd, MdClose, MdPictureAsPdf, MdDelete, MdPeople, MdEvent } from "react-icons/md"
import { CircularProgress, Dialog, DialogContent, DialogActions, Button, Autocomplete, TextField, Select, MenuItem, FormControl, InputLabel, Chip } from "@mui/material"
import { getInformes, getInformeById, createInforme, deleteInforme, getAllProfiles, hasPermiso, getEventos } from "@/app/utils/supa"
import "@/app/dashboard.css"

const TIPO_OPTIONS = [
    { value: "general", label: "Reunión General" },
    { value: "comision_proyectos", label: "Comisión de Proyectos" },
    { value: "comision_difusion", label: "Comisión de Difusión" },
    { value: "comision_finanzas", label: "Comisión de Finanzas" },
    { value: "directiva", label: "Directiva" },
    { value: "otro", label: "Otro" },
]

const TIPO_LABELS = Object.fromEntries(TIPO_OPTIONS.map(o => [o.value, o.label]))

function getInitials(name) {
    if (!name) return "?"
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

function formatFecha(fecha) {
    return new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", {
        day: "2-digit", month: "long", year: "numeric"
    })
}

export default function InformesPage() {
    const [informes, setInformes] = useState([])
    const [loading, setLoading] = useState(true)
    const [canCreate, setCanCreate] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [selectedInforme, setSelectedInforme] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [eventos, setEventos] = useState([])

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const [{ informes: data }, has, { eventos: evts }] = await Promise.all([
            getInformes(),
            hasPermiso(4),
            getEventos(),
        ])
        setInformes(data)
        setCanCreate(has)
        setEventos(evts)
        setLoading(false)
    }

    async function handleViewDetail(informe) {
        setDetailLoading(true)
        setSelectedInforme(informe)
        const { informe: full } = await getInformeById(informe.id)
        if (full) setSelectedInforme(full)
        setDetailLoading(false)
    }

    async function handleDelete(informeId) {
        if (!confirm("¿Eliminar este informe?")) return
        const { error } = await deleteInforme(informeId)
        if (error) {
            alert("Error al eliminar: " + error.message)
            return
        }
        setInformes(prev => prev.filter(i => i.id !== informeId))
        setSelectedInforme(null)
    }

    function handleCreated() {
        setShowCreate(false)
        loadData()
    }

    function getEventoTitulo(idEvento) {
        if (!idEvento) return null
        return eventos.find(e => e.id_evento === idEvento)?.titulo || null
    }

    return (
        <div style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexShrink: 0 }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "var(--on-surface)", margin: 0 }}>
                    Informes de Reuniones
                </h1>
                {canCreate && (
                    <button className="inf_create_btn" onClick={() => setShowCreate(true)}>
                        <MdAdd size={18} />
                        <span>Nuevo Informe</span>
                    </button>
                )}
            </div>

            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                    <CircularProgress size={32} />
                </div>
            ) : informes.length === 0 ? (
                <div className="inf_empty">No hay informes registrados.</div>
            ) : (
                <div className="inf_grid">
                    {informes.map(informe => (
                        <div key={informe.id} className="inf_card" onClick={() => handleViewDetail(informe)}>
                            <div className="inf_card_top_glow" />
                            <div className="inf_card_header">
                                <span className="inf_card_tipo">{TIPO_LABELS[informe.tipo] || informe.tipo}</span>
                                <span className="inf_card_fecha">{formatFecha(informe.fecha)}</span>
                            </div>
                            <div className="inf_card_title">{informe.titulo}</div>
                            <div className="inf_card_footer">
                                <div className="inf_card_meta">
                                    <MdPeople size={14} />
                                    <span>{informe.informe_asistentes?.length || 0} asistentes</span>
                                </div>
                                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                    {informe.id_evento && (
                                        <div className="inf_card_evento_badge">
                                            <MdEvent size={12} />
                                        </div>
                                    )}
                                    {informe.pdf_url && (
                                        <div className="inf_card_pdf_badge">
                                            <MdPictureAsPdf size={14} />
                                            <span>PDF</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="inf_card_author">
                                por {informe.profiles?.full_name || informe.profiles?.username || "—"}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Dialog */}
            {selectedInforme && (
                <InformeDetailDialog
                    informe={selectedInforme}
                    loading={detailLoading}
                    canDelete={canCreate}
                    eventoTitulo={getEventoTitulo(selectedInforme.id_evento)}
                    onClose={() => setSelectedInforme(null)}
                    onDelete={() => handleDelete(selectedInforme.id)}
                />
            )}

            {/* Create Dialog */}
            {showCreate && (
                <CreateInformeDialog
                    eventos={eventos}
                    onClose={() => setShowCreate(false)}
                    onCreated={handleCreated}
                />
            )}
        </div>
    )
}

function InformeDetailDialog({ informe, loading, canDelete, eventoTitulo, onClose, onDelete }) {
    const asistentes = informe.informe_asistentes || []
    const hasProfiles = asistentes.length > 0 && asistentes[0]?.profiles

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm"
            PaperProps={{ style: { borderRadius: 16, overflow: "hidden" } }}
        >
            <div className="td_header">
                <div className="td_header_inner">
                    <div>
                        <div className="td_title">{informe.titulo}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                            <span className="td_badge" style={{ color: "#9fa3ff", background: "rgba(159,163,255,0.15)" }}>
                                {TIPO_LABELS[informe.tipo] || informe.tipo}
                            </span>
                            <span className="td_badge" style={{ color: "#00dbe7", background: "rgba(0,219,231,0.12)" }}>
                                {formatFecha(informe.fecha)}
                            </span>
                            {eventoTitulo && (
                                <span className="td_badge" style={{ color: "#ebb2ff", background: "rgba(235,178,255,0.12)" }}>
                                    <MdEvent size={12} style={{ marginRight: 4 }} />
                                    {eventoTitulo}
                                </span>
                            )}
                        </div>
                    </div>
                    <button className="td_close_btn" onClick={onClose}><MdClose size={18} /></button>
                </div>
            </div>

            <DialogContent style={{ padding: "20px 24px 8px", display: "flex", flexDirection: "column", gap: 20 }}>
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                        <CircularProgress size={28} />
                    </div>
                ) : (
                    <>
                        {/* PDF Link */}
                        {informe.pdf_url && (
                            <a href={informe.pdf_url} target="_blank" rel="noopener noreferrer" className="inf_pdf_link">
                                <MdPictureAsPdf size={20} />
                                <span>Ver / Descargar PDF</span>
                            </a>
                        )}

                        {/* Attendees */}
                        {asistentes.length > 0 && (
                            <div className="td_section">
                                <div className="td_section_label">Asistencias ({asistentes.length})</div>
                                <div className="td_participants_row">
                                    {hasProfiles ? asistentes.map(a => {
                                        const p = a.profiles
                                        if (!p) return null
                                        return (
                                            <div key={p.id} className="td_participant">
                                                <div className="td_mini_avatar">
                                                    {p.avatar_url
                                                        ? <img src={p.avatar_url} alt="" />
                                                        : getInitials(p.full_name || p.username)
                                                    }
                                                </div>
                                                <span>{p.full_name || p.username}</span>
                                            </div>
                                        )
                                    }) : (
                                        <span style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>
                                            {asistentes.length} asistentes registrados
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Author */}
                        <div className="td_section">
                            <div className="td_section_label">Realizado por</div>
                            <div className="td_info_value">
                                {informe.profiles?.full_name || informe.profiles?.username || "—"}
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>

            <DialogActions style={{ padding: "12px 24px 20px", justifyContent: "space-between" }}>
                {canDelete ? (
                    <Button onClick={onDelete} color="error" startIcon={<MdDelete size={16} />}>Eliminar</Button>
                ) : <span />}
                <Button onClick={onClose} variant="outlined" color="inherit">Cerrar</Button>
            </DialogActions>
        </Dialog>
    )
}

function CreateInformeDialog({ eventos, onClose, onCreated }) {
    const [titulo, setTitulo] = useState("")
    const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
    const [tipo, setTipo] = useState("general")
    const [idEvento, setIdEvento] = useState("")
    const [pdfFile, setPdfFile] = useState(null)
    const [asistentesIds, setAsistentesIds] = useState([])
    const [profiles, setProfiles] = useState([])
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        getAllProfiles().then(({ profiles: data }) => setProfiles(data || []))
    }, [])

    function toggleAsistente(profileId) {
        setAsistentesIds(prev =>
            prev.includes(profileId)
                ? prev.filter(id => id !== profileId)
                : [...prev, profileId]
        )
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!titulo.trim() || !pdfFile) return

        setSubmitting(true)
        const { error } = await createInforme(
            { titulo: titulo.trim(), fecha, tipo, id_evento: idEvento || null },
            pdfFile,
            asistentesIds
        )
        setSubmitting(false)

        if (error) {
            alert("Error al crear informe: " + (error.message || "desconocido"))
            return
        }

        onCreated()
    }

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm"
            PaperProps={{ style: { borderRadius: 16, overflow: "hidden" } }}
        >
            <div className="td_header">
                <div className="td_header_inner">
                    <div className="td_title">Nuevo Informe</div>
                    <button className="td_close_btn" onClick={onClose}><MdClose size={18} /></button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <DialogContent style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Titulo */}
                    <div className="inf_form_group">
                        <label className="inf_form_label">Título</label>
                        <input
                            className="td_progreso_input"
                            type="text"
                            value={titulo}
                            onChange={e => setTitulo(e.target.value)}
                            placeholder="Reunión Comisión de Proyectos"
                            required
                            autoFocus
                        />
                    </div>

                    {/* Fecha + Tipo row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="inf_form_group">
                            <label className="inf_form_label">Fecha</label>
                            <input
                                className="td_progreso_input"
                                type="date"
                                value={fecha}
                                onChange={e => setFecha(e.target.value)}
                                required
                            />
                        </div>
                        <div className="inf_form_group">
                            <label className="inf_form_label">Tipo</label>
                            <Select
                                value={tipo}
                                onChange={e => setTipo(e.target.value)}
                                size="small"
                                sx={{
                                    backgroundColor: "var(--surface-container-low)",
                                    color: "var(--on-surface)",
                                    borderRadius: "10px",
                                    ".MuiOutlinedInput-notchedOutline": { border: "var(--ghost-border)" },
                                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--primary)" },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--primary)" },
                                }}
                            >
                                {TIPO_OPTIONS.map(o => (
                                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                ))}
                            </Select>
                        </div>
                    </div>

                    {/* Linked Evento */}
                    <div className="inf_form_group">
                        <label className="inf_form_label">Evento vinculado (opcional)</label>
                        <Select
                            value={idEvento}
                            onChange={e => setIdEvento(e.target.value)}
                            displayEmpty
                            size="small"
                            sx={{
                                backgroundColor: "var(--surface-container-low)",
                                color: "var(--on-surface)",
                                borderRadius: "10px",
                                ".MuiOutlinedInput-notchedOutline": { border: "var(--ghost-border)" },
                                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--primary)" },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--primary)" },
                            }}
                        >
                            <MenuItem value=""><em>Sin evento vinculado</em></MenuItem>
                            {eventos.map(ev => (
                                <MenuItem key={ev.id_evento} value={ev.id_evento}>
                                    {ev.titulo} — {new Date(ev.inicio).toLocaleDateString("es-AR")}
                                </MenuItem>
                            ))}
                        </Select>
                    </div>

                    {/* PDF Upload */}
                    <div className="inf_form_group">
                        <label className="inf_form_label">Archivo PDF</label>
                        <div className="inf_file_upload">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={e => setPdfFile(e.target.files?.[0] || null)}
                                id="pdf-upload"
                                style={{ display: "none" }}
                                required
                            />
                            <label htmlFor="pdf-upload" className="inf_file_upload_btn">
                                <MdPictureAsPdf size={18} />
                                <span>{pdfFile ? pdfFile.name : "Seleccionar PDF"}</span>
                            </label>
                        </div>
                    </div>

                    {/* Attendees */}
                    <div className="inf_form_group">
                        <label className="inf_form_label">Asistentes (opcional)</label>
                        <Autocomplete
                            multiple
                            options={profiles}
                            getOptionLabel={(option) => option.full_name || option.username || ""}
                            value={profiles.filter(p => asistentesIds.includes(p.id))}
                            onChange={(_, newValue) => setAsistentesIds(newValue.map(v => v.id))}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        {...getTagProps({ index })}
                                        key={option.id}
                                        avatar={
                                            <div className="td_mini_avatar" style={{ width: 22, height: 22 }}>
                                                {option.avatar_url
                                                    ? <img src={option.avatar_url} alt="" />
                                                    : getInitials(option.full_name || option.username)
                                                }
                                            </div>
                                        }
                                        label={option.full_name || option.username}
                                        sx={{
                                            backgroundColor: "rgba(159, 163, 255, 0.15)",
                                            border: "1px solid rgba(159, 163, 255, 0.35)",
                                            color: "var(--primary)",
                                            borderRadius: "999px",
                                        }}
                                    />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Buscar integrantes..."
                                    size="small"
                                    sx={{
                                        backgroundColor: "var(--surface-container-low)",
                                        borderRadius: "10px",
                                        ".MuiOutlinedInput-notchedOutline": { border: "var(--ghost-border)" },
                                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--primary)" },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--primary)" },
                                        "& .MuiInputBase-input": { color: "var(--on-surface)" }
                                    }}
                                />
                            )}
                            componentsProps={{
                                paper: {
                                    sx: {
                                        backgroundColor: "var(--surface-container-high)",
                                        color: "var(--on-surface)",
                                        border: "var(--ghost-border)"
                                    }
                                }
                            }}
                        />
                    </div>
                </DialogContent>

                <DialogActions style={{ padding: "12px 24px 20px" }}>
                    <Button onClick={onClose} variant="outlined" color="inherit" disabled={submitting}>Cancelar</Button>
                    <button
                        className="td_progreso_submit_btn"
                        type="submit"
                        disabled={submitting || !titulo.trim() || !pdfFile}
                        style={{ padding: "8px 20px" }}
                    >
                        {submitting ? "Subiendo..." : "Crear Informe"}
                    </button>
                </DialogActions>
            </form>
        </Dialog>
    )
}
