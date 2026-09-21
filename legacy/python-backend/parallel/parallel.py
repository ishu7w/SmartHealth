import time
from concurrent.futures import ThreadPoolExecutor
from analysis.health_score import tasks
from parallel.workload import DELAYS, timed_task, package


def run_parallel(patient):
    start = time.perf_counter()
    with ThreadPoolExecutor(max_workers=5, thread_name_prefix='health-worker') as executor:
        futures = [executor.submit(timed_task, name, fn, delay, start) for (name, fn), delay in zip(tasks(patient), DELAYS)]
        outputs = [future.result() for future in futures]
    return package(patient, outputs, time.perf_counter() - start, 'parallel')
