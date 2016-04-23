_Important: Please read the following instructions carefully before submitting a PR._

1. Make sure that the PR title starts with **"Fix #bugnum: "** (if applicable), followed by a clear one-line present-tense summary of the changes introduced in the PR. For example:

    ```
    Fix #bugnum: Introduce the first version of the collection editor.
    ```

1. Before submitting, make sure that the backend tests pass. You can run them locally using `bash scripts/run_backend_tests.sh`.

1. The frontend tests and linter should automatically run when you execute `git push ...` on your local machine. However, if that's causing problems, please make sure to file an issue (with logs), so that we can fix it. Thanks!
