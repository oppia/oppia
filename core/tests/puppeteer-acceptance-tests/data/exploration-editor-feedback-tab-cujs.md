# Critical User Journeys (CUJs) — Exploration Editor Feedback Tab (new)

> Gated behind feature flag `ExplorationEditorNewCreatorFeedbackTab`. Shown on
> the exploration editor's Feedback tab (`/create/<exploration_id>` → Feedback)
> **only when the flag is enabled AND the user can edit the exploration**;
> otherwise the legacy feedback tab renders. Detail views are deep-linkable via
> URL hash: `#/feedback/lesson_feedback/<id>` (lesson feedback) and
> `#/feedback/lesson_issue/<id>` (reports).
>
> | CUJ  | Status | Goal                                                                                                              | Known bugs / long-term notes | Figma mocks |
> | ---- | ------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------- |
> | EF.1 | GATED  | Can see the new Exploration Feedback tab and its default list.                                                    |                              |             |
> | EF.2 | GATED  | Can use the Feedback Type, status, date-range and description filters to view different feedback.                 |                              |             |
> | EF.3 | GATED  | Can open a feedback entry and view all of its content (message, lesson context, replies, screenshot for reports). |                              |             |
> | EF.4 | GATED  | Can change the status of a feedback entry from the detail view.                                                   |                              |             |
> | EF.5 | GATED  | Can reply to a learner's lesson feedback from the detail view.                                                    |                              |             |

---

## Shared test setup (used by all CUJs)

Create these users:

- `CreatorOwner` — creates and owns the exploration.
- `LoggedInLearner1`, `LoggedInLearner2` — regular logged-in learners.
- `LoggedOutLearner` — not logged in.

`CreatorOwner` creates an exploration named `test1` with 3 cards and publishes
it. Note the exploration id (`test1`).

How entries are produced:

- **Lesson feedback** (type "Feedback"): submitted by learners playing the
  lesson via the in-lesson feedback form ("options" → report/feedback). These
  carry lesson metadata (exploration id, version, state name, state index,
  learner answer).
- **Reports** (type "Report"): platform reports raised from the lesson player
  page with category _Typo_ or _Confusing / incorrect answer_ — these are
  routed to the curriculum queue for this exploration and appear under the
  "Report" type in this tab.

Ensure at least these entries exist:

| Entry  | Type            | Text                                           | By               | Lesson metadata       | Attachments         | Age        | Status         |
| ------ | --------------- | ---------------------------------------------- | ---------------- | --------------------- | ------------------- | ---------- | -------------- |
| Entry1 | Lesson feedback | "Question 2 is confusing."                     | LoggedInLearner1 | card 2 ("Question 2") | none                | 1 day ago  | Open           |
| Entry2 | Lesson feedback | "The last card does not accept my answer."     | LoggedInLearner2 | card 3                | none                | 2 days ago | Open           |
| Entry3 | Report          | "There is a typo in the question text." (Typo) | LoggedInLearner1 | card 1                | screenshot attached | 3 days ago | Open           |
| Entry4 | Lesson feedback | "Loved the visuals!"                           | LoggedInLearner2 | card 1                | none                | 4 days ago | Compliment     |
| Entry5 | Lesson feedback | "Why is this wrong?"                           | LoggedInLearner1 | card 2                | none                | 5 days ago | Not Actionable |

Notes:

- Non-Open statuses (Entry4, Entry5) can be pre-set by running EF.4 first or
  created directly via the backend in automated tests.
- The legacy feedback tab must still work when the flag is off — see EF.1.

---

## EF.1. Can see the new Exploration Feedback tab and its default list

**Status:** GATED

### Test setup

Shared test setup above, with feature flag `ExplorationEditorNewCreatorFeedbackTab` enabled.

### Steps and expectations

