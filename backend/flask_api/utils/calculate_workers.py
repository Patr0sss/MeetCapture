import os

def calculate_workers(workload_type='mixed', safety_margin=2):
    logical_cores = os.cpu_count()  
    if logical_cores is None:
        raise RuntimeError("Unable to determine the number of CPU cores.")
    if workload_type == 'cpu':
        return max(1, logical_cores - safety_margin)
    elif workload_type == 'io':
        return max(1, (logical_cores * 2) - safety_margin)
    elif workload_type == 'mixed':
        return max(1, logical_cores - safety_margin)
    else:
        raise ValueError("Invalid workload_type. Use 'cpu', 'io', or 'mixed'.")

