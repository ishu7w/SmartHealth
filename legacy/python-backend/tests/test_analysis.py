import unittest
from schemas import PatientInput
from analysis.health_score import analyze_patient
from analysis.oxygen import analyze_oxygen
from analysis.blood_pressure import analyze_blood_pressure
from parallel.sequential import run_sequential
from parallel.parallel import run_parallel
from pydantic import ValidationError

SAMPLE = dict(name='Demo Patient', age=28, gender='Female', heart_rate=72,
              systolic_bp=118, diastolic_bp=78, spo2=98, temperature=98.6, glucose=96, symptoms=[])


class AnalysisTests(unittest.TestCase):
    def test_normal(self):
        result = analyze_patient(PatientInput(**SAMPLE))
        self.assertEqual(result['health_score'], 100)
        self.assertEqual(result['risk_level'], 'Healthy')

    def test_oxygen_boundaries(self):
        for value, status in [(95, 'Normal'), (94.9, 'Warning'), (90, 'Warning'), (89.9, 'Critical')]:
            self.assertEqual(analyze_oxygen(value)['status'], status)

    def test_both_pressure_values(self):
        self.assertEqual(analyze_blood_pressure(118, 90)['status'], 'Warning')
        self.assertEqual(analyze_blood_pressure(185, 78)['status'], 'Critical')

    def test_critical_not_hidden_by_average(self):
        result = analyze_patient(PatientInput(**{**SAMPLE, 'spo2': 85}))
        self.assertEqual(result['risk_level'], 'High Risk')
        self.assertEqual(result['health_score'], 85)

    def test_symptoms_affect_status(self):
        result = analyze_patient(PatientInput(**{**SAMPLE, 'symptoms': ['Chest Pain']}))
        self.assertEqual(result['risk_level'], 'High Risk')

    def test_invalid(self):
        for change in [{'age': -1}, {'name': ' '}, {'spo2': 101}, {'systolic_bp': 60, 'diastolic_bp': 90}, {'symptoms': ['Unknown']}]:
            with self.assertRaises(ValidationError):
                PatientInput(**{**SAMPLE, **change})

    def test_scheduling_and_equal_results(self):
        patient = PatientInput(**SAMPLE)
        sequential, parallel = run_sequential(patient), run_parallel(patient)
        self.assertEqual(sequential['results'], parallel['results'])
        self.assertGreater(sequential['total_ms'], 990)
        self.assertTrue(all(t['duration_ms'] >= 150 for t in parallel['tasks']))
        for previous, current in zip(sequential['tasks'], sequential['tasks'][1:]):
            self.assertGreaterEqual(current['start_ms'], previous['end_ms'])
        self.assertLess(max(t['start_ms'] for t in parallel['tasks']), min(t['end_ms'] for t in parallel['tasks']))
        self.assertEqual(len({t['worker'] for t in parallel['tasks']}), 5)


if __name__ == '__main__':
    unittest.main()
