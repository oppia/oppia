## ⚠️ Troubleshooting Environment Issues

### 🐍 Python Version "No suitable version found"
Even if you have Python 3.10.x, Oppia scripts might exit with an error. 
- **Check:** Run `python --version`. It must be exactly in the 3.10 branch.
- **Fix:** If you are using a slightly different sub-version (e.g., 3.10.20), ensure your virtual environment is cleanly created using:
  `python3.10 -m venv ../oppia_venv`

### 📦 Missing Third-Party Libraries
If you see `OSError: File ... messageformat.js does not exist`, it means the installation script didn't finish.
- **Solution:** Manually run the installation:
  `python -m scripts.install_third_party_libs`

### 🔄 The 20-Run Verification Loop
To prove a test is no longer flaky, it must pass 20 times consecutively:
```bash
for i in {1..20}; do 
    python -m scripts.run_e2e_tests --suite [SUITE_NAME] --skip_install
done