| Step                                                                                                                | Expectation                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Log in as `CreatorOwner` and open `/create/<test1>`; click the **Feedback** tab.                                    | A card titled "Exploration Feedback" is shown containing: filter bar (Status, Feedback Type, Description Filter, From Date, To Date, Apply, Clear) and a feedback table. The legacy thread UI is NOT shown. |
| Observe default filter values.                                                                                      | Status = **Open**, Feedback Type = **Feedback**, dates empty, search empty.                                                                                                                                 |
| Observe the table contents in default state.                                                                        | Only Open lesson-feedback entries for this exploration: Entry1, Entry2. Columns: Status, Description, Source. Sorted newest first. Entry4 (Compliment) and Entry5 (Not Actionable) are NOT visible.         |
| Observe pagination controls when more than one page exists.                                                         | "Page 1" label shown; Prev disabled on first page; Next enabled only when more results are available.                                                                                                       |
| Log in as `LoggedInLearner1`, open `/create/<test1>` (read-only preview path) if accessible.                        | Learners cannot access the editor; the new tab is never shown to non-editors.                                                                                                                               |
| Disable the feature flag (or run an environment where it is off); reload the editor Feedback tab as `CreatorOwner`. | The **legacy** feedback tab renders instead ("Start new thread" button, thread table, "No feedback has been given..." empty message).                                                                       |

---

## EF.2. Use filters to view different feedback

**Status:** GATED

### Test setup

Shared test setup above.

### Steps and expectations

| Step                                                                                                                    | Expectation                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open the Feedback tab as `CreatorOwner`.                                                                                | Default list shown (Open + Feedback type).                                                                                                                                         |
| Set Status = **Fixed**, click **Apply**.                                                                                | Empty state shown initially (no Fixed entries yet). Run EF.4 once and repeat: status-changed entries appear here.                                                                  |
| Set Status = **Compliment**, click **Apply**.                                                                           | Only Entry4 visible.                                                                                                                                                               |
| Set Status = **Not Actionable**, click **Apply**.                                                                       | Only Entry5 visible.                                                                                                                                                               |
| Switch Feedback Type dropdown to **Report**, keep Status = Open, click **Apply**.                                       | Table refreshes to show platform reports routed to this exploration: only Entry3. Columns now include **Category** ("Typo").                                                       |
| Combined: Type = Feedback, Status = Open, Description Filter = "answer".                                                | Table filters client-side to entries whose description contains "answer" (Entry2). Placeholder reads "Filter current page by description"; search applies to the loaded page only. |
| Clear the search box, set Type = Report, Status = Open; set From Date = today−2 days, To Date = today; click **Apply**. | Date inputs enforce To ≥ From and To ≤ today. With the range covering Entry3's age it stays visible; narrowing to "today only" hides it.                                           |
| Click **Clear**.                                                                                                        | Filters reset to defaults: Status = Open, Feedback Type = Feedback, dates cleared, search cleared; the default list reloads.                                                       |
| Pagination: with enough entries for two pages, click **Next**, then **Prev**.                                           | Page label increments/decrements; rows update accordingly; Prev is disabled again on page 1.                                                                                       |

---

## EF.3. View content of different feedback (message, lesson context, replies, screenshot)

**Status:** GATED

### Test setup

Shared test setup above.

### Steps and expectations

| Step                                                                                                              | Expectation                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| On the default list (Type = Feedback, Status = Open), click **Entry1**.                                           | URL hash becomes `#/feedback/lesson_feedback/<id>` and the detail view opens: back arrow (<), "Feedback Detail" heading, status chip at top right.                                                                                                                                                             |
| Observe the "Details" section.                                                                                    | Shows Submitted date, Status, and Source. No Category row for lesson feedback.                                                                                                                                                                                                                                 |
| Observe the "Lesson Context" section.                                                                             | Shows Exploration id (`test1`), Version, State name, State index, and Learner answer when available. Buttons "Open reported lesson version" and "Open current state in editor" are present and link to the correct pages.                                                                                      |
| Observe the "Session Information" section.                                                                        | NOT present for either type on this dashboard.                                                                                                                                                                                                                                                                 |
| Observe the "User's Feedback Message" section.                                                                    | Full text "Question 2 is confusing." is shown.                                                                                                                                                                                                                                                                 |
| Observe the "Replies" section.                                                                                    | Shows "No replies yet." for Entry1. Reply textarea ("Reply to reporter", placeholder "Write a reply the reporter will see...") with a Send button that is disabled while empty.                                                                                                                                |
| Click < (back button at top left).                                                                                | Returns to the list view; URL hash resets to `#/feedback`; previous filters retained.                                                                                                                                                                                                                          |
| Deep-link test: paste `/create/<test1>#/feedback/lesson_feedback/<entry2-id>` into the URL bar as `CreatorOwner`. | Detail view for Entry2 opens directly without clicking through the list.                                                                                                                                                                                                                                       |
| Switch type filter to **Report** (Status = Open), click **Entry3**.                                               | Hash becomes `#/feedback/lesson_issue/<id>`. Details include a **Category** row ("Typo") and category chip; attached **screenshot** is displayed with "Open screenshot in new tab"; Page URL field links to the page the report was raised from. Replies section and reply textarea are NOT shown for reports. |

