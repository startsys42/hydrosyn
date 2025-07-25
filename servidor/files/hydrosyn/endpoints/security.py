
# cambair contraseña suaurio db
# reajsutar db, alerat notificacionc apacidad

#extender tiempo suaurios login o recueparrc ontarseña ver logs
# añadir nombre a la lista negra
# estadisticas y cosas
# borra sesionde usaurios ald esactivar
# seguridad contraseñas y  seguridad  nombres
#notificacioens
# extender epriodos



@router.get("/see-blacklist", response_class=HTMLResponse)
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





@router.get("/db-autoincrement")
def autoincrement_get():
  



@router.post("/db-autoincrement")
def autoincrement_post():
    

    
    (3, 'es', 'Ver nombres lista negra', 'Permiso para ver los nombres en lista negra'),
(3, 'en', 'View blacklist names', 'Permission to view blacklist names'),

-- permiso 4
(4, 'es', 'Añadir nombres lista negra', 'Permiso para añadir nombres a la lista negra'),
(4, 'en', 'Add blacklist names', 'Permission to add names to blacklist'),

-- permiso 5
(5, 'es', 'Eliminar nombres lista negra', 'Permiso para eliminar nombres de la lista negra'),
(5, 'en', 'Remove blacklist names', 'Permission to remove names from blacklist'),




-- permiso 6
(6, 'es', 'Ver política de nombres', 'Permiso para ver la política de nombres'),
(6, 'en', 'View naming policy', 'Permission to view naming policy'),

-- permiso 7
(7, 'es', 'Cambiar política de nombres', 'Permiso para cambiar la política de nombres'),
(7, 'en', 'Change naming policy', 'Permission to change naming policy'),

-- permiso 8
(8, 'es', 'Ver política de contraseñas', 'Permiso para ver la política de contraseñas'),
(8, 'en', 'View password policy', 'Permission to view password policy'),

-- permiso 9
(9, 'es', 'Cambiar política de contraseñas', 'Permiso para cambiar la política de contraseñas'),
(9, 'en', 'Change password policy', 'Permission to change password policy'),