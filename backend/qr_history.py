"""
Query functions for the qr_codes table — save a new QR, list history, delete one.
"""

from db import get_connection


def save_qr_record(
    qr_type: str,
    payload: str,
    image_base64: str,
    label: str | None = None,
    user_id: str | None = None,
    fill_color: str = "#000000",
    back_color: str = "#FFFFFF",
    size: int = 10,
    has_logo: bool = False,
) -> dict:
    """Inserts a new QR code record and returns the saved row."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO qr_codes
                    (user_id, label, qr_type, payload, fill_color, back_color, size, has_logo, image_base64)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, label, qr_type, payload, created_at;
                """,
                (user_id, label, qr_type, payload, fill_color, back_color, size, has_logo, image_base64),
            )
            row = cur.fetchone()
            conn.commit()
            return dict(row)


def list_qr_history(user_id: str | None = None, limit: int = 50) -> list[dict]:
    """Returns recent QR codes, newest first."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            if user_id:
                cur.execute(
                    """
                    SELECT id, label, qr_type, payload, fill_color, back_color,
                           size, has_logo, image_base64, created_at, expires_at
                    FROM qr_codes
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    LIMIT %s;
                    """,
                    (user_id, limit),
                )
            else:
                cur.execute(
                    """
                    SELECT id, label, qr_type, payload, fill_color, back_color,
                           size, has_logo, image_base64, created_at, expires_at
                    FROM qr_codes
                    ORDER BY created_at DESC
                    LIMIT %s;
                    """,
                    (limit,),
                )
            rows = cur.fetchall()
            return [dict(r) for r in rows]


def delete_qr_record(qr_id: int) -> bool:
    """Deletes a QR record by id. Returns True if a row was actually deleted."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM qr_codes WHERE id = %s;", (qr_id,))
            deleted = cur.rowcount > 0
            conn.commit()
            return deleted