from fastapi import FastAPI
from fastapi.responses import HTMLResponse, RedirectResponse
import os
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from dotenv import load_dotenv
import sys
import urllib.request
import socket

import db as _db

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')
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

        "http://localhost:54113",
        "http://127.0.0.1:54113",
        "http://localhost:54114",
        "http://127.0.0.1:54114",
    ],
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


@app.on_event('startup')
async def on_startup():
    _db.create_tables()
    _db.ensure_session_skill_column()
    _db.ensure_auth_columns()  # 认证系统改造：给 users/email_verifications 补新列
    _db.ensure_community_comment_columns()
    from routes import persona as persona_routes
    from routes.ai import init_http_client
    import community_store
    import skill_loader
    persona_routes.sync_personas()
    community_store.ensure_community_seed_posts()
    await init_http_client()
    skill_loader.warm_cache()


@app.on_event('shutdown')
async def on_shutdown():
    from routes.ai import close_http_client
    await close_http_client()


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


from routes import auth, persona, chat, profile, distill, ai, contextual_chat, user_onboarding, plaza, friends, matching, community

app.include_router(auth.router)
app.include_router(persona.router)
app.include_router(chat.router)
app.include_router(profile.router)
app.include_router(distill.router)
app.include_router(ai.router)
app.include_router(contextual_chat.router)
app.include_router(user_onboarding.router)
app.include_router(plaza.router)
app.include_router(friends.router)
app.include_router(matching.router)
app.include_router(community.router)


@app.get('/health')
async def health():
    return {'ok': True, 'status': 'ok'}
 
