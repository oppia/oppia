## Overview
<!--
READ ME FIRST:
Please answer *both* questions below and check off every point from the Essential Checklist!
If there is no corresponding issue number, fill in N/A where it says [fill_in_number_here] below in 1.
-->

1. This PR fixes or fixes part of #[fill_in_number_here].
2. This PR does the following: [Explain here what your PR does and why]

## Essential Checklist

- [ ] The PR title starts with "Fix #bugnum: ", followed by a short, clear summary of the changes. (If this PR fixes part of an issue, prefix the title with "Fix part of #bugnum: ...".)
- [ ] The linter/Karma presubmit checks have passed locally on your machine.
- [ ] "Allow edits from maintainers" is checked. (See [here](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/allowing-changes-to-a-pull-request-branch-created-from-a-fork) for instructions on how to enable it.)
  - This lets reviewers restart your CircleCI tests for you.
- [ ] The PR is made from a branch that's **not** called "develop".

## Proof that changes are correct

<!--
Add videos/screenshots of the user-facing interface to demonstrate that the changes made in this PR work correctly.
-->

## PR Pointers

- Make sure to follow the [instructions for making a code change](https://github.com/oppia/oppia/wiki/Contributing-code-to-Oppia#instructions-for-making-a-code-change).
- Oppiabot will notify you when you don't add a PR_CHANGELOG label. If you are unable to do so, please @-mention a code owner (who will be in the Reviewers list), or ask on [Gitter](https://gitter.im/oppia/oppia-chat).
- For what code owners will expect, see the [Code Owner's wiki page](https://github.com/oppia/oppia/wiki/Oppia%27s-code-owners-and-checks-to-be-carried-out-by-developers).
- Make sure your PR follows conventions in the [style guide](https://github.com/oppia/oppia/wiki/Coding-style-guide), otherwise this will lead to review delays.
- Never force push. If you do, your PR will be closed.
- Oppiabot can assign anyone for review/help if you leave a comment like the following: "{{Question/comment}} @{{reviewer_username}} PTAL"
- Some of the e2e tests are flaky, and can fail for reasons unrelated to your PR. We are working on fixing this, but in the meantime, if you need to restart the tests, please check the ["If your build fails" wiki page](https://github.com/oppia/oppia/wiki/If-your-build-fails).
