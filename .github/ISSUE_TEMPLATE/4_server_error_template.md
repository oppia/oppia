---
name: Server error
about: Report a production bug from the server logs
labels: triage needed, server errors, bug
---

<!--
  - Before filing a new issue, please do a quick search to check that it hasn't
  - already been filed on the [issue tracker](https://github.com/oppia/oppia/issues)._
  -->

This error occurred recently in production:

```
Add error logs here.
```

**Where did the error occur?** Add the page the error occurred on.

**Which release did the error occur in?** Add the Oppia release version associated with the error.

**Frequency of occurrence** Add details about how many times the error occurred within a given time period (e.g. the last week, the last 30 days, etc.). This helps issue triagers establish severity.

**Additional context** Add any other context that would be useful. Make sure to anonymize user data like user IDs, exploration IDs, state names, user names, etc. Replace any personal data with appropriate placeholders.

**Reproduction steps** If possible, add reproduction steps, otherwise delete this section.

**General instructions for contributors**
In general, the procedure for fixing server errors should be the following:

- Analyze the code in the file where the error occurred and come up with a hypothesis for the reason.
- Based on your hypothesis, determine a list of steps that reliably reproduce the issue (or confirm any repro instructions that have been provided). For example, if your hypothesis is that the issue arises due to a delay in a response from the backend server, try to change the code so that the backend server always has a delay, and see if the error then shows up 100% of the time on your local machine.
- Explain your proposed fix, the logic behind it, and any other findings/context you have on this thread. You can also link to a [debugging doc](https://docs.google.com/document/d/1qRbvKjJ0A7NPVK8g6XJNISMx_6BuepoCL7F2eIfrGqM/edit) if you prefer.
- Get your approach validated by an Oppia team member.
- Make a PR that fixes the issue.
