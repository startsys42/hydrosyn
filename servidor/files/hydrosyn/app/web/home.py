
@router.get("/home", response_class=HTMLResponse)
async def home_get(request: Request):
    try:
        prefs = get_user_preferences(request)
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)

    return templates.TemplateResponse("home.html", {
        "request": request,
        "texts": prefs["texts"],
        "lang": prefs["lang"],
        "theme": prefs["theme"],
      
    })
