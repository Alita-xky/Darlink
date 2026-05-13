from fastapi import FastAPI
from fastapi.responses import HTMLResponse, RedirectResponse
import os
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import sys
import urllib.request
import socket

import db as _db

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(title="Darlink API", version="0.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",

        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://10.7.94.211:8000",

        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://10.7.94.211:8081",

        "http://localhost:8082",
        "http://127.0.0.1:8082",
        "http://10.7.94.211:8082",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


@app.on_event('startup')
def on_startup():
    _db.create_tables()
    _db.ensure_session_skill_column()
    from routes import persona as persona_routes
    persona_routes.sync_personas()


@app.get("/", response_class=HTMLResponse)
async def index():
    index_file = FRONTEND_DIR / 'index.html'
    if index_file.exists():
        return HTMLResponse(index_file.read_text(encoding='utf-8'))
    # If a FRONTEND_URL is provided (e.g. Expo web dev server), redirect there
    frontend_url = os.getenv('FRONTEND_URL')
    if frontend_url:
        return RedirectResponse(frontend_url)

    # Try to auto-detect a running Expo/web frontend on common ports and hosts
    candidates = [
        "http://127.0.0.1:8081/",
        "http://localhost:8081/",
        "http://127.0.0.1:19006/",
        "http://localhost:19006/",
    ]
    # also try to detect LAN IP of the host
    try:
        host_ip = socket.gethostbyname(socket.gethostname())
        if host_ip:
            candidates.extend([
                f"http://{host_ip}:8081/",
                f"http://{host_ip}:19006/",
            ])
    except Exception:
        host_ip = None

    for url in candidates:
        try:
            with urllib.request.urlopen(url, timeout=1) as resp:
                if resp.status >= 200 and resp.status < 400:
                    return RedirectResponse(url)
        except Exception:
            continue
    return HTMLResponse("<h1>Darlink</h1><p>Front-end not found</p>")


from routes import auth, persona, chat, profile, distill

app.include_router(auth.router)
app.include_router(persona.router)
app.include_router(chat.router)
app.include_router(profile.router)
app.include_router(distill.router)


@app.get('/health')
async def health():
    return {'ok': True, 'status': 'ok'}
 
