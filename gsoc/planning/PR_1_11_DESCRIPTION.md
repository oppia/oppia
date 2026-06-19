## Title:

`[GSoC 2026] M 1.11 - Fix part of #24933: Gate translation acceptance tests behind the generic translation opportunities feature flag`

---

## Overview

1. This PR fixes part of #24933.
2. This PR does the following:

   - Gates the translation submission and translation review Puppeteer acceptance tests behind the `enable_translation_opps_with_new_opp_models` feature flag.
   - Specifically, it updates the following acceptance test specs to enable the feature flag via `ReleaseCoordinator` during setup (`beforeAll`):
     - [filter-the-translations.spec.ts](file:///home/rohan/Documents/opensource/oppia/core/tests/puppeteer-acceptance-tests/specs/translation-reviewer/filter-the-translations.spec.ts)
     - [review-the-translations.spec.ts](file:///home/rohan/Documents/opensource/oppia/core/tests/puppeteer-acceptance-tests/specs/translation-reviewer/review-the-translations.spec.ts)
     - [check-their-accomplishment.spec.ts](file:///home/rohan/Documents/opensource/oppia/core/tests/puppeteer-acceptance-tests/specs/translation-submitter/check-their-accomplishment.spec.ts)
     - [translate-exploration-in-target-language.spec.ts](file:///home/rohan/Documents/opensource/oppia/core/tests/puppeteer-acceptance-tests/specs/translation-submitter/translate-exploration-in-target-language.spec.ts)
   - Temporary: Added `--no-sandbox` and `--disable-setuid-sandbox` args to chromium launch parameters in [puppeteer-utils.ts](file:///home/rohan/Documents/opensource/oppia/core/tests/puppeteer-acceptance-tests/utilities/common/puppeteer-utils.ts) to handle headless/environment permission constraints during verification. (Can be reverted if needed).
   - **Branch Dependency**: This PR is branched off `gsoc-task-1.6` and incorporates the changes from `gsoc-task-1.5`. Since these branches are not yet merged, they are included in this PR's commit history.

3. (For bug-fixing PRs only) N/A

## Essential Checklist

Please follow the [instructions for making a code change](https://github.com/oppia/oppia/wiki/Make-a-pull-request).

- [ ] I have linked the issue that this PR fixes in the "Development" section of the sidebar.
- [x] I have checked the "Files Changed" tab and confirmed that the changes are what I want to make.
- [x] I have written tests for my code.
- [ ] The **PR title** starts with "Fix #bugnum: " or "Fix part of #bugnum: ...", followed by a short, clear summary of the changes.
- [ ] I have assigned the correct reviewers to this PR (or will leave a comment with the phrase "@{{reviewer_username}} PTAL" if I can't assign them directly).

## Testing doc (for PRs with Beam jobs that modify production server data)

N/A

## Proof that changes are correct

#### Proof of changes on desktop with slow/throttled network

No visual UI changes. This PR configures existing acceptance test suites to run under the generic V2 opportunities feature flag.

**Verification via Automated Tests:**

1. Ran Prettier, ESLint, and TypeScript type-checks to verify zero syntax or linting errors.

#### Proof of changes on mobile phone

N/A (No user-facing changes.)

#### Proof of changes in Arabic language

N/A (No user-facing changes.)

## PR Pointers

- Never force push! If you do, your PR will be closed.
- To reply to reviewers, follow these instructions: https://github.com/oppia/oppia/wiki/Rules-for-making-PRs#step-5-address-review-comments-until-all-reviewers-approve
- Some e2e tests are flaky, and can fail for reasons unrelated to your PR. We are working on fixing this, but in the meantime, if you need to restart the tests, please check the ["If your build fails" wiki page](https://github.com/oppia/oppia/wiki/If-CI-checks-fail-on-your-PR).
- See the [Code Owner's wiki page](https://github.com/oppia/oppia/wiki/Oppia's-code-owners-and-checks-to-be-carried-out-by-developers) for what code owners will expect.
