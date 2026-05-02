import numpy as np
from sentence_transformers import SentenceTransformer
from crud import upsert_user_profile, get_all_profiles

_model = None


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model


def embed_text(text: str):
    model = get_model()
    vec = model.encode(text, normalize_embeddings=True)
    return vec.tolist()


def cosine_sim(a, b):
    a = np.array(a)
    b = np.array(b)
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def search_similar(query: str, topk: int = 3):
    qv = embed_text(query)
    profiles = get_all_profiles()
    scored = []
    for p in profiles:
        if not p.vector:
            continue
        score = cosine_sim(qv, p.vector)
        scored.append((score, p))
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[:topk]
