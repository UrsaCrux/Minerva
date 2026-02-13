"use client"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { MdLogout, MdHome, MdPeople, MdAssignment } from "react-icons/md"
import Perfil from "../utils/perfil"
import { signOutUser } from "../utils/supaAuth"
import { hasPermiso } from "../utils/supa"
import "@/app/dashboard.css"

export default function UserLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [navItems, setNavItems] = useState([
    { label: "Inicio", icon: <MdHome size={18} />, href: "/" },
    { label: "Tareas", icon: <MdAssignment size={18} />, href: "/tareas" },
  ])
  const router = useRouter()
  const pathname = usePathname()
  const userName = Perfil().getName() || "Usuario"

  useEffect(() => {
    async function checkPermisos() {
      const canEditUsers = await hasPermiso(1)
      if (canEditUsers) {
        setNavItems(prev => {
          if (prev.some(item => item.href === "/usuarios")) return prev
          return [...prev, { label: "Usuarios", icon: <MdPeople size={18} />, href: "/usuarios" }]
        })
      }
    }
    checkPermisos()
  }, [])

  const handleSignOut = async () => {
    await signOutUser()
    router.replace("/login")
  }

  return (
    <div>
      {/* Header */}
      <header className="dashboard_header">
        <div className="dashboard_header_left">
          <button
            className="dashboard_hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <span className="dashboard_header_title">Minerva</span>
        </div>
        <div className="dashboard_header_right">
          <span className="dashboard_username">{userName}</span>
          <button
            className="dashboard_signout"
            onClick={handleSignOut}
            title="Cerrar sesión"
          >
            <MdLogout size={20} />
          </button>
        </div>
      </header>

      {/* Sidebar overlay (mobile) */}
      <div
        className={`dashboard_sidebar_overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <nav className={`dashboard_sidebar ${sidebarOpen ? "open" : ""}`}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`dashboard_nav_item ${pathname === item.href ? "active" : ""}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Main content */}
      <main className={`dashboard_main ${sidebarOpen ? "shifted" : ""}`}>
        {children}
      </main>
    </div>
  )
}
