import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


function Blacklist() {

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [language, setLanguage] = useState('es');
    const [theme, setTheme] = useState('light');

    // Obtener preferencias de idioma y tema (ejemplo)



    useEffect(() => {
        navigate('/blacklist', { replace: true });
        const fetchData = async () => {
            try {
                const res = await fetch('/api/blacklist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include', // importante para enviar y recibir cookies
                    body: JSON.stringify(),

                });
                if (!res.ok) throw new Error(`Error ${res.status}`);

                const jsonData = await res.json();

                // 1. Validación explícita de autenticación
                if (jsonData.isLoggedIn !== true) {  // !== true cubre false/undefined
                    console.warn('Redirigiendo a login - Usuario no autenticado');
                    navigate('/login', { replace: true, state: { from: 'blacklist' } });
                    return;
                }

                // 2. Validación de rol admin
                if (jsonData.isAdmin !== true) {  // Mismo principio que arriba
                    console.warn('Redirigiendo a dashboard - No es admin');
                    navigate('/dashboard', { replace: true });
                    return;
                }
                if (jsonData.changeName) {
                    navigate('/change-username', { replace: true });
                    return;
                }
                if (jsonData.changePassword) {
                    navigate('/change-password', { replace: true });
                    return;
                }
                setData(jsonData);
                setLanguage(jsonData.language || 'es');
                setTheme(jsonData.theme || 'light');

            } catch (err) {
                setError(err.message);
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    // Manejar selección de items
    const toggleItemSelection = (id) => {
        setSelectedItems(prev =>
            prev.includes(id)
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        );
    };

    // Eliminar items seleccionados
    const handleDelete = async () => {
        if (!selectedItems.length) return;

        const confirmDelete = window.confirm(
            language === 'es'
                ? '¿Estás seguro de eliminar los elementos seleccionados?'
                : 'Are you sure you want to delete the selected items?'
        );

        if (confirmDelete) {
            try {
                const response = await fetch('/api/blacklist-delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ ids: selectedItems }),
                });

                if (response.ok) {
                    // Actualizar la lista después de eliminar
                    setData(prev => ({
                        ...prev,
                        items: prev.items.filter(item => !selectedItems.includes(item.id))
                    }));
                    setSelectedItems([]);
                }
            } catch (err) {
                console.error('Error al eliminar:', err);
            }
        }
    };

    // Filtrar items basados en el término de búsqueda
    const filteredItems = data?.items?.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>{language === 'es' ? 'Cargando...' : 'Loading...'}</div>;
    if (error) return <div>Error: {error}</div>;

    // Textos según idioma
    const texts = {
        es: {
            title: 'Lista Negra',
            addButton: 'Añadir a Lista Negra',
            searchPlaceholder: 'Buscar...',
            deleteButton: 'Eliminar Seleccionados',
            columns: ['Nombre', 'Acciones']
        },
        en: {
            title: 'Blacklist',
            addButton: 'Add to Blacklist',
            searchPlaceholder: 'Search...',
            deleteButton: 'Delete Selected',
            columns: ['Name', 'Actions']
        }
    };

    return (
        <div className={`blacklist-container ${theme}`}>
            <h1>{texts[language].title}</h1>

            <div className="controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder={texts[language].searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <button
                    className="add-button"
                    onClick={() => navigate('/add-to-blacklist')}
                >
                    {texts[language].addButton}
                </button>
            </div>

            <table className="blacklist-table">
                <thead>
                    <tr>
                        <th>
                            <input
                                type="checkbox"
                                onChange={(e) => {
                                    const allIds = filteredItems?.map(item => item.id) || [];
                                    setSelectedItems(e.target.checked ? allIds : []);
                                }}
                                checked={selectedItems.length === filteredItems?.length && filteredItems.length > 0}
                            />
                        </th>
                        {texts[language].columns.map((col, index) => (
                            <th key={index}>{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {filteredItems?.map(item => (
                        <tr key={item.id}>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={selectedItems.includes(item.id)}
                                    onChange={() => toggleItemSelection(item.id)}
                                />
                            </td>
                            <td>{item.name}</td>
                            <td>
                                <button
                                    className="delete-btn"
                                    onClick={() => {
                                        setSelectedItems([item.id]);
                                        handleDelete();
                                    }}
                                >
                                    {language === 'es' ? 'Eliminar' : 'Delete'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedItems.length > 0 && (
                <div className="bulk-actions">
                    <button onClick={handleDelete}>
                        {texts[language].deleteButton} ({selectedItems.length})
                    </button>
                </div>
            )}
        </div>
    );
}

export default Blacklist;