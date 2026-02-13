"use client"
import "@/app/login.css"
import { Box, Button, CircularProgress, Modal, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import Perfil from "@/app/utils/perfil";
import { green } from '@mui/material/colors';
import { useRouter } from 'next/navigation'
import { signInUser, changePassword } from "../utils/supaAuth";
import { getProfileById, updateProfile } from "../utils/supa";

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 420,
    bgcolor: 'background.paper',
    borderRadius: '12px',
    boxShadow: 24,
    p: 4,
};

export default function Login() {
    const [username, setUsername] = useState("")
    const [passwordUsuario, setPasswordUsuario] = useState("")
    const [loading, setLoading] = useState(false)

    // First-login setup modal state
    const [showSetup, setShowSetup] = useState(false)
    const [setupLoading, setSetupLoading] = useState(false)
    const [newUsername, setNewUsername] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [setupError, setSetupError] = useState("")
    const [loggedUserId, setLoggedUserId] = useState(null)

    const router = useRouter()

    useEffect(() => {
        if (Perfil().getToken().id_usuario) {
            router.replace("/")
        }
    }, [router])

    const handleLogin = async () => {
        setLoading(true)
        const user = await signInUser(username, passwordUsuario)
        setLoading(false)

        if (!user) return

        // Check if this is the user's first login
        const { profile } = await getProfileById(user.id)

        if (profile && !profile.first_login) {
            // First login — show setup modal
            setLoggedUserId(user.id)
            setShowSetup(true)
        } else {
            // Returning user — store full_name and go to dashboard
            Perfil().setName(profile.full_name)
            router.replace("/")
        }
    }

    const handleSetupSubmit = async () => {
        setSetupError("")

        if (newUsername.length < 4) {
            setSetupError("El nombre de usuario debe tener al menos 4 caracteres.")
            return
        }
        if (newPassword.length < 8) {
            setSetupError("La contraseña debe tener al menos 8 caracteres.")
            return
        }
        if (newPassword !== confirmPassword) {
            setSetupError("Las contraseñas no coinciden.")
            return
        }

        setSetupLoading(true)
        try {
            // Update password via auth
            await changePassword(newUsername, newPassword)

            // Update profile with username and first_login
            const { error } = await updateProfile(loggedUserId, {
                username: newUsername,
                first_login: new Date().toISOString(),
            })

            if (error) {
                setSetupError("Error al guardar el perfil: " + error.message)
                setSetupLoading(false)
                return
            }

            Perfil().setName(newUsername)
            router.replace("/")
        } catch (err) {
            setSetupError("Ocurrió un error inesperado.")
            console.error(err)
        }
        setSetupLoading(false)
    }

    return (
        <div className="login_container">
            {/* First-login setup modal */}
            <Modal
                open={showSetup}
                disableEscapeKeyDown
                aria-labelledby="setup-modal-title"
            >
                <Box sx={modalStyle}>
                    <Typography id="setup-modal-title" variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                        Configuración inicial
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 3, color: "#666" }}>
                        Es tu primer inicio de sesión. Crea un nombre de usuario y una nueva contraseña para continuar.
                    </Typography>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <TextField
                            label="Nombre de usuario"
                            variant="standard"
                            size="small"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            helperText="Mínimo 4 caracteres"
                        />
                        <TextField
                            label="Nueva contraseña"
                            type="password"
                            variant="standard"
                            size="small"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            helperText="Mínimo 8 caracteres"
                        />
                        <TextField
                            label="Confirmar contraseña"
                            type="password"
                            variant="standard"
                            size="small"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {setupError && (
                            <Typography variant="body2" sx={{ color: "error.main" }}>
                                {setupError}
                            </Typography>
                        )}
                        <Button
                            variant="outlined"
                            disabled={setupLoading}
                            onClick={handleSetupSubmit}
                        >
                            {setupLoading ? <CircularProgress size={20} /> : "Guardar"}
                        </Button>
                    </div>
                </Box>
            </Modal>

            <h1 className="login_title">Minerva</h1>
            <div className="login_form_container">
                <TextField
                    id="standard-user-input"
                    label="Username"
                    type="text"
                    variant="standard"
                    size="small"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value) }}
                />
                <TextField
                    id="standard-password-input"
                    label="Password"
                    type="password"
                    variant="standard"
                    autoComplete="off"
                    size="small"
                    value={passwordUsuario}
                    onChange={(e) => { setPasswordUsuario(e.target.value) }}
                />
                <Button variant="outlined" disabled={loading} onClick={handleLogin}>Ingresar</Button>
                {loading && (
                    <CircularProgress
                        size={40}
                        sx={{
                            color: green[500],
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            marginTop: '-20px',
                            marginLeft: '-20px',
                        }}
                    />
                )}
            </div>
        </div >
    );
}
