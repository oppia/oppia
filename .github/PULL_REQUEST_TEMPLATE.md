<!--
  - Thanks for submitting code to Oppia! Please fill out the following as part of
  - your pull request so we can review your code more easily.
  -->

## Explanation
<!--
  - Explain what your PR does. If this PR fixes an existing bug, please include
  - "Fixes #bugnum:" in the explanation so that GitHub can auto-close the issue
  - when this PR is merged.
  -->

## Checklist
- [ ] The PR title starts with "Fix #bugnum: ", followed by a short, clear summary of the changes. (If this PR fixes part of an issue, prefix the title with "Fix part of #bugnum: ...".)
- [ ] The PR explanation includes the words "Fixes #bugnum: ..." (or "Fixes part of #bugnum" if the PR only partially fixes an issue).
- [ ] The linter/Karma presubmit checks have passed.
  - These should run automatically, but if not, you can manually trigger them locally using `python scripts/pre_commit_linter.py` and `bash scripts/run_frontend_tests.sh`.
- [ ] The PR is made from a branch that's **not** called "develop".
- [ ] The PR follows the [style guide](https://github.com/oppia/oppia/wiki/Coding-style-guide).
- [ ] The PR is assigned to an appropriate reviewer.
  - If you're a new contributor, please ask on [Gitter](https://gitter.im/oppia/oppia-chat) for someone to assign a reviewer.
  - If you're not sure who the appropriate reviewer is, please assign to the issue's "owner" -- see the "talk-to" label on the issue.
