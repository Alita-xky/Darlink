import numpy as np
from crud import upsert_user_profile, get_all_profiles

_model = None
_available = True


def get_model():
    global _model, _available
    if not _available:
        return None
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer('all-MiniLM-L6-v2')
        except ImportError:
            print("⚠ sentence_transformers not installed, embeddings disabled")
            _available = False
            return None
    return _model


def embed_text(text: str):
    model = get_model()
    if model is None:
        return []
    vec = model.encode(text, normalize_embeddings=True)
    return vec.tolist()


def cosine_sim(a, b):
    a = np.array(a)
    b = np.array(b)
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def search_similar(query: str, topk: int = 3):
    if not _available:
        return []
    qv = embed_text(query)
    if not qv:
        return []
    profiles = get_all_profiles()
    scored = []
    for p in profiles:
        if not p.vector:
            continue
        score = cosine_sim(qv, p.vector)
        scored.append((score, p))
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[:topk]
