"use client"
import { useState, useEffect } from "react"
import { getTeams, getEventos } from "../utils/supa"
import { createClient } from "../utils/client"
import CalendarView from "@/app/components/CalendarView"
import AssignedTasksCol from "@/app/components/AssignedTasksCol"
import DashboardAnnouncements from "@/app/components/DashboardAnnouncements"
import DashboardUpcomingEvents from "@/app/components/DashboardUpcomingEvents"
import DashboardAsistencia from "@/app/components/DashboardAsistencia"

export default function Home() {
  const [userId, setUserId] = useState(null)
  const [teams, setTeams] = useState([])
  const [eventos, setEventos] = useState([])

  useEffect(() => {
    let isMounted = true

    async function loadDashboardData() {
      const [sessionRes, teamsRes, eventosRes] = await Promise.all([
        createClient().auth.getSession(),
        getTeams(),
        getEventos(),
      ])
      if (!isMounted) return
      if (sessionRes.data.session?.user?.id) setUserId(sessionRes.data.session.user.id)
      setTeams(teamsRes.teams)
      setEventos(eventosRes.eventos)
    }

    loadDashboardData()
    return () => { isMounted = false }
  }, [])

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "var(--on-surface)", marginBottom: 16, flexShrink: 0 }}>
        Inicio
      </h1>

      <div className="home_grid" style={{ flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 20, overflow: 'hidden' }}>
          <AssignedTasksCol userId={userId} teams={teams} />
          <DashboardAnnouncements />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 20, overflow: 'hidden' }}>
          <DashboardAsistencia userId={userId} />
          <DashboardUpcomingEvents userId={userId} eventos={eventos} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div className="home_card home_card--no-glow" style={{ flex: 1, padding: 0 }}>
            <div style={{ height: "100%" }}>
              <CalendarView userId={userId} eventos={eventos} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
