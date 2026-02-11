## Overview
- Fixes #20198: Resolves the "Parameter 'key' required" console error on player pages.

1.  **PR Goal**: This PR updates the default title for player pages to use a valid i18n key during initialization.
2.  **Implementation**: Sets `TITLE` to `I18N_PLAYER_LOADING` in `assets/constants.ts` for multiple player pages. Also restricted ElasticSearch queries to specific fields (`title`, `objective` for explorations; `title`, `tags` for blog posts).
3.  **Cause of Bug**: The original bug occurred because the translation service received an empty string during component initialization in `BaseRootComponent`.

## Essential Checklist
- [x] I have linked the issue that this PR fixes in the "Development" section of the sidebar.
- [x] I have checked the "Files Changed" tab and confirmed that the changes are what I want to make.
- [x] I have written tests for my code (Updated `core.platform.search.elastic_search_services_test` and confirmed pass).
- [x] The **PR title** starts with "Fix #20198: ", followed by a short, clear summary of the changes.
- [x] I have assigned the correct reviewers to this PR.

## Proof that changes are correct
### Before
Console showed: `Parameter 'key' required` during player page load.

### After
- Console is clear.
- Browser tab title shows "Loading..." (localized) briefly before updating to the dynamic title.

## PR Pointers
- Never force push! If you do, your PR will be closed.
- To reply to reviewers, follow the instructions in the wiki.
- Some e2e tests are flaky; if they fail for reasons unrelated to your PR, check the wiki.
