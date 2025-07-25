from fastapi import Request

ERROR_MESSAGES = {
    
    "invalid_csrf": {
        "en": "Invalid CSRF token",
        "es": "Token CSRF inválido",
    },
    "credentials": {
        "en": "Invalid credentials",
        "es": "Credenciales incorrectas",
    }
}


LANGS = {
    "es": {
        "title": "¡Bienvenid@!",
        "login": "Iniciar sesión",
        "username": "Usuario",
        "password": "Contraseña",
        "email": "Email",
        "recover": "Recuperar",
        "back": "Volver",
        "change_lang": "Cambiar idioma",
        "change_theme": "Cambiar tema",
        "forgot": "Recuperar contraseña",
    },
    "en": {
        "title": "Welcome!",
        "login": "Login",
        "username": "Username",
        "password": "Password",
        "email": "Email",
        "recover": "Recover",
        "back": "Back",
        "change_lang": "Change language",
        "change_theme": "Change theme",
        "forgot": "Recover password",
    }
}
allowed_langs = ["es", "en"]
allowed_themes = ["light", "dark"]


def get_user_preferences(request: Request):
    # Validar parámetros query permitidos
    
    lang = getattr(request.state, "language", "en")
    theme = getattr(request.state, "theme", "light")

    if lang not in allowed_langs:
        lang = "en"
    if theme not in allowed_themes:
        theme = "light"
    if request.query_params:
        if lang == "es":
            detail_msg = "No se permiten parámetros en la URL"
        else:
            detail_msg = "No query parameters are allowed in the URL"
        raise HTTPException(status_code=400, detail=detail_msg)


    # Puedes actualizar la cookie aquí si quieres, pero eso ya sería parte del response

    texts = LANGS.get(lang, LANGS["en"])

    return {
        "lang": lang,
        "theme": theme,
        "texts": texts,
    }






 
