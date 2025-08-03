from fastapi import APIRouter, Request
from security.csrf import generate_csrf_token, validate_and_remove_csrf_token
from db.db_users import  is_in_blacklist_from_db

from fastapi.responses import JSONResponse
from security.email_messages import generate_2fa_email, generate_2fa_new_email
from security.password__name_validity import validate_password, validate_username 
from security.two_steps import generate_two_step_token, validate_two_step_token , remove_two_step_token
from security.email_validation import is_valid_email
from security.hash import verify_password
from db.db_profile import validate_username_in_db, is_valid_email_in_db, update_username_in_db, update_password_in_db
from db.db_auth import get_code_2fa_from_db
from security.hash import hash_password
router = APIRouter()
#  cambair idioma, cambiar contarseña, activar twofa, desativar twofa, actiavr  , ver correo. o inidcarloe n lso emnsajes



# Endpoints para cambiar nombre
@router.post("/change-name")
async def change_name(request: Request):
    # recibe el nombre valido sie s valdio, devuelvo 2fa y verifico
    request.state.json_data = await request.json() if request.method == "POST" else {}
    if not await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token")):
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    if await is_in_blacklist_from_db(request.state.json_data.get("username")):
    
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    if not await validate_username_in_db(request.state.json_data.get("username")):
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "username exists"
            }
        )
    if not validate_username((request.state.json_data.get("username"))):
        
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    else:
      
        if not await generate_2fa_email( request.state.user_id,request.state.email, request.state.language):
            return JSONResponse(
                status_code=202,
                content={
                    "ok": True,
                    "status": 202,
                    "language": request.state.language,
                    "theme": request.state.theme,
                    "message": "not"
                }
            )
                
        token_2fa=generate_two_step_token(request.state.user_id, request.state.session_id, False)
       
        return JSONResponse(status_code=200,
            content={
                "ok": True,
                "status": 200,
                "2fa": token_2fa,
                "username": request.state.json_data.get("username"),
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "yes"
                
            }
        )
           


@router.post("/change-password")
async def change_password(request: Request):
    # copruebo nueva y vueja contraseñaa, devuelvo 2fa y evriico
    request.state.json_data = await request.json() if request.method == "POST" else {}
    if not await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token")):
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    if request.state.json_data.get("new_password") != request.state.json_data.get("confirm_new_password"):
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    if not validate_password(request.state.username,request.state.json_data.get("new_password")):

        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    if verify_password(request.state.json_data.get("password"),request.state.password):
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    else:
      
        if not await generate_2fa_email( request.state.user_id,request.state.email, request.state.language):
            return JSONResponse(
                status_code=202,
                content={
                    "ok": True,
                    "status": 202,
                    "language": request.state.language,
                    "theme": request.state.theme,
                    "message": "not"
                }
            )
                
        token_2fa=generate_two_step_token(request.state.user_id, request.state.session_id, False)
       
        return JSONResponse(status_code=200,
            content={
                "ok": True,
                "status": 200,
                "2fa": token_2fa,
                "password": request.state.json_data.get("new_password"),
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "yes"
                
            }
        )

    





@router.post("/change-email")
async def change_email(request: Request):
    #AQUI TENGO QUE VALDIAR EL EMAIL VIEJO Y EL NUEVO
    request.state.json_data = await request.json() if request.method == "POST" else {}
    if not await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token")):
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    if request.state.json_data.get("email") != request.state.email:
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    if not await is_valid_email_in_db(request.state.json_data.get("new_email")):
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "email exists"
            }
        )
    if not await is_valid_email(request.state.json_data.get("new_email")):

        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    else:
      
        if not await generate_2fa_email( request.state.user_id,request.state.email, request.state.language):
            return JSONResponse(
                status_code=202,
                content={
                    "ok": True,
                    "status": 202,
                    "language": request.state.language,
                    "theme": request.state.theme,
                    "message": "not"
                }
            )
        second_code= await generate_2fa_new_email(request.state.user_id, request.state.json_data.get("new_email"), request.state.language)
        if not second_code:
            return JSONResponse(
                status_code=202,
                content={
                    "ok": True,
                    "status": 202,
                    "language": request.state.language,
                    "theme": request.state.theme,
                    "message": "not"
                }
            )
            
        token_2fa=generate_two_step_token(request.state.user_id, request.state.session_id, False)
       
        return JSONResponse(status_code=200,
            content={
                "ok": True,
                "status": 200,
                "2fa": token_2fa,
                "email": request.state.json_data.get("new_email"),
                "second_code": second_code,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "yes"
                
            }
        )

    
