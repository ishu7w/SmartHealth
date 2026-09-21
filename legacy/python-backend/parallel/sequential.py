import time
from analysis.health_score import tasks
from parallel.workload import DELAYS, timed_task, package


def run_sequential(patient):
    start = time.perf_counter()
    outputs = [timed_task(name, fn, delay, start) for (name, fn), delay in zip(tasks(patient), DELAYS)]
    return package(patient, outputs, time.perf_counter() - start, 'sequential')
