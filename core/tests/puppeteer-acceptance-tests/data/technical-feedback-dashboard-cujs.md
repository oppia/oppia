# Critical User Journeys (CUJs) — Technical Feedback Dashboard

> Gated behind feature flag `TechnicalFeedbackDashboardEnabled` **and** the
> `TECH_TEAM_LEAD` role. Without either, the page is inaccessible.
>
> **Routes:**
>
> - List page: `/technical-feedback-dashboard`
> - Detail page: `/technical-feedback-dashboard/<team>/<reportId>` (opened automatically when you click a row)
>
> **What is this page?**
> A dashboard for tech-team leads to review, triage and manage user-submitted
> bug reports that were not routed to the curriculum/creator dashboard (i.e.
> reports whose category is _not_ Typo or Confusing/incorrect answer).
>
> **How reports are routed to this page:**
> When a user submits a "Report a website issue", Oppia decides where it goes:
>
> 1. If the category is _Typo_ or _Confusing / incorrect answer_ → creator/
>    curriculum dashboard (not this page).
> 2. Otherwise the page URL where the report was submitted determines the
>    team queue:
>    - Pages in the LEAP list (`/about`, `/community-library`, `/contact`,
>      `/explore`, `/learn`, `/learner-dashboard`, `/lesson`, `/profile`,
>      `/partnerships`, `/preferences`, `/volunteer`, `/teach`, `/blog`,
>      `/donate`) → **LEAP** queue.
>    - Any other page (e.g. `/create/<id>`, `/signup`, `/moderator`) →
>      **CORE** queue.
>
> | CUJ  | Status | Goal                                                                                                                                          | Known bugs / long-term notes | Figma mocks |
> | ---- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------- |
> | TL.1 | GATED  | Can access the Technical Feedback Dashboard page, see the default list, and be prevented from accessing it when not authorised.               |                              |             |
> | TL.2 | GATED  | Can use every filter (Team, Status, Description search, Date range) and the Clear button to narrow or reset the feedback list.                |                              |             |
> | TL.3 | GATED  | Can view every detail of a feedback report — message, screenshot, session logs, lesson context (when raised from a lesson), and the page URL. |                              |             |
> | TL.4 | GATED  | Can change the status of a feedback report and confirm the change persists.                                                                   |                              |             |
> | TL.5 | GATED  | Can transfer a feedback report to GitHub, see the pre-filled issue form, and confirm the status changes.                                      |                              |             |

---

## Shared test setup (used by all TL CUJs)

### Users to create

| Username          | Role / note                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `techLead`        | Must be assigned the **Tech team lead** role (Admin → Roles → assign `TECH_TEAM_LEAD`). This is the only role that can access this dashboard. |
| `LoggedInUser`    | A regular logged-in user (no special role).                                                                                                   |
| `LoggedOutUser`   | A user who is NOT logged in (used to test that the page is inaccessible).                                                                     |
| `CurriculumAdmin` | A curriculum admin (used to create explorations if needed).                                                                                   |

### Exploration

`CurriculumAdmin` creates an exploration named **"test1"** and publishes it.
Note its exploration id (`test1`).

### Feedback entries to create

All entries below are **platform feedback reports** submitted through
**profile dropdown → "Report a website issue"** on the relevant page.

| #   | Submitted from page                             | Category              | Report text & attachments                                                                   | Submitted by  | Age (approx.) | Starting status | Team queue |
| --- | ----------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------- | ------------- | ------------- | --------------- | ---------- |
| 1   | `/learn`                                        | Other / not sure      | "Failing to load dashboard." Screenshot attached. Technical logs NOT checked.               | LoggedInUser  | 1 day ago     | Open            | LEAP       |
| 2   | `/community-library`                            | Broken layout / image | "Image layout is messed up, please fix it!" Screenshot attached AND technical logs checked. | LoggedOutUser | 3 days ago    | Open            | LEAP       |
| 3   | `/learn`                                        | Other / not sure      | "My goal progress is not matching." No screenshot, no logs.                                 | LoggedInUser  | 5 days ago    | Fixed           | LEAP       |
| 4   | Exploration editor of `test1` (`/create/test1`) | Other / not sure      | "Answer is not submitting in this card." Screenshot attached AND technical logs checked.    | LoggedInUser  | 2 days ago    | Open            | CORE       |
| 5   | Lesson player of `test1` (`/explore/test1`)     | Broken layout / image | "Buttons overlap on small screen." Screenshot attached AND technical logs checked.          | LoggedInUser  | 1 day ago     | Open            | LEAP       |