---

## EF.4. Change the status of feedbacks

**Status:** GATED

### Test setup

Shared test setup above. Ensure at least one Open lesson-feedback entry exists
(e.g. Entry1).

### Steps and expectations

| Step                                                                             | Expectation                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Open **Entry1** from the default list.                                           | Detail view opens; status chip shows "Open". In Actions → Change status, buttons exist for Open, Fixed, Compliment, Not Actionable. The current status button ("Open") is disabled. A note "(Choosing Fixed status will also report the user)" is displayed above the buttons. |
| Click the **Compliment** button.                                                 | Success toast appears: "Feedback status updated to compliment." The status chip updates to "Compliment"; the Compliment button becomes disabled and Open re-enabled. The list behind the scenes is refreshed.                                                                  |
| Click < to go back; set Status = Compliment and click **Apply**.                 | Entry1 now appears in the Compliment list.                                                                                                                                                                                                                                     |
| Open Entry1 again and click **Fixed**.                                           | Toast confirms; chip shows "Fixed"; entry moves out of the Open list and appears under Fixed.                                                                                                                                                                                  |
| Reopen by clicking **Open**.                                                     | Chip returns to "Open"; entry reappears under the default Open list.                                                                                                                                                                                                           |
| Repeat a status change on a **Report** entry (Entry3): click **Not Actionable**. | Same toast/chip behaviour; entry moves accordingly in the Report-type list.                                                                                                                                                                                                    |

---

## EF.5. Reply to a learner's lesson feedback

**Status:** GATED

### Test setup

Shared test setup above.

### Steps and expectations

| Step                                                                                                                                           | Expectation                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open **Entry1** (Type = Feedback).                                                                                                             | Replies section shows "No replies yet."; the Send button is disabled while the textarea is empty.                                                                                       |
| Type "Thanks for pointing this out, we have fixed the question." into the reply textarea.                                                      | Send button becomes enabled.                                                                                                                                                            |
| Click **Send**.                                                                                                                                | Success toast: "Reply sent successfully." The Replies section now lists the new response with author header ("Creator") and timestamp. The textarea is cleared and Send disables again. |
| Go back and reopen Entry1.                                                                                                                     | The reply persists.                                                                                                                                                                     |
| Verify learner visibility (optional manual check): log in as `LoggedInLearner1` and view the feedback in the lesson player / learner surfaces. | The creator's reply is visible to the reporting learner.                                                                                                                                |

---

## Automated testing notes (desktop + mobile)

| Test file (under `core/tests/puppeteer-acceptance-tests/specs/`) | Coverage status | Notes                                                                           |
| ---------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------- |
| `exploration-editor/access-and-filters.spec.ts` (EF.1, EF.2)     | TODO            | Flag on/off gating, editor vs non-editor, both feedback types, filters + clear. |
| `exploration-editor/view-details.spec.ts` (EF.3)                 | TODO            | Lesson context fields, deep-link hashes, report screenshot/category.            |
| `exploration-editor/status-and-replies.spec.ts` (EF.4, EF.5)     | TODO            | Status transitions + toasts; reply send flow and persistence.                   |