@router.post("/change-name-2fa")
async def change_name(request: Request):
    token_2fa=validate_two_step_token(request.state.json_data.get("token_2fa"))
    if not token_2fa:
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    else:
       
        if token_2fa["session_id"] != request.state.session_id or request.state.user_id != token_2fa["user_id"]:
         
            remove_two_step_token(request.state.json_data.get("token_2fa"))
            return JSONResponse(
                status_code=202,
                content={
                    "ok": True,
                    "status": 202,
                    "language": request.state.language,
                    "theme": request.state.theme,
                    "message": "not"
                }
            )
        else:
            if not validate_username(request.state.json_data.get("username")):
                remove_two_step_token(request.state.json_data.get("token_2fa"))
                return JSONResponse(
                    status_code=202,
                    content={
                        "ok": True,
                        "status": 202,
                        "language": request.state.language,
                        "theme": request.state.theme,
                        "message": "not"
                    }
                )
            if not await validate_username_in_db(request.state.json_data.get("username")):
                remove_two_step_token(request.state.json_data.get("token_2fa"))
                return JSONResponse(
                    status_code=202,
                    content={
                        "ok": True,
                        "status": 202,
                        "language": request.state.language,
                        "theme": request.state.theme,
                        "message": "username exists"
                    }
                )
            if await get_code_2fa_from_db(token_2fa["user_id"], request.state.json_data.get("code_2fa")):
                
                
            
                
                if await update_username_in_db(request.state.user_id, request.state.json_data.get("username")):
                
                    remove_two_step_token(request.state.json_data.get("token_2fa"))
               
                    request.state.success = True
                    # falta cerar historicod e cambair contraeña y ....
                    return JSONResponse(
                        status_code=200,
                        content={
                            "ok": True,
                            "status": 200,
                            "language": request.state.language,
                            "theme": request.state.theme,
                            "message": "yes",
                        
                        }
                    )
                else:
                    remove_two_step_token(request.state.json_data.get("token_2fa"))
                    return JSONResponse(
                        status_code=202,
                        content={
                            "ok": True,
                            "status": 202,
                            "language": request.state.language,
                            "theme": request.state.theme,
                            "message": "not"
                        }
                    )

            else:
                return JSONResponse(
                    status_code=202,
                    content={
                        "ok": True,
                        "status": 202,
                        "language": request.state.language,
                        "theme": request.state.theme,
                        "message": "same"
                    }
                )
                
@router.post("/change-password-2fa")
async def change_password(request: Request):
    token_2fa=validate_two_step_token(request.state.json_data.get("token_2fa"))
    if not token_2fa:
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    else:
       
        if token_2fa["session_id"] != request.state.session_id or request.state.user_id != token_2fa["user_id"]:
         
            remove_two_step_token(request.state.json_data.get("token_2fa"))
            return JSONResponse(
                status_code=202,
                content={
                    "ok": True,
                    "status": 202,
                    "language": request.state.language,
                    "theme": request.state.theme,
                    "message": "not"
                }
            )
        else:
            if not validate_password(request.state.username,request.state.json_data.get("new_password")):
                remove_two_step_token(request.state.json_data.get("token_2fa"))
                return JSONResponse(
                    status_code=202,
                    content={
                        "ok": True,
                        "status": 202,
                        "language": request.state.language,
                        "theme": request.state.theme,
                        "message": "not"
                    }
                )
            if await get_code_2fa_from_db(token_2fa["user_id"], request.state.json_data.get("code_2fa")):
                
                key = hash_password(request.state.json_data.get("new_password"))
                
                if await update_password_in_db(request.state.user_id, key):
                
                    remove_two_step_token(request.state.json_data.get("token_2fa"))
               
                    request.state.success = True
                    # falta cerar historicod e cambair contraeña y ....
                    return JSONResponse(
                        status_code=200,
                        content={
                            "ok": True,
                            "status": 200,
                            "language": request.state.language,
                            "theme": request.state.theme,
                            "message": "yes",
                        
                        }
                    )
                else:
                    remove_two_step_token(request.state.json_data.get("token_2fa"))
                    return JSONResponse(
                        status_code=202,
                        content={
                            "ok": True,
                            "status": 202,
                            "language": request.state.language,
                            "theme": request.state.theme,
                            "message": "not"
                        }
                    )

            else:
                return JSONResponse(
                    status_code=202,
                    content={
                        "ok": True,
                        "status": 202,
                        "language": request.state.language,
                        "theme": request.state.theme,
                        "message": "same"
                    }
                )
                