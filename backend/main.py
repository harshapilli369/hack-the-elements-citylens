from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import simulation

app = FastAPI(
    title="Chain Reaction API",
    description="Environmental cascade prediction engine for mass displacement events",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulation.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "online", "service": "Chain Reaction API"}
