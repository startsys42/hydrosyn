from fastapi import APIRouter, Request
router = APIRouter()
## ver notificaciones, listar notificaciones , filtrar  , configurar no borrar notificacione sno leidas, marcar como elidas
# filtrar por tipo,leidas no leidas, fecha, palabra, amrcarcomo leidas


@router.post("/see-notifications", response_class=HTMLResponse)
async def see_notifications(
    request: Request,
    read: str = Form(None),           # "read", "unread", o None
    date_from: str = Form(None),      # formato: YYYY-MM-DD
    date_to: str = Form(None),
    type: str = Form(None),
    search: str = Form(None)
):
 

    return templates.TemplateResponse("notifications.html", {
        "request": request,
        "notifications": rows,
        "filters": {
            "read": read,
            "date_from": date_from,
            "date_to": date_to,
            "type": type,
            "search": search
        }
    })
