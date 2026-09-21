from analysis.common import result


def analyze_heart(value):
    status = 'Normal' if 60 <= value <= 100 else 'Warning' if 50 <= value <= 120 else 'Critical'
    return result(value, status, 'Within the demo resting range (60–100 BPM).' if status == 'Normal' else 'Outside the demo resting heart-rate range.')
