"""Exercise a running API. Use a disposable database (see README)."""
import json
import urllib.request
import urllib.error
import os

BASE = os.environ.get('TEST_API_URL', 'http://127.0.0.1:8001')
PATIENT = dict(name='API Test Patient', age=28, gender='Female', heart_rate=72,
               systolic_bp=118, diastolic_bp=78, spo2=98, temperature=98.6, glucose=96, symptoms=[])


def request(path, data=None, status=200):
    req = urllib.request.Request(BASE + path, data=json.dumps(data).encode() if data is not None else None,
                                 headers={'Content-Type': 'application/json', 'Origin': 'http://localhost:5173'})
    try:
        response = urllib.request.urlopen(req)
    except urllib.error.HTTPError as error:
        response = error
    assert response.status == status, (path, response.status)
    assert response.headers.get('Access-Control-Allow-Origin') == 'http://localhost:5173'
    return json.load(response)


assert request('/')['educational_prototype']
assert request('/api/health')['database'] == 'connected'
assert request('/api/analyze', PATIENT)['health_score'] == 100
assert request('/api/analyze/sequential', PATIENT)['mode'] == 'sequential'
assert request('/api/analyze/parallel', PATIENT)['mode'] == 'parallel'
comparison = request('/api/analyze/compare', PATIENT)
assert comparison['sequential']['results'] == comparison['parallel']['results']
assert abs(comparison['speedup'] - comparison['sequential']['total_ms'] / comparison['parallel']['total_ms']) < 1e-9
assert abs(comparison['improvement_percent'] - (1 - comparison['parallel']['total_ms'] / comparison['sequential']['total_ms']) * 100) < 1e-9
saved = request('/api/patients', PATIENT, 201)
assert any(item['id'] == saved['id'] for item in request('/api/patients'))
assert request('/api/patients/' + str(saved['id']))['analysis']['health_score'] == 100
request('/api/patients/999999999', status=404)
request('/api/analyze', {**PATIENT, 'heart_rate': -1}, 422)
request('/api/analyze', {**PATIENT, 'name': '  '}, 422)
print(json.dumps({'result': 'All 9 API routes, CORS, validation, save/list/detail and measured formulas passed',
                  'sequential_ms': comparison['sequential']['total_ms'], 'parallel_ms': comparison['parallel']['total_ms'], 'speedup': comparison['speedup']}, indent=2))
