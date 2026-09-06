from analysis.common import result


def analyze_oxygen(value):
    status = 'Normal' if value >= 95 else 'Warning' if value >= 90 else 'Critical'
    return result(value, status, 'Within the demo oxygen range (95–100%).' if status == 'Normal' else 'Below the demo oxygen reference range.')
