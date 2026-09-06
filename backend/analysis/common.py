# These simplified rules are academic examples, not clinical decision rules.
def result(value, status, message):
    return {'value': value, 'status': status, 'message': message,
            'score': {'Normal': 100, 'Warning': 65, 'Critical': 25}[status]}
