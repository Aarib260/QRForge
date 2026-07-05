**QRForge**
A custom QR code generator for websites, text, WiFi networks, contact cards, emails, and locations — with color/logo customization, PNG/SVG download, and a saved history.
```
*Features*
-6 QR types: Website, Text, WiFi, Contact (vCard), Email, Location
-Live preview — updates as you type, debounced
-Customization — QR color, background color, size, and an embeddable center logo
-Download as PNG or SVG
-History — saved QR codes persist in Postgres (Neon), with a slide-in drawer to browse and delete past codes
-Copy-to-clipboard on the raw encoded payload string
```
```
*Tech stack*
*Frontend*:
-Next.js (App Router) + TypeScript
-Tailwind CSS v4

*Backend*:
-FastAPI
-qrcode + Pillow for QR generation and logo embedding
-Neon PostgreSQL for history storage
```
*Project Structure for setting up locally*
```
backend/
├── main.py            # FastAPI app, all endpoints
├── qr_payloads.py      # builds the encoded string per QR type
├── qr_render.py        # renders PNG/SVG, handles logo embedding
├── db.py               # Neon connection + table setup
├── qr_history.py        # save/list/delete queries
└── requirements.txt

frontend/
├── app/
│   ├── page.tsx         # main UI
│   ├── layout.tsx
│   └── globals.css      # Tailwind v4 theme tokens
└── lib/
    └── api.ts           # fetch wrapper for the backend
```



```
*Running locally*
Backend:
bashcd backend
pip install -r requirements.txt

Create backend/.env:
DATABASE_URL=postgresql://user:password@your-neon-host/dbname?sslmode=require

bash: cd backend
uvicorn main:app --reload --port 8000 (To start backend)

Frontend:
bash: cd frontend
npm install

Create frontend/.env.local:

NEXT_PUBLIC_API_URL=http://localhost:8000

bash: npm run dev (To start frontend)

Open http://localhost:3000. The backend must be running for the live preview and save/history features to work.
```
