from main import app
@app.get("/")
async def root():
    return {
        "name": "QRForge API",
        "status": "online"
    }
