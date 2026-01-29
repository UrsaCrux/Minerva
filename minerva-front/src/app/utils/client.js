import {createClient as createSupabaseClient} from '@supabase/supabase-js';
import Perfil from './perfil';

export function createClient() {
    const { token } = Perfil().getToken();
    
    const options = {}

    if (token) {
        options.global = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    }

    return createSupabaseClient(
        process.env.NEXT_PUBLIC_dbUrl, 
        process.env.NEXT_PUBLIC_dbKey,
        options
    )
}