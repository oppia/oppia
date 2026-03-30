import hashlib
import json
import os
import platform
import sys

# Define where the cache manifest lives (ignored by git)
MANIFEST_PATH = os.path.join(os.getcwd(), 'pip_requirements_checksums.json')
REQUIREMENTS_FILES = ['requirements.txt', 'requirements_dev.txt']


class DependencyGatekeeper:
    def __init__(self, python_libs_dir):
        self.python_libs_dir = python_libs_dir

    def _get_env_metadata(self):
        """Captures Python version and OS to prevent cross-env drift."""
        return f"{sys.version}_{platform.platform()}_{sys.executable}"

    def calculate_current_fingerprint(self):
        """Generates a SHA256 hash of files and environment metadata."""
        sha256 = hashlib.sha256()

        # 1. Hash the contents of the requirement files
        for file_name in REQUIREMENTS_FILES:
            if not os.path.exists(file_name):
                return None  # Force install if files are missing
            with open(file_name, 'rb') as f:
                sha256.update(f.read())

        # 2. Add the environment string to the hash
        sha256.update(self._get_env_metadata().encode('utf-8'))
        return sha256.hexdigest()

    def is_install_required(self):
        """Returns True if we MUST run pip install, False if we can skip."""
        # Safety Check 1: Does the library folder even exist?
        if not os.path.exists(self.python_libs_dir) or not os.listdir(
            self.python_libs_dir
        ):
            return True

        # Safety Check 2: Does the manifest exist?
        if not os.path.exists(MANIFEST_PATH):
            return True

        # Check 3: Do the hashes match?
        current_hash = self.calculate_current_fingerprint()
        try:
            with open(MANIFEST_PATH, 'r') as f:
                cached_data = json.load(f)
                return cached_data.get('checksum') != current_hash
        except (json.JSONDecodeError, IOError):
            return True  # If JSON is corrupt, assume we need an install

    def record_success(self):
        """Updates the local JSON with the new fingerprint."""
        new_hash = self.calculate_current_fingerprint()
        if new_hash:
            with open(MANIFEST_PATH, 'w') as f:
                json.dump({'checksum': new_hash}, f, indent=2)
            print(f"Dependency manifest updated: {MANIFEST_PATH}")
