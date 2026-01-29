"use client"
export default function Perfil() {

    function setToken(token, id){
        if (typeof window === "undefined") {
            return
        }
        sessionStorage.setItem('pwd', token)
        sessionStorage.setItem('user_id', id)
    }
    function getToken(){
        if (typeof window === "undefined") {
            return { token: null, id_usuario: null }
        }
        const token = sessionStorage.getItem('pwd')
        const id_usuario = sessionStorage.getItem('user_id')
        return {token: token, id_usuario: id_usuario}
    }


    return{
        setToken: setToken,
        getToken: getToken
    }

}
