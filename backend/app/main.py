from fastapi import FastAPI

app = FastAPI(title="GigShield API")

@app.get("/health")
def health_check():
    return {"status": "ok"}