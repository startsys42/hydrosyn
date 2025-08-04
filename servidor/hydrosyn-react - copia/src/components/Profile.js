export default function Profile() {
    const navigate = useNavigate();
    const location = useLocation();
    const [appData, setAppData] = useState({
        language: 'en',       // Valor por defecto
        theme: 'light',       // Valor por defecto
        csrfToken: null,
        loggedIn: false,
        permissions: false
    });
    // Aquí ya tienes idioma, tema y csrfToken pasados por navigate()
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const [isCheckingAccess, setIsCheckingAccess] = useState(true);

    useEffect(() => {
        async function verifyAccess() {  // Cambiado de 'verify' a 'verifyAccess'
            setIsCheckingAccess(true);
            const result = await checkAccess();

            if (result.error) {
                // Error llamando al check
                navigate('/error', {
                    state: { code: 0, message: result.message },
                    replace: true,
                });
                return;
            }
            const { status, data } = result;
            setAppData(prev => ({
                ...prev,

                language: result.data?.language || prev.language,
                theme: result.data?.theme || prev.theme,
                csrfToken: result.data?.csrf || null,
                loggedIn: result.data?.loggedIn || false,
                permissions: result.data?.permission || false
            }));
            if (status === 401) {
                navigate('/error', {
                    state: {
                        code: status,
                        message: 'Unauthorized. Please log in.',
                    },
                });
                return;
            } else if (status >= 500) {
                navigate('/error', {
                    state: {
                        code: status,
                        message: 'Server error. Please try again later.',
                    },
                });
                return;
            } else if (status >= 400) {
                navigate('/error', {
                    state: {
                        code: status,
                        message: 'Request error. Please check your data.',
                    },
                });
                return;
            }
            if (result.data?.message && result.data.message.trim() !== "") {
                navigate('/error', {
                    state: {
                        code: 401,
                        message: result.data?.message,
                    },
                });
                return;
            } else if (!result.data?.loggedIn) {

                navigate('/login', {

                });
                return;

            }

        }

        verifyAccess();
    }, [location.key, navigate]);
