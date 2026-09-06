from contextlib import asynccontextmanager
import os
import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from schemas import PatientInput
from analysis.health_score import analyze_patient
from parallel.sequential import run_sequential
from parallel.parallel import run_parallel
from database import database


@asynccontextmanager
async def lifespan(app):
    database.initialize()
    yield


app = FastAPI(title='SmartHealth Academic API', version='1.0.0', lifespan=lifespan)
app.add_middleware(CORSMiddleware,
    allow_origins=os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173').split(','),
    allow_methods=['GET', 'POST'], allow_headers=['Content-Type'])


@app.exception_handler(sqlite3.Error)
async def database_error(request, exc):
    return JSONResponse(status_code=503, content={'detail': 'Storage is temporarily unavailable. Please retry.'})


@app.get('/')
def root():
    return {'name': 'SmartHealth API', 'docs': '/docs', 'educational_prototype': True}


@app.get('/api/health')
def health():
    with database.connect() as db:
        db.execute('SELECT 1').fetchone()
    return {'status': 'ok', 'database': 'connected', 'workers': 5}


@app.post('/api/analyze')
def analyze(patient: PatientInput):
    return analyze_patient(patient)


@app.post('/api/analyze/sequential')
def sequential(patient: PatientInput):
    return run_sequential(patient)


@app.post('/api/analyze/parallel')
def parallel(patient: PatientInput):
    return run_parallel(patient)


@app.post('/api/analyze/compare')
def compare(patient: PatientInput):
    sequential = run_sequential(patient)
    parallel = run_parallel(patient)
    return {'sequential': sequential, 'parallel': parallel,
            'speedup': sequential['total_ms'] / parallel['total_ms'],
            'improvement_percent': (1 - parallel['total_ms'] / sequential['total_ms']) * 100}


@app.post('/api/patients', status_code=201)
def save(patient: PatientInput):
    return database.save(patient, analyze_patient(patient))


@app.get('/api/patients')
def patients():
    return database.recent()


@app.get('/api/patients/{record_id}')
def patient(record_id: int):
    record = database.get(record_id)
    if not record:
        raise HTTPException(404, 'Analysis record not found.')
    return {**record, 'analysis': analyze_patient(PatientInput(**record))}
