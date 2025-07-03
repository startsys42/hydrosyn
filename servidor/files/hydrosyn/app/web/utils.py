from fastapi import Request

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
allowed_params = {"lang", "theme"}


def get_user_preferences(request: Request):
    # Validar parámetros query permitidos
    for param in request.query_params.keys():
        if param not in allowed_params:
            raise ValueError(f"Parámetro no permitido: {param}")

    # Obtener idioma y tema de query o sesión o defecto
    lang = request.query_params.get("lang") or request.session.get("lang") or "es"
    theme = request.query_params.get("theme") or request.session.get("theme") or "light"
    if lang not in allowed_langs:
        lang = request.session.get("lang") or "es"
    if theme not in allowed_themes:
        theme = request.session.get("theme") or "light"

    # Guardar en sesión
    request.session["lang"] = lang
    request.session["theme"] = theme

    next_lang = "en" if lang == "es" else "es"
    next_theme = "dark" if theme == "light" else "light"

    texts = LANGS.get(lang, LANGS["es"])

    return {
        "lang": lang,
        "theme": theme,
        "texts": texts,
    } 
