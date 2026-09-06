from analysis.common import result


def analyze_temperature(value):
    status = 'Normal' if 97 <= value <= 99.5 else 'Warning' if 95 <= value <= 102.2 else 'Critical'
    return result(value, status, 'Demo reference: 97–99.5°F. Temperature is entered in Fahrenheit.')
