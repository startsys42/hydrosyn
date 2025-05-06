#!/bin/bash
apt install -y python3 python3-pip python3-venv
mkdir /opt/hydrosyn
cd  /opt/hydrosyn
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
