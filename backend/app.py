from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import sys

import db as _db

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(title="Darlink API", version="0.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000"],
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
    return HTMLResponse("<h1>Darlink</h1><p>Front-end not found</p>")


from routes import auth, persona, chat, profile

app.include_router(auth.router)
app.include_router(persona.router)
app.include_router(chat.router)
app.include_router(profile.router)


@app.get('/health')
async def health():
    return {'ok': True, 'status': 'ok'}
 
