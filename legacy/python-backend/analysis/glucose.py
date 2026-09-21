from analysis.common import result


def analyze_glucose(value):
    status = 'Normal' if 70 <= value < 100 else 'Warning' if 54 <= value < 180 else 'Critical'
    return result(value, status, 'Demo fasting reference: 70–99 mg/dL. Meal timing affects real readings.')
