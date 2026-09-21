import json
import os
import sqlite3
from pathlib import Path

DB_PATH = Path(os.environ.get('SMARTHEALTH_DB', Path(__file__).parent / 'healthcare.db'))


def connect():
    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    return connection


def initialize():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connect() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS patient_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL, age INTEGER NOT NULL, gender TEXT NOT NULL,
            heart_rate REAL NOT NULL, systolic_bp REAL NOT NULL, diastolic_bp REAL NOT NULL,
            spo2 REAL NOT NULL, temperature REAL NOT NULL, glucose REAL NOT NULL,
            symptoms TEXT NOT NULL, health_score INTEGER NOT NULL, risk_level TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )''')


def decode(row):
    record = dict(row)
    record['symptoms'] = json.loads(record['symptoms'])
    return record


def save(patient, analysis):
    values = patient.model_dump()
    values['symptoms'] = json.dumps(values['symptoms'])
    values.update(health_score=analysis['health_score'], risk_level=analysis['risk_level'])
    columns = list(values)
    with connect() as db:
        cursor = db.execute(f"INSERT INTO patient_analysis ({','.join(columns)}) VALUES ({','.join('?' for _ in columns)})", list(values.values()))
        return decode(db.execute('SELECT * FROM patient_analysis WHERE id = ?', (cursor.lastrowid,)).fetchone())


def recent():
    with connect() as db:
        return [decode(row) for row in db.execute('SELECT * FROM patient_analysis ORDER BY id DESC LIMIT 20')]


def get(record_id):
    with connect() as db:
        row = db.execute('SELECT * FROM patient_analysis WHERE id = ?', (record_id,)).fetchone()
        return decode(row) if row else None
