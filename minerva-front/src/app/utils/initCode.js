'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Perfil from './perfil';

export default function ClientInitializer() {
    const pathname = usePathname();
    const router = useRouter();
    useEffect(() => {
        const checkAuth = () => {
            // 1. Check if the user is on the login page
            const isLoginPage = pathname === "/login";

            // 2. Get the user status
            const hasToken = Perfil().getToken()?.id_usuario;

            if (!hasToken && !isLoginPage) {
                router.replace("/login");
            }

            if (hasToken && isLoginPage) {
                router.replace("/");
            }
        };

        checkAuth();
    }, [pathname, router]);

    return null;
}