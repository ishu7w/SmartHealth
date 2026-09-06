from analysis.common import result


def analyze_blood_pressure(systolic, diastolic):
    if systolic < 80 or diastolic < 50 or systolic >= 180 or diastolic >= 120:
        status = 'Critical'
    elif 90 <= systolic < 120 and 60 <= diastolic < 80:
        status = 'Normal'
    else:
        status = 'Warning'
    return result(f'{systolic:g} / {diastolic:g}', status, 'Demo reference: 90–119 / 60–79 mmHg. Both values are evaluated.')
