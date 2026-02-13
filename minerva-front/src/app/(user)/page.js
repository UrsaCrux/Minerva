"use client"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"

export default function Home() {
  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>
        Inicio
      </h1>
      <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 16 }}>
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          locale="es"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek",
          }}
          height="auto"
          events={[]}
        />
      </div>
    </div>
  )
}
