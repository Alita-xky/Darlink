import hashlib
import os
import re

import numpy as np
from crud import upsert_user_profile, get_all_profiles

_model = None
_available = True
_warned_fallback = False

EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "384"))
EMBEDDING_BACKEND = os.getenv("EMBEDDING_BACKEND", "auto").strip().lower()
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
EMBEDDING_LOCAL_FILES_ONLY = os.getenv("EMBEDDING_LOCAL_FILES_ONLY", "1") != "0"

_WORD_RE = re.compile(r"[a-z0-9]+|[\u4e00-\u9fff]+", re.IGNORECASE)


def get_model():
    global _model, _available
    if EMBEDDING_BACKEND in {"hash", "local_hash", "local-hash"}:
        return None
    if not _available:
        return None
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer(
                EMBEDDING_MODEL,
                local_files_only=EMBEDDING_LOCAL_FILES_ONLY,
            )
        except Exception as exc:
            print(f"⚠ sentence_transformers unavailable, falling back to local hash embeddings: {exc}")
            _available = False
            return None
    return _model


def _tokens(text: str):
    raw = (text or "").lower()
    tokens = []
    for match in _WORD_RE.findall(raw):
        if not match:
            continue
        tokens.append(match)
        if re.fullmatch(r"[\u4e00-\u9fff]+", match):
            tokens.extend(match[i : i + 2] for i in range(max(0, len(match) - 1)))
        elif len(match) > 4:
            tokens.extend(match[i : i + 4] for i in range(max(0, len(match) - 3)))
    return tokens


def _hash_embed_text(text: str):
    """Deterministic local fallback embedding.

    This is less semantic than a transformer model, but it keeps matching online in
    restricted deployments where the sentence-transformer model is not cached and
    cannot be downloaded.
    """
    global _warned_fallback
    if not _warned_fallback:
        print("ℹ using local hash embeddings")
        _warned_fallback = True
    vec = np.zeros(EMBEDDING_DIM, dtype=np.float32)
    for token in _tokens(text):
        digest = hashlib.blake2b(token.encode("utf-8"), digest_size=16).digest()
        idx = int.from_bytes(digest[:4], "big") % EMBEDDING_DIM
        sign = 1.0 if digest[4] & 1 else -1.0
        vec[idx] += sign
    norm = np.linalg.norm(vec)
    if norm == 0:
        return []
    return (vec / norm).tolist()


def embed_text(text: str):
    model = get_model()
    if model is not None:
        try:
            vec = model.encode(text, normalize_embeddings=True)
            return vec.tolist()
        except Exception as exc:
            print(f"⚠ sentence_transformer encode failed, falling back to local hash embeddings: {exc}")
    return _hash_embed_text(text)


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
