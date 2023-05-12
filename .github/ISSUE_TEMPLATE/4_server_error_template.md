---
name: Server error
about: Report a production bug from the server logs
labels: triage needed, server errors
---
<!--
  - Before filing a new issue, please do a quick search to check that it hasn't
  - already been filed on the [issue tracker](https://github.com/oppia/oppia/issues)._
  -->

This error occurred recently in production

```
Add error logs here.
```

**Additional context** Add details from the logs, like the page the error occurred on. Make sure to anonymize user data like user IDs, exploration IDs, state names, user names, etc. Replace the personal data with appropriate placeholders.

**General instructions**
There are no specific repro steps available for this bug report. The general procedure to fix server errors should be the following:

* Analyze the code in the file where the error occurred and come up with a hypothesis for the reason.
* Get the logic of the proposed fix validated by an Oppia team member (have this discussion on the issue thread).
* Make a PR that fixes the issue, then close the issue on merging the PR. (If the error reoccurs in production, the issue will be reopened for further investigation.)
