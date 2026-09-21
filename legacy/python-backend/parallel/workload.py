import threading
import time
from analysis.health_score import tasks, summarize

# Identical delays for both modes; patient analysis never calls this function.
DELAYS = [0.20, 0.24, 0.18, 0.22, 0.16]


def timed_task(name, fn, delay, origin):
    start = time.perf_counter()
    time.sleep(delay)  # Simulated waiting work releases the GIL.
    output = fn()
    end = time.perf_counter()
    return {'parameter': name, 'duration_ms': (end - start) * 1000,
            'start_ms': (start - origin) * 1000, 'end_ms': (end - origin) * 1000,
            'worker': threading.current_thread().name, 'result': output}


def package(patient, task_results, elapsed, mode):
    analysis = summarize({task['parameter']: task['result'] for task in task_results}, patient.symptoms)
    return {**analysis, 'mode': mode, 'total_ms': elapsed * 1000, 'tasks': task_results,
            'simulated_workload': True, 'worker_count': 5 if mode == 'parallel' else 1}
