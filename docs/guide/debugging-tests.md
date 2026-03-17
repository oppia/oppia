# Prescriptive Workflow for Debugging Tests

This guide provides a step-by-step workflow to debug E2E and Acceptance tests in Oppia.

## 1. Initial Analysis
- **Identify the Error:** Check the CI logs to see if it's a `TimeoutError` or `AssertionError`.
- **Examine Artifacts:** Download `zipped-screenshots` from the GitHub Actions Summary.
- **Compare:** Look at `actual.png` vs `expected.png` to see what went wrong.

## 2. Local Reproduction
- Run the specific suite to save time:
  `python -m scripts.run_acceptance_tests --suite="[SUITE_NAME]"`
- Toggle Headless Mode: Set `headless: false` in the config to watch the test run.

## 3. Fixing Flakes
- **Use Deterministic Waits:** Use `waitFor.elementToBeClickable()` instead of static sleeps.
- **Stress Testing:** Use the GitHub "Stress Test" action to run the test 20 times before merging.