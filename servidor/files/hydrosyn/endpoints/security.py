
# cambair contraseña suaurio db
# reajsutar db, alerat notificacionc apacidad

#extender tiempo suaurios login o recueparrc ontarseña ver logs
# añadir nombre a la lista negra
# estadisticas y cosas
# borra sesionde usaurios ald esactivar
# seguridad contraseñas y  seguridad  nombres
#notificacioens
# extender epriodos

#ber posy y añadir

@router.get("/blacklist", response_class=HTMLResponse)
async def see_blacklist_get(request: Request):
    try:
        prefs = get_user_preferences(request)
        csrf_token = generate_csrf_token()
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)

    return templates.TemplateResponse("blacklist.html", {
        "request": request,
        "texts": prefs["texts"],
        "lang": prefs["lang"],
        "theme": prefs["theme"],
        "csrf_token": csrf_token
    })





