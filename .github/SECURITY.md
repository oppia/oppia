# Oppia Vulnerability Disclosure Process

This vulnerability disclosure process describes how we accept and respond to security vulnerabilities from both Oppia developers and others. Our process follows 4 steps: Report, Investigate, Remediate, and Disclose.

## Report

Reporters should email [security@oppia.org](mailto:security@oppia.org) or open a [GitHub Security Vulnerability Report](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) with:

* A description of the problem.
* Steps we can follow to reproduce the problem.
* Affected versions.
* If known, mitigations for the problem.

We will respond within 3 days of the reporter's submission to acknowledge receipt of their report. Here is a template acknowledgement message:

```
Hi $REPORTER,

Thank you for reporting this problem to us. We are currently investigating and will reach out sometime in the next 7 days once we have decided how to move forward or if we have any questions.

Thanks,

$OPPIA_SECURITY_TEAM_MEMBER
```

## Investigate

Immediately upon receiving a report of a security problem, a member of Oppia’s security team (the tech leads for now) will assemble a vulnerability response team (VRT). This team should:

* Include an Oppia tech lead.
* Include developers (most likely 1-2) with expertise in the part of the app affected by the problem.
* Include as few developers as possible to avoid premature publication of the problem.

The tech lead will designate one VRT member as the VRT lead responsible for driving our response. The VRT lead will immediately (ideally within 24 hours) investigate the report and classify it as:

* **Won’t fix**: The app is working as intended, the bug is not important enough for us to spend resources fixing, or the requested feature is not something we plan to implement.

* **Bug**: The problem identified is legitimate, but it is not a security issue. It will be resolved through our normal bug-fixing process.

* **Feature request**: The report identifies a new feature that should be implemented. It will be handled through our normal feature-development process.

* **Low-severity vulnerability**: The report identifies a security vulnerability that does not meet the high-severity criteria. It will be resolved through our normal bug-fixing process. A "security vulnerability" is unintended behavior with security implications. This is distinct from a feature request, which refers to cases where the code behaves as intended, but the reporter disagrees with that intention.

  For example, suppose we improperly sanitized user-provided data at the models layer such that user-provided code could be executed, but validation checks at the controller layer prevented an attacker from actually exploiting the vulnerability. This would be a security vulnerability because we do not intend for the models layer to allow user-provided code to execute, but it would be low-severity because the controllers layer would prevent exploitation.

* **High-severity vulnerability**: The report identifies an exploitable security vulnerability that, if exploited, could result in any of the following:

  * (Confidentiality) Unauthorized access to any sensitive data that shouldn't be made public. Here, "sensitive data" generally refers to both private user data, as well as information that could be used to gain access to private user data; if in doubt, consult the data owners.
  * (Integrity) Unauthorized edits to any data.
  * (Availability) Degraded system performance of the platform for users.

Note that while the VRT contains multiple individuals, it’s ultimately expected that the VRT lead drives the effort. This should be in collaboration with VRT members, but in cases of urgent vulnerabilities the VRT lead can operate authoritatively to mitigate or remediate the issue (i.e. they do not need VRT consensus or review, but they should leverage VRT team members as a source for information and help).

The VRT lead will notify the reporter of the classification and the reasoning behind the VRT’s decision within 7 days of the acknowledgement message. This notification should include links to any issues that were opened as a result of the report. For problems classified as bugs, feature requests, or low-severity vulnerabilities, issues will be opened and assigned to the relevant team.

The rest of this document describes how we handle high-severity vulnerabilities.

## Remediate

### Create a Coordination Channel

If the problem is confirmed as a high-severity vulnerability, the VRT will open a [GitHub security advisory](https://docs.github.com/en/code-security/repository-security-advisories/about-github-security-advisories-for-repositories) and, if both the VRT and reporter agree, add the reporter to the advisory so we can collaborate on it. We will coordinate work on the vulnerability via:

* **The GitHub security advisory.** These advisories will let us collaborate in private, and they are appropriate in cases where disclosing the vulnerability prior to remediating it could put our users or developers at risk.
* **(Optionally) An additional GitHub issue and pull request.** This will immediately disclose the vulnerability, and we will take this approach when immediate disclosure poses little risk to our users and developers. For example, when the vulnerability is already publicly known. Unlike security advisories, CI checks can run on these PRs.

Note that we will create a GitHub security advisory even if we choose to collaborate on a fix using an open issue or PR because we’ll want to publish the advisory when disclosing the vulnerability.

### Request a CVE

A CVE should be requested for all security vulnerabilities. Since we create a GitHub Security Advisory, we can [get a CVE from GitHub](https://docs.github.com/en/code-security/repository-security-advisories/about-github-security-advisories-for-repositories#cve-identification-numbers). As a backup, we can [get a CVE from MITRE](https://cveform.mitre.org/).

### Develop a Patch

Regardless of which approach we take, the VRT will prioritize developing a patch to fix (or at least mitigate) the vulnerability. If the vulnerability is easily exploitable, mitigation will take priority over all other work. Mitigation should be completed within 7 days of the report being classified as a high-severity vulnerability. Once mitigated, additional remediation steps can be handled through our usual bug-fixing process.

## Disclose

We generally follow a 90-day disclosure timeframe, meaning that we ask that reporters give us 90 days to fix vulnerabilities before publicly disclosing them. 90 days should be viewed as an upper bound, and we aim to remediate vulnerabilities as quickly as possible. In all cases, the disclosure timeline will be explicitly coordinated with the reporter, and we prefer to publicly disclose the vulnerability simultaneously with the reporter. Our disclosure will include credit for the reporter if they so wish.

In rare cases, it may be appropriate to delay public disclosure even after the patch has been published and deployed. However, since our source code is public, we must assume that attackers will quickly reverse-engineer the vulnerability from our patch, so we will err on the side of disclosing early.

Our public disclosure should take the form of a published GitHub Security Advisory. Here is a template:

```
# Security advisory for $CVEID

## Summary

<!--
A brief (as short as possible, about a paragraph) summary of the vulnerability using technical details. The goal of this is to allow the reader to do a quick assessment of what the bug is about.
-->

* **CVE**: $CVE-NUMBER
* **Affected versions**: $VERSIONS
* **Reporter**: $NAME $AFFILIATION

## Severity
<!--
[Low, Medium, HIGH, **CRITICAL**] - Accompany your assessment with a motivation, and even a good attack scenario to explain the risk associated with the vulnerability. Determine severity based on CVSS (https://www.first.org/cvss/user-guide).
-->

## Proof of Concept
<!--
Code or command lines. We want to offer a concrete, usable, and repeatable way for the reader to reproduce the issue. Often, this will be the proof of concept provided by the reporter.
-->

## Remediation and Mitigation
<!--
Known remediations. If one is a software update, note the version(s) that fix it.
-->

## Further Analysis
<!--
If you wish to add more context or information, we recommend adding it after the critical sections mentioned here. Also add whether you believe this vulnerability has been exploited in the wild.
-->

## Timeline

* Date reported: $REPORT_DATE

* Date fixed: $FIX_DATE

* Date disclosed: $DISCLOSURE_DATE
```

## References

This document was developed with the help of the [OSS Vulnerability Guide](https://github.com/ossf/oss-vulnerability-guide) and the [Secure Software Development Fundamentals course](https://github.com/ossf/secure-sw-dev-fundamentals/blob/main/secure_software_development_fundamentals.md) by the [Open Source Security Foundation](https://openssf.org/).
