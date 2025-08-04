import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './componentes/Login';
import Dashboard from './componentes/Dashboard';
import { useEffect, useState } from 'react';
import { supabase } from './utils/supabaseClient';
import { useTheme } from './utils/ThemeContext';
import { useLanguage } from './utils/LanguageContext';


function App() {
     const { theme, toggleTheme } = useTheme();
  const { language, changeLanguage } = useLanguage();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Revisa si hay sesión activa
    const session = supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));

    // Listener para cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

 return (
  <div className={theme === 'light' ? 'light-theme' : 'dark-theme'}>
    <Router>
      {/* controles para cambiar tema e idioma */}
      <div style={{ padding: 10 }}>
        <button onClick={toggleTheme}>
          Cambiar a {theme === 'light' ? 'modo oscuro' : 'modo claro'}
        </button>

        <select
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
          style={{ marginLeft: 10 }}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>

      <Routes>
        <Route
          path="/"
          element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  </div>
 );
    }
export default App;