**Note on Entry 5:** Because it was submitted from a lesson player page
(`/explore/...`), it carries **lesson metadata** (exploration id, version,
state name, state index, learner's answer at time of report). This metadata
appears in the detail view — see TL.3.

Entries with non-Open statuses (Entry 3) can be pre-set by first running TL.4
against a fresh Open entry, or created directly via the backend in automated
tests.

---

## TL.1. Can access the Technical Feedback Dashboard page and view the default feedback list

**Status:** GATED

### What this CUJ covers

This CUJ checks that:

1. A user with the Tech team lead role can open the dashboard from the
   profile dropdown.
2. The page loads with the correct default filters and a feedback list.
3. A user **without** the role cannot see the link or access the page.
4. A logged-out user is redirected away.
5. The feature flag alone (without the role) still blocks access.

### Test setup

Shared test setup above. Ensure the feature flag is **enabled**.

### Steps and expectations

| Step | What happens                                                                                                                           | What you should see / expect                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Log in as `techLead`.                                                                                                                  | You are on any page of the Oppia website.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2    | Click on the **profile dropdown** (your avatar/name in the top-right corner).                                                          | A menu drops down listing several links. One of them is **"Technical Feedback Dashboard"**.                                                                                                                                                                                                                                                                                                                                                                                                     |
| 3    | Click **"Technical Feedback Dashboard"** in the dropdown.                                                                              | Your browser navigates to the Technical Feedback Dashboard page. The URL in the address bar is `https://<host>/technical-feedback-dashboard`.                                                                                                                                                                                                                                                                                                                                                   |
| 4    | Observe the **page title** at the top of the content area.                                                                             | You see a heading that reads **"Technical Feedback Dashboard"**.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 5    | Look at the **filter bar** directly below the title.                                                                                   | You see the following filter controls in order from left to right:<br>• **Status** dropdown (labelled "Status:")<br>• **Technical Team** dropdown (labelled "Technical Team:")<br>• **Description Filter** text input (labelled "Description Filter:"; placeholder text inside reads "Filter current page by description")<br>• **From Date** date picker (labelled "From Date:")<br>• **To Date** date picker (labelled "To Date:")<br>• **Apply** button (green)<br>• **Clear** button (grey) |
| 6    | Look at the **default values** of each filter.                                                                                         | • **Status** is set to **"Open"** (the first option in the list).<br>• **Technical Team** is set to **"LEAP"** (the first option).<br>• **Description Filter** is empty.<br>• **From Date** and **To Date** are both empty.                                                                                                                                                                                                                                                                     |
| 7    | Look at the **feedback table** below the filter bar.                                                                                   | You see a table with five column headers: **Status**, **Description**, **Source**, **Lesson**, and **Category**. The table rows contain only the feedback entries that match the current filters.                                                                                                                                                                                                                                                                                               |
| 8    | Count the visible entries in the default view.                                                                                         | Only **Open** entries belonging to the **LEAP** team are shown: **Entry 1** and **Entry 2**. Entry 3 (status Fixed) is NOT shown. Entry 4 (CORE team) is NOT shown. Entry 5 (lesson-originated, LEAP) IS shown — it is Open and LEAP. The list is sorted with the most recently submitted entry first.                                                                                                                                                                                          |
| 9    | Observe the **pagination controls** at the bottom of the table.                                                                        | You see text "Page 1". The **Prev** button is disabled (greyed out) because you are on the first page. The **Next** button is enabled only if there is a second page of results.                                                                                                                                                                                                                                                                                                                |
| 10   | Log out, then type `/technical-feedback-dashboard` into the address bar and press Enter.                                               | You are redirected to an error page (403 or 404). The Technical Feedback Dashboard does NOT load.                                                                                                                                                                                                                                                                                                                                                                                               |
| 11   | Log in as `LoggedInUser` (who has no tech team role). Click the profile dropdown.                                                      | The menu appears, but **"Technical Feedback Dashboard"** is NOT listed among the links.                                                                                                                                                                                                                                                                                                                                                                                                         |
| 12   | While logged in as `LoggedInUser`, type `/technical-feedback-dashboard` into the address bar and press Enter.                          | You are redirected to an error page. The dashboard does NOT load — the URL is not accessible to users without the required role.                                                                                                                                                                                                                                                                                                                                                                |
| 13   | Disable the feature flag (if possible in your test environment). Log in as `techLead` and navigate to `/technical-feedback-dashboard`. | You are redirected to an error page. The dashboard does NOT load — the feature flag must be enabled AND the role must be assigned.                                                                                                                                                                                                                                                                                                                                                              |

---

## TL.2. Use every filter (Team, Status, Description search, Date range) and Clear

**Status:** GATED

### What this CUJ covers

This CUJ checks that every individual filter and every combination of filters
works correctly, and that the **Clear** button resets everything back to the
defaults. It also checks that the date picker enforces sensible constraints.

### Test setup

Shared test setup above.

### Steps and expectations

**Filtering by Team**

| Step | What you do                                                                                                       | What you should see                                                                                                          |
| ---- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1    | Open the dashboard as `techLead`. Confirm the default view shows Entry 1, Entry 2, and Entry 5 (all LEAP + Open). | Three entries are visible: Entry 1, Entry 2, Entry 5.                                                                        |
| 2    | Open the **Technical Team** dropdown. Look at the available options.                                              | Two options: **LEAP** and **CORE**.                                                                                          |
| 3    | Select **CORE** from the Technical Team dropdown, then click the **Apply** button.                                | The table refreshes. Only **Entry 4** is now visible (CORE + Open). All LEAP entries (Entry 1, Entry 2, Entry 5) are hidden. |
| 4    | Click the **Clear** button.                                                                                       | All filters reset to defaults. The table reloads showing Entry 1, Entry 2, Entry 5 again (LEAP + Open).                      |

**Filtering by Status**

| Step | What you do                                                                              | What you should see                                                                                                                                                                                               |
| ---- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5    | Open the **Status** dropdown. Look at the available options.                             | Four options: **Open**, **Fixed**, **Not Actionable**, **Transferred to Github**.                                                                                                                                 |
| 6    | Select **Fixed** from the Status dropdown, keep Technical Team as LEAP, click **Apply**. | Only **Entry 3** is now visible (it was pre-set to Fixed). Entry 1, Entry 2, Entry 5 are hidden.                                                                                                                  |
| 7    | Select **Not Actionable** from the Status dropdown, click **Apply**.                     | The table is empty. The empty-state message appears: **"No feedback found"** as the title and **"There are no feedback items matching your current filters."** as the body text, with a feedback icon above them. |
| 8    | Select **Transferred to Github**, click **Apply**.                                       | If you have previously run TL.5, the transferred entry appears here. Otherwise you see the same empty state as Step 7.                                                                                            |
| 9    | Select **Open**, keep LEAP, click **Apply**.                                             | Entry 1, Entry 2, Entry 5 reappear (original default view).                                                                                                                                                       |

**Filtering by Date Range**

| Step | What you do                                                                                         | What you should see                                                                                                                                                               |
| ---- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10   | Open the **From Date** date picker. Set it to 7 days ago. Leave **To Date** empty. Click **Apply**. | The table refreshes. All entries submitted in the last 7 days are shown (Entry 1, Entry 2, Entry 4, Entry 5). Entry 3 (5 days ago) may or may not appear depending on your clock. |
| 11   | Now also set the **To Date** to today's date. Click **Apply**.                                      | Same result — the date range now covers from 7 days ago to today.                                                                                                                 |
| 12   | Set **From Date** to today's date only (set both From and To to today). Click **Apply**.            | Only entries submitted today appear. If no entry was submitted today, the empty state is shown.                                                                                   |
| 13   | Try to set **To Date** to a date after today (e.g. tomorrow).                                       | The date picker does NOT allow it. Today is the maximum selectable date for the To Date field.                                                                                    |
| 14   | Set **From Date** to a date AFTER the To Date (e.g. From = tomorrow, To = today).                   | The date picker does NOT allow this. From Date must always be on or before To Date.                                                                                               |

**Description Search (filters the current page only)**

| Step | What you do                                                                                                                                                                            | What you should see                                                                                                                                    |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 15   | Reset filters to defaults (Clear button). Type **"image"** into the Description Filter box. (Do NOT click Apply — search is instant.)                                                  | The table filters as you type. Only entries whose description preview contains the word "image" are shown: **Entry 2** ("Image layout is messed up…"). |
| 16   | Change the search text to **"dashboard"**.                                                                                                                                             | **Entry 1** ("Failing to load dashboard") now appears. Entry 2 disappears.                                                                             |
| 17   | Clear the search text box entirely.                                                                                                                                                    | All entries for the current server-side filters reappear.                                                                                              |
| 18   | **Important:** Search only filters the entries on the currently loaded page — not across all pages. If you have a second page of results, search does NOT pull results from that page. | This is expected behaviour; search is a local filter only.                                                                                             |

**Clear button**

| Step | What you do                                                                                           | What you should see                                                                                                                                                 |
| ---- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 19   | Set Status = Fixed, Team = CORE, From Date = 7 days ago, search text = "hello". Then click **Clear**. | All filters reset to defaults: Status = Open, Team = LEAP, both dates cleared, search cleared. The table reloads with the default view (Entry 1, Entry 2, Entry 5). |

---

## TL.3. View details of a feedback report (message, screenshot, session logs, lesson context, page URL)

**Status:** GATED

### What this CUJ covers

This CUJ checks the **detail view** that opens when you click a row in the
feedback table. It covers:

- The "Details" section (submitted date, status, category, source, platform,
  page URL).
- The **screenshot** display and the "Open screenshot in new tab" button.
- The **Session Information** section (when technical logs were attached).
- The **Lesson Context** section (when the report was submitted from inside a
  lesson).
- The **User's Feedback Message** section (the full report text).
- The **back button** to return to the list.
- The **empty states** when content is missing.

### Test setup

Shared test setup above.

### Steps and expectations

**Opening a report with screenshot and session logs**

| Step | What you do                                                                   | What you should see                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | On the dashboard (Team = LEAP, Status = Open), click on **Entry 2**.          | The browser navigates to the detail page. The URL changes to `/technical-feedback-dashboard/tech-external/<reportId>`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2    | Look at the **top bar** of the detail page.                                   | On the left: a **back arrow** button (<) labelled "Back to feedback dashboard", followed by the title **"Feedback Detail"**. On the right: two chips (rounded badges) — one showing the current **status** ("Open") and one showing the **category** ("Broken layout / image").                                                                                                                                                                                                                                                                                                                       |
| 3    | Look at the **"Details"** section below the top bar.                          | You see a collapsible section with an info icon (ℹ) titled "Details". Inside it, there are labelled rows:<br>• **Submitted** — shows the date and time the report was submitted (e.g. "3 days ago").<br>• **Status** — shows "Open".<br>• **Category** — shows "Broken layout / image".<br>• **Source** — shows "Lesson" (if submitted from a lesson page) or "App".<br>• **Platform** — shows "Web" or "Android".<br>• **Page URL** — shows the full URL of the page where the report was submitted (e.g. `https://<host>/community-library`). The URL is a clickable link that opens in a new tab. |
| 4    | Look at the **screenshot** area (inside the Details section, below Page URL). | A preview image of the attached screenshot is displayed. Below the image there is a button that reads **"Open screenshot in new tab"** — clicking it opens the screenshot image in a new browser tab at full size.                                                                                                                                                                                                                                                                                                                                                                                    |
| 5    | Look at the **"Session Information"** section.                                | You see a collapsible section with a document icon (📄) titled "Session Information". Since Entry 2 had technical logs checked, it contains four sub-blocks:<br>• **Environment** — technical details about the user's browser/device.<br>• **Console logs** — any browser console messages.<br>• **Failed requests** — any network requests that failed.<br>• **Navigation history** — the pages the user visited before reporting.<br>Each block shows the data in a code-block format.                                                                                                             |
| 6    | Look at the **"User's Feedback Message"** section.                            | You see a collapsible section with a speech-bubble icon (💬) titled "User's Feedback Message". Inside is the full report text: **"Image layout is messed up, please fix it!"**                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 7    | Look at the **Actions** section at the bottom right.                          | You see a collapsible section with a gear icon (⚙) titled "Actions". Inside it there is a **"Change status:"** row with four buttons: **Open**, **Fixed**, **Not Actionable**, and **Transferred to Github**. The button matching the current status ("Open") is disabled and highlighted to show it is active. The other three buttons are enabled. There is no reply textarea — replies are not supported on this dashboard.                                                                                                                                                                       |
| 8    | Click the **back arrow** button (<) at the top left of the detail page.       | You are returned to the list page at `/technical-feedback-dashboard`. The team/status/date filters and the page you were on are preserved.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

**Opening a report with a screenshot but NO session logs**

| Step | What you do                                                             | What you should see                                                                                                                                     |
| ---- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9    | Go back to the list (Team = LEAP, Status = Open). Click on **Entry 1**. | Detail view opens for Entry 1.                                                                                                                          |
| 10   | Observe the Details section.                                            | Screenshot preview is shown with the "Open screenshot in new tab" button (Entry 1 had a screenshot attached).                                           |
| 11   | Observe the Session Information section.                                | You see the same "Session Information" section, but instead of log data it shows the message: **"No session information was attached to this report."** |

**Opening a report submitted from a lesson (Lesson Context section)**

| Step | What you do                                                                                                                                 | What you should see                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 12   | Go back to the list. Set Team = LEAP, Status = Open, click **Apply**. Click on **Entry 5** (submitted from lesson player `/explore/test1`). | Detail view opens for Entry 5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 13   | Look for the **"Lesson Context"** section (between Details and Session Information, with a map-pin icon).                                   | Because Entry 5 was submitted from inside a lesson, you see a collapsible section titled **"Lesson Context"** containing:<br>• **Exploration** — shows the exploration id (`test1`).<br>• **Version** — shows the lesson version the learner was on when they reported.<br>• **State** — shows the name of the card/step where the report was made.<br>• **State index** — shows the numerical position of that card in the lesson.<br>• **Learner answer** (if available) — shows what the learner typed or selected at the time of the report. |
| 14   | Look at the buttons below the Lesson Context fields.                                                                                        | You see two blue buttons:<br>• **"Open reported lesson version"** — clicking this opens the lesson in learner view at the exact version the learner was on, in a new tab. The URL is `/explore/test1?v=<version>`.<br>• **"Open current state in editor"** — clicking this opens the exploration editor directly at the card/state where the report was made, in a new tab. The URL is `/create/test1#/<stateName>`.                                                                                                                             |
| 15   | Click **"Open reported lesson version"**.                                                                                                   | A new tab opens showing the lesson as the learner saw it at the time of the report. The lesson version in the URL matches the "Version" shown in Lesson Context.                                                                                                                                                                                                                                                                                                                                                                                 |
| 16   | Click **"Open current state in editor"**.                                                                                                   | A new tab opens the exploration editor, scrolled directly to the state/card where the issue was reported.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 17   | Go back to the list. Click on **Entry 1** (submitted from `/learn`, not from inside a lesson).                                              | The Lesson Context section is **NOT present** in this detail view because Entry 1 was not submitted from inside a lesson. Only the Details, Session Information, and User's Feedback Message sections appear.                                                                                                                                                                                                                                                                                                                                    |

**Empty states**

| Step | What you do                                                                                                                      | What you should see                                                          |
| ---- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 18   | If a report has no screenshot, the screenshot area is simply not shown.                                                          | No image, no "Open screenshot in new tab" button — the space is not visible. |
| 19   | If a report was submitted from a non-lesson page (e.g. `/learn`, `/community-library`), the Lesson Context section is not shown. | The section is absent — there is no map-pin icon section.                    |

---

## TL.4. Change the status of a feedback report

**Status:** GATED

### What this CUJ covers

This CUJ checks that changing a report's status works correctly:

- The toast notification appears.
- The status chip updates immediately.
- The correct button becomes disabled.
- The change persists after navigating away and back.
- The entry moves to the correct filtered list.

### Test setup

Shared test setup above. Ensure at least one **Open** entry exists (Entry 4
in the CORE queue is a good candidate).

### Steps and expectations

| Step | What you do                                                                                               | What you should see                                                                                                                                                                                                                                                                                                          |
| ---- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | On the dashboard, set Team = **CORE**, Status = **Open**, click **Apply**. Click on **Entry 4**.          | Detail view opens. The status chip at the top right shows **"Open"**. In the Actions section, the **Open** button is disabled (greyed out/highlighted) — it is the current status. The buttons Fixed, Not Actionable, and Transferred to Github are enabled.                                                                 |
| 2    | Click the **Fixed** button.                                                                               | A green **toast notification** appears at the bottom of the screen: **"Feedback status updated to fixed."** The toast disappears after a few seconds. The status chip at the top right immediately updates to show **"Fixed"** (green colour). The **Fixed** button is now disabled, and the **Open** button is now enabled. |
| 3    | Click the **back arrow** (<) to return to the list. Set Team = CORE, Status = **Fixed**, click **Apply**. | Entry 4 now appears in the Fixed list. It is no longer in the Open list.                                                                                                                                                                                                                                                     |
| 4    | Click on **Entry 4** again to re-open the detail view. Click the **Open** button to reopen it.            | Toast: **"Feedback status updated to open."** Status chip changes to **"Open"**. Entry 4 is back in the Open list.                                                                                                                                                                                                           |
| 5    | Click **Not Actionable**.                                                                                 | Toast: **"Feedback status updated to not_actionable."** Chip updates. Entry moves to the Not Actionable list.                                                                                                                                                                                                                |
| 6    | Click **Transferred to Github**. (Note: this also triggers a GitHub issue — see TL.5 for full details.)   | Toast: **"Feedback status updated to transferred_to_github."** A new tab opens with the pre-filled GitHub issue. Entry moves to the Transferred to Github list.                                                                                                                                                              |

---

## TL.5. Transfer a feedback report to GitHub

**Status:** GATED

### What this CUJ covers

This CUJ checks the **"Transferred to Github"** status action, which:

1. Opens a pre-filled GitHub issue form in a new browser tab.
2. Sets the report status to "Transferred to Github".
3. The pre-filled issue includes the report text, page URL, lesson context
   (if applicable), screenshot details, device/browser info, and session logs.

### Test setup

Shared test setup above. Ensure at least one Open LEAP entry exists (Entry 1).

### Steps and expectations

| Step | What you do                                                                                                           | What you should see                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | Set Team = LEAP, Status = Open, click **Apply**. Click on **Entry 1**.                                                | Detail view opens for Entry 1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2    | In the Actions section, click the **Transferred to Github** button.                                                   | **Two things happen simultaneously:**<br>1. A **new browser tab** opens to `https://github.com/oppia/oppia/issues/new?…` with all the issue fields pre-filled.<br>2. A green **toast notification** appears on the original tab: **"Feedback status updated to transferred_to_github."**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 3    | Switch to the **new GitHub tab** and examine the pre-filled issue form.                                               | The GitHub issue form has these fields already filled in:<br>• **Template:** `6_technical_feedback_report.yml`<br>• **Title:** `[BUG]: User feedback report: <category>` (e.g. `[BUG]: User feedback report: Other / not sure`)<br>• **describe-the-bug:** The report text, followed by a line reading "Transferred from the Oppia Technical feedback dashboard." plus the Report ID, feedback link, submitted date, source, category, platform, and dashboard.<br>• **page-url:** The URL of the page where the report was submitted.<br>• **steps-to-reproduce:** "Review the transferred feedback report details." and "Open the reported page: `<page_url>`".<br>• **expected-behavior:** "The reported user-facing problem should not occur."<br>• **screenshots-videos:** Details about the screenshot (filename, entity ID, URL) if one was attached, or "No screenshot was attached to this report."<br>• **device:** "Desktop" or "Mobile" (derived from the user-agent).<br>• **operating-system:** One of Android, Windows, IOS, MacOS, Linux, or Other.<br>• **browsers:** Chrome, Firefox, Safari, Edge, or Other.<br>• **browser-version:** The browser version number.<br>• **additional-context:** A markdown block containing feedback metadata and the session logs JSON (with a privacy warning asking the developer to redact sensitive data before submitting). |
| 4    | If Entry 1 was submitted from a lesson page, check the **steps-to-reproduce** field in the GitHub form.               | It additionally includes the exploration id, state name, version, learner answer at report time, and clickable links:<br>• "Open reported Lesson version: `<origin>/explore/<id>?v=<version>`"<br>• "Open the state in editor: `<origin>/create/<id>#/<stateName>`"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 5    | Close the GitHub tab. Return to the original tab (still on the detail view). Observe the status chip.                 | The chip now shows **"Transferred to Github"**. The Transferred to Github button is disabled.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 6    | Click the back arrow (<) to return to the list. Set Status = **Transferred to Github**, Team = LEAP, click **Apply**. | Entry 1 appears in the Transferred to Github list. It is no longer in the Open list.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 7    | Click on Entry 1 again to re-open the detail view. Check the Actions section.                                         | The "Transferred to Github" button is disabled (it is the current status). The other three buttons (Open, Fixed, Not Actionable) are enabled — you can change the status back if needed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

---

## Pagination (tested implicitly across CUJs, documented here for reference)

| Behaviour                | Detail                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| Page label               | Always shows "Page N" (e.g. "Page 1", "Page 2").                                                         |
| Prev button              | Disabled on page 1. Enabled on page 2+. Clicking it loads the previous page of results.                  |
| Next button              | Disabled when there are no more results. Enabled when more pages exist. Clicking it loads the next page. |
| Cursor management        | The system remembers page history so clicking Prev returns to exactly the page you were on before.       |
| Filters reset pagination | Changing any server-side filter (Team, Status, Date range) resets you back to page 1.                    |

---

## Automated testing notes (desktop + mobile)

| Test file (under `core/tests/puppeteer-acceptance-tests/specs/`)               | Coverage status | Notes                                                                                                     |
| ------------------------------------------------------------------------------ | --------------- | --------------------------------------------------------------------------------------------------------- |
| `technical-feedback-dashboard/access-and-filters.spec.ts` (TL.1, TL.2)         | TODO            | Gated access (flag + role), default view, all filter combos, Clear, pagination.                           |
| `technical-feedback-dashboard/view-details.spec.ts` (TL.3)                     | TODO            | Screenshot presence/absence, session logs present/absent, lesson context buttons, back button, deep link. |
| `technical-feedback-dashboard/change-status-and-transfer.spec.ts` (TL.4, TL.5) | TODO            | Status transitions, toasts, chip updates, GitHub issue URL contents, persistence.                         |
