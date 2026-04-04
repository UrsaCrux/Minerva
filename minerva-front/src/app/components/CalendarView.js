"use client"
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import esLocale from '@fullcalendar/core/locales/es';
import listPlugin from '@fullcalendar/list';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import '../tareas.css';

import { useEffect, useRef, useState } from 'react';
import { Box, Button, Modal, Typography } from '@mui/material';
import FormInasistencia from './FormInasistencia';
import { createClient } from '../utils/client';
import { confirmarAsistencia, getEventos } from '../utils/supa';
import dayjs from 'dayjs';
import { MdClose, MdLocationOn, MdAccessTime, MdCheckCircle, MdCancel } from 'react-icons/md';

const modalBoxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    border: '2px solid',
    borderColor: 'divider',
    boxShadow: 24,
    p: 4,
};

export default function CalendarView() {
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [popoverPosition, setPopoverPosition] = useState({ x: 0, top: 0, bottom: 'auto' })
    const popoverRef = useRef(null)

    const [eventTitle, setEventTitle] = useState("")
    const [description, setDescription] = useState("")
    const [lugar, setLugar] = useState("")
    const [horaDisplay, setHoraDisplay] = useState("")
    const [eventId, setEventId] = useState()
    const [asistencia, setAsistencia] = useState(0)
    const [obligatorio, setObligatorio] = useState(false)

    const [openM, setOpenM] = useState(false)
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(false)
    const [userId, setUserId] = useState(null)

    useEffect(() => {
        createClient().auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.id) setUserId(session.user.id)
        })
    }, [])

    const fetchEvents = async () => {
        const userProfileId = userId;

        const { eventos, error } = await getEventos();
        if (error || !eventos) {
            console.error(error)
            setLoading(false)
            return;
        }

        const mappedEvents = eventos.map(ev => {
            const hInicio = dayjs(ev.inicio).format('HH:mm');
            const hFinal = ev.final ? dayjs(ev.final).format('HH:mm') : '';
            const horaD = ev.final ? `${hInicio} - ${hFinal}` : hInicio;

            const myRecord = (ev.eventos_usuarios ?? []).find(u => u.id_usuario === userProfileId);
            const myAsistencia = myRecord ? myRecord.asistencia : 0;

            return {
                title: ev.titulo,
                id_evento: ev.id_evento,
                start: ev.inicio,
                end: ev.final || ev.inicio,
                color: ev.obligatorio ? "#ef4444" : "#4f46e5",
                extendedProps: {
                    description: ev.descripcion,
                    lugar: ev.lugar,
                    horaDisplay: horaD,
                    asistencia: myAsistencia,
                    obligatorio: ev.obligatorio,
                }
            };
        });

        setEvents(mappedEvents)
        setLoading(false)
    }

    useEffect(() => {
        fetchEvents()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])

    // Close popover when clicking outside
    useEffect(() => {
        if (!popoverOpen) return;
        function handleClick(e) {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setPopoverOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [popoverOpen]);

    const handleConfirmar = async () => {
        const userProfileId = userId;
        if (!userProfileId) return alert("Error de sesión");

        const { error } = await confirmarAsistencia(eventId, userProfileId);
        if (error) {
            console.error("Error confirmando", error);
            alert("Error al Confirmar Asistencia");
        } else {
            setAsistencia(1);
            fetchEvents();
        }
    }

    const handleClose = () => setOpenM(false)

    // Calculate popover position relative to event
    function calculatePosition(rect) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const width = 290;
        const estimatedHeight = 320;
        
        let x = rect.left;
        let top = rect.bottom + 8;
        let bottom = 'auto';

        if (x + width > vw - 12) {
            x = vw - width - 12;
        }
        x = Math.max(x, 12);

        if (rect.bottom + estimatedHeight > vh - 12) {
            if (rect.top > vh - rect.bottom) {
                top = 'auto';
                bottom = vh - rect.top + 8;
            }
        }

        return { x, top, bottom };
    }

    return (
        <div style={{ height: "100%", position: "relative" }}>
            {/* Justification Modal */}
            <Modal open={openM} onClose={handleClose}>
                <Box sx={modalBoxStyle}>
                    <FormInasistencia
                        eventId={eventId}
                        handleClose={handleClose}
                        onSuccess={() => {
                            setAsistencia(2);
                            fetchEvents();
                        }}
                    />
                </Box>
            </Modal>

            {/* ── Modern Event Popover ── */}
            {popoverOpen && (
                <div
                    ref={popoverRef}
                    className="cal_popover"
                    style={{ top: popoverPosition.top, bottom: popoverPosition.bottom, left: popoverPosition.x }}
                >
                    {/* Header */}
                    <div className="cal_popover_header">
                        <div className="cal_popover_header_inner">
                            <div className="cal_popover_title">{eventTitle}</div>
                            <button
                                className="cal_popover_close"
                                onClick={() => setPopoverOpen(false)}
                                title="Cerrar"
                            >
                                <MdClose size={15} />
                            </button>
                        </div>
                        {/* Badge row */}
                        <div className="cal_popover_badges">
                            <span
                                className="cal_popover_badge"
                                style={obligatorio
                                    ? { color: '#dc2626', background: '#fee2e2' }
                                    : { color: '#4f46e5', background: '#eef2ff' }
                                }
                            >
                                {obligatorio ? 'Obligatorio' : 'Opcional'}
                            </span>
                            {asistencia === 1 && (
                                <span className="cal_popover_badge" style={{ color: '#16a34a', background: '#dcfce7' }}>
                                    Confirmado
                                </span>
                            )}
                            {asistencia === 2 && (
                                <span className="cal_popover_badge" style={{ color: '#d97706', background: '#fef3c7' }}>
                                    Justificado
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="cal_popover_body">
                        {/* Info grid */}
                        <div className="cal_popover_info_grid">
                            <div className="cal_popover_info_cell">
                                <div className="cal_popover_info_label">
                                    <MdAccessTime size={12} style={{ marginRight: 4 }} />Horario
                                </div>
                                <div className="cal_popover_info_value">{horaDisplay || '—'}</div>
                            </div>
                            <div className="cal_popover_info_cell">
                                <div className="cal_popover_info_label">
                                    <MdLocationOn size={12} style={{ marginRight: 4 }} />Lugar
                                </div>
                                <div className="cal_popover_info_value">{lugar || <span className="td_empty_value">Sin especificar</span>}</div>
                            </div>
                        </div>

                        {/* Description */}
                        {description && (
                            <div className="cal_popover_section">
                                <div className="cal_popover_section_label">Descripción</div>
                                <div className="cal_popover_description">{description}</div>
                            </div>
                        )}

                        {/* Status confirmation area */}
                        {asistencia === 1 && (
                            <div className="cal_popover_status cal_popover_status--confirmed">
                                <MdCheckCircle size={16} />
                                Asistencia Confirmada
                            </div>
                        )}
                        {asistencia === 2 && (
                            <div className="cal_popover_status cal_popover_status--justified">
                                <MdCancel size={16} />
                                Justificación Enviada
                            </div>
                        )}

                        {/* Actions */}
                        <div className="cal_popover_actions">
                            {asistencia !== 2 && (
                                <button
                                    className="cal_popover_btn cal_popover_btn--danger"
                                    onClick={() => {
                                        setOpenM(true);
                                        setPopoverOpen(false);
                                    }}
                                >
                                    Justificar Inasistencia
                                </button>
                            )}
                            {asistencia === 0 && (
                                <button
                                    className="cal_popover_btn cal_popover_btn--primary"
                                    onClick={handleConfirmar}
                                >
                                    Confirmar Asistencia
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Calendar */}
            <div style={{ height: "100%", width: "100%" }}>
                {loading && (
                    <Typography align="center" sx={{ p: 4 }}>Cargando calendario...</Typography>
                )}
                <FullCalendar
                    themeSystem='bootstrap5'
                    plugins={[dayGridPlugin, listPlugin, bootstrap5Plugin]}
                    headerToolbar={{
                        start: 'title',
                        end: 'listMonth,dayGridMonth prev,next'
                    }}
                    initialView="dayGridMonth"
                    height={"100%"}
                    locale={esLocale}
                    events={events}
                    displayEventEnd={true}
                    eventTimeFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        meridiem: false,
                        hour12: false
                    }}
                    eventClick={(info) => {
                        info.jsEvent.stopPropagation();
                        setEventTitle(info.event.title)
                        setDescription(info.event.extendedProps.description)
                        setLugar(info.event.extendedProps.lugar)
                        setHoraDisplay(info.event.extendedProps.horaDisplay)
                        setEventId(info.event.extendedProps.id_evento)
                        setAsistencia(info.event.extendedProps.asistencia)
                        setObligatorio(info.event.extendedProps.obligatorio)

                        const rect = info.el.getBoundingClientRect();
                        const pos = calculatePosition(rect);
                        setPopoverPosition(pos)
                        setPopoverOpen(true)
                    }}
                />
            </div>
        </div>
    )
}
