"use client"
export default function Perfil() {

    function setToken(token, id) {
        if (typeof window === "undefined") {
            return
        }
        sessionStorage.setItem('pwd', token)
        sessionStorage.setItem('user_id', id)
    }
    function getToken() {
        if (typeof window === "undefined") {
            return { token: null, id_usuario: null }
        }
        const token = sessionStorage.getItem('pwd')
        const id_usuario = sessionStorage.getItem('user_id')
        return { token: token, id_usuario: id_usuario }
    }

    function setName(name) {
        if (typeof window === "undefined") return
        sessionStorage.setItem('user_name', name)
    }

    function getName() {
        if (typeof window === "undefined") return null
        return sessionStorage.getItem('user_name')
    }

    function clear() {
        if (typeof window === "undefined") return
        sessionStorage.removeItem('pwd')
        sessionStorage.removeItem('user_id')
        sessionStorage.removeItem('user_name')
    }

    return {
        setToken: setToken,
        getToken: getToken,
        setName: setName,
        getName: getName,
        clear: clear,
    }

}
