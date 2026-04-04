"use client"
import { useState, useEffect } from "react"
import { getTeams } from "../utils/supa"
import { createClient } from "../utils/client"
import CalendarView from "@/app/components/CalendarView"
import AssignedTasksCol from "@/app/components/AssignedTasksCol"
import DashboardAnnouncements from "@/app/components/DashboardAnnouncements"
import DashboardUpcomingEvents from "@/app/components/DashboardUpcomingEvents"

export default function Home() {
  const [userId, setUserId] = useState(null)
  const [teams, setTeams] = useState([])

  useEffect(() => {
    let isMounted = true
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (isMounted && session?.user?.id) setUserId(session.user.id)
    })

    async function loadTeams() {
      const { teams } = await getTeams()
      if (isMounted) setTeams(teams)
    }
    loadTeams()
    return () => { isMounted = false }
  }, [])

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "var(--on-surface)", marginBottom: 16, flexShrink: 0 }}>
        Inicio
      </h1>

      <div className="home_grid" style={{ flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <AssignedTasksCol userId={userId} teams={teams} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 20, overflow: 'hidden' }}>
          <DashboardAnnouncements />
          <DashboardUpcomingEvents userId={userId} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div className="home_card" style={{ flex: 1, padding: 0 }}>
            <div style={{ height: "100%" }}>
              <CalendarView />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

