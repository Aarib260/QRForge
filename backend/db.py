import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

DATABASE_URL = os.getenv("DATABASE_URL")

@contextmanager
def get_connection():
    """Yields a psycopg2 connection, always closed forward."""
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not set. Add it to your .env file."
            "(get the connection from your NEON dashboard.)"
        )
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    """Creates the qr_codes table if it doesnt exsist yet. Safe to call on every startup"""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS qr_codes (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT,
                    label TEXT,
                    qr_type TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    fill_color TEXT DEFAULT '#000000',
                    back_color TEXT DEFAULT '#FFFFFF',
                    size INTEGER DEFAULT 10,
                    has_logo BOOLEAN DEFAULT FALSE,
                    image_base64 TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    expires_at TIMESTAMPTZ
                );
                """
            )
            conn.commit()
