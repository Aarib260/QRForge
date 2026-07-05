"""
Builds the raw string that gets encoded into the QR code,
based on the QR 'type' the user picked on the frontend.
"""

from urllib.parse import quote


def build_payload(qr_type: str, data: dict) -> str:
    qr_type = qr_type.lower()

    if qr_type == "url":
        url = data.get("url", "").strip()
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
        return url

    if qr_type == "text":
        return data.get("text", "")

    if qr_type == "wifi":
        # WIFI:T:WPA;S:MyNetwork;P:MyPassword;H:false;;
        ssid = _escape(data.get("ssid", ""))
        password = _escape(data.get("password", ""))
        security = data.get("security", "WPA").upper()  # WPA, WEP, or nopass
        hidden = "true" if data.get("hidden") else "false"

        if security == "NOPASS":
            return f"WIFI:T:nopass;S:{ssid};H:{hidden};;"
        return f"WIFI:T:{security};S:{ssid};P:{password};H:{hidden};;"

    if qr_type == "contact":
        # vCard 3.0 format — scans straight into Contacts app
        name = data.get("name", "")
        phone = data.get("phone", "")
        email = data.get("email", "")
        org = data.get("org", "")
        title = data.get("title", "")
        url = data.get("url", "")

        lines = ["BEGIN:VCARD", "VERSION:3.0", f"FN:{name}"]
        if org:
            lines.append(f"ORG:{org}")
        if title:
            lines.append(f"TITLE:{title}")
        if phone:
            lines.append(f"TEL;TYPE=CELL:{phone}")
        if email:
            lines.append(f"EMAIL:{email}")
        if url:
            lines.append(f"URL:{url}")
        lines.append("END:VCARD")
        return "\n".join(lines)

    if qr_type == "email":
        to = data.get("to", "")
        subject = quote(data.get("subject", ""))
        body = quote(data.get("body", ""))
        return f"mailto:{to}?subject={subject}&body={body}"

    if qr_type == "location":
        lat = data.get("lat", "0")
        lng = data.get("lng", "0")
        return f"geo:{lat},{lng}"

    # fallback — just dump whatever text was given
    return data.get("text", "")


def _escape(value: str) -> str:
    """Escape characters that are special in the WIFI: QR spec."""
    for ch in (";", ",", ":", "\\"):
        value = value.replace(ch, f"\\{ch}")
    return value