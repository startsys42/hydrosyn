#!/bin/bash
COLOR_BG_IMPAR="46"
COLOR_BG_PAR="43"
ins-paq python3
if [ $? -ne 0 ]; then
 
    exit 1
fi

ins-paq python3-pip
if [ $? -ne 0 ]; then
 
    exit 1
fi

ins-paq python3-venv
if [ $? -ne 0 ]; then
 
    exit 1
fi


mkdir /opt/hydrosyn
cd  /opt/hydrosyn
python3 -m venv venv
source venv/bin/activate
pip3 install fastapi uvicorn JINJA2

uvicorn main:app --host 0.0.0.0 --port  $APP_PORT--reload
