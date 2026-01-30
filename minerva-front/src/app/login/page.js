"use client"
import "@/app/login.css"
import { Box, Button, CircularProgress, Modal, TextField, Typography } from "@mui/material";
import { use, useEffect, useState } from "react";
import Perfil from "@/app/utils/perfil";
import { green } from '@mui/material/colors';
import { useRouter } from 'next/navigation'
import { signInUser } from "../utils/supaAuth";


const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export default function Login() {
    const [openM, setOpenM] = useState(false)
    const [pTemporal, setPTemporal] = useState(false)
    const [username, setUsername] = useState("")
    const [passwordUsuario, setPasswordUsuario] = useState("")
    const [passwordError, setPasswordError] = useState(false)
    const [loading, setLoading] = useState(false)

    let regex = /^[A-Za-z\d@.#$!%*?&]{8,}$/;
    const router = useRouter()
    useEffect(() => {
        if (Perfil().getToken().id_usuario) {
            router.replace("/")
        }
    }, [router])



    return (
        <div className="login_container">
            <Modal
                open={openM}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <TextField
                            style={{ marginBottom: 30 }}
                            id="standard-username-input"
                            label="Crea un nombre de usuario que igual sera tu correo ursa crux"
                            variant="standard"
                            size="small"
                            value={username}
                            onChange={(e) => { setUsername(e.target.value) }}
                        />
                        <TextField
                            style={{ marginBottom: 30 }}
                            id="standard-password-input"
                            label="Crea nueva password"
                            autoComplete="current-password"
                            variant="standard"
                            size="small"
                            value={passwordUsuario}
                            error={passwordError}
                            helperText={"Minimo 8 caracteres"}
                            onChange={(e) => { setPasswordUsuario(e.target.value) }}
                        />
                        <Button variant="outlined" onClick={() => {

                            if (regex.test(passwordUsuario)) {
                                Perfil().changePassword(username, passwordUsuario)
                                setOpenM(false)
                            } else {
                                alert("La Password debe tener al menos 6 caracteres")
                            }

                        }}>Crear</Button>
                        <Typography color="black">
                            Password temporal: {pTemporal}
                        </Typography>
                    </div>

                </Box>
            </Modal>
            <div className="login_form_container">
                <TextField
                    id="standard-user-input"
                    label="username"
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
                <Button variant="outlined" disabled={loading} onClick={async () => {
                    setLoading(true)
                    const data = await signInUser(username, passwordUsuario)
                    setLoading(false)

                }}>Ingresar</Button>
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
