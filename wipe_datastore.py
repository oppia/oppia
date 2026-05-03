import subprocess
import os
import shutil

cache_dir = '/root/cloud_datastore_emulator_cache'
if os.path.exists(cache_dir):
    print(f"Removing {cache_dir}")
    shutil.rmtree(cache_dir)
else:
    print(f"{cache_dir} not found")
