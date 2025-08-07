import '../styles/theme.css';
import React, { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';

const ActivateUser = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const t = useTexts();

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from('user_profiles_info') // la VISTA
            .select('*')

        if (error) console.error('Error al cargar usuarios:', error)
        else setUsers(data)

        setLoading(false)
    }

    // ✅ Actualizar is_active directamente en la tabla `profile`
    const toggleActive = async (userId, currentValue) => {
        const { error } = await supabase
            .from('profile') // tabla real
            .update({ is_active: !currentValue })
            .eq('user', userId)

        if (error) {
            console.error('Error al actualizar is_active:', error)
        } else {
            // Actualiza localmente el estado para reflejar el cambio sin recargar
            setUsers((prev) =>
                prev.map((user) =>
                    user.user_id === userId
                        ? { ...user, is_active: !currentValue }
                        : user
                )
            )
        }
    }

    if (loading) return <p>Cargando usuarios...</p>

    return (
        <div className='div-main-login'>
            <h1>Usuarios</h1>
            <table>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Activo</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.user_id}>
                            <td>{user.email}</td>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={user.is_active}
                                    onChange={() => toggleActive(user.user_id, user.is_active)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default ActivateUser;