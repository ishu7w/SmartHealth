from analysis.heart import analyze_heart
from analysis.blood_pressure import analyze_blood_pressure
from analysis.oxygen import analyze_oxygen
from analysis.temperature import analyze_temperature
from analysis.glucose import analyze_glucose


def tasks(patient):
    return [
        ('heart_rate', lambda: analyze_heart(patient.heart_rate)),
        ('blood_pressure', lambda: analyze_blood_pressure(patient.systolic_bp, patient.diastolic_bp)),
        ('spo2', lambda: analyze_oxygen(patient.spo2)),
        ('temperature', lambda: analyze_temperature(patient.temperature)),
        ('glucose', lambda: analyze_glucose(patient.glucose)),
    ]


def summarize(results, symptoms):
    score = round(sum(item['score'] for item in results.values()) / len(results))
    # A critical parameter must never be hidden by averaging other normal values.
    high_risk = any(item['status'] == 'Critical' for item in results.values()) or any(s in symptoms for s in ['Chest Pain', 'Breathing Difficulty'])
    risk = 'High Risk' if high_risk else 'Needs Attention' if symptoms or any(item['status'] == 'Warning' for item in results.values()) else 'Healthy'
    return {'health_score': score, 'risk_level': risk, 'results': results,
            'symptoms': symptoms, 'symptom_note': 'Reported symptoms affect the overall status, not the numeric vital score.' if symptoms else 'No symptoms reported.'}


def analyze_patient(patient):
    return summarize({name: fn() for name, fn in tasks(patient)}, patient.symptoms)
