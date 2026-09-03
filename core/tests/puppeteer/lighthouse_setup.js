// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Puppeteer script to collects dynamic urls for lighthouse tests.
 */

const process = require('process');
const puppeteer = require('puppeteer');
const {PuppeteerScreenRecorder} = require('puppeteer-screen-recorder');
const fs = require('fs');

const ADMIN_URL = 'http://localhost:8181/admin';
const CREATOR_DASHBOARD_URL = 'http://localhost:8181/creator-dashboard';
const TOPIC_AND_SKILLS_DASHBOARD_URL =
  'http://localhost:8181/topics-and-skills-dashboard';
// Read more about networkidle0
// https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pagegotourl-options
const networkIdle = 'networkidle0';

var explorationEditorUrl = 'Exploration editor not loaded';
var topicEditorUrl = 'Topic editor not loaded';
var skillEditorUrl = 'Skill editor not loaded';
var storyEditorUrl = 'Story editor not loaded';

var explorationId = 'Exploration editor not loaded';
var topicId = 'Topic editor not loaded';
var skillId = 'Skill editor not loaded';
var storyId = 'Story editor not loaded';
var blogUrlFragment = 'Blog post page not loaded';
var learnerGroupId = 'Learner group not loaded';
var technicalFeedbackReportId = 'Technical feedback report not loaded';
var certificateId = 'Certificate not loaded';
var attemptId = 'Attempt not loaded';

var emailInput = '.e2e-test-sign-in-email-input';
var signInButton = '.e2e-test-sign-in-button';
var usernameInput = '.e2e-test-username-input';
var agreeToTermsCheckBox = '.e2e-test-agree-to-terms-checkbox';
var registerUser = '.e2e-test-register-user:not([disabled])';
var navbarToggle = '.oppia-navbar-dropdown-toggle';

var createButtonSelector = '.e2e-test-create-activity';
var creationModalSelector = '.e2e-test-creation-modal';
var createExplorationInModalSelector = '.e2e-test-create-exploration';
var dismissWelcomeModalSelector = '.e2e-test-dismiss-welcome-modal';
var stateEditSelector = '.e2e-test-state-edit-content';
var saveContentButton = '.e2e-test-save-state-content';
var addInteractionButton = '.e2e-test-open-add-interaction-modal';
var endIneractionSelector = '.e2e-test-interaction-tile-EndExploration';
var saveInteractionButton = '.e2e-test-save-interaction';
var saveChangesButton = '.e2e-test-save-changes';
var saveDraftButton = '.e2e-test-save-draft-button';
var publishExplorationButton = '.e2e-test-publish-exploration';
var explorationTitleInput = '.e2e-test-exploration-title-input-modal';
var explorationGoalInput = '.e2e-test-exploration-objective-input-modal';
var expCategoryDropdownElement =
  '.e2e-test-exploration-category-metadata-modal';
var expConfirmPublishButton = '.e2e-test-confirm-pre-publication';
var explorationConfirmPublish = '.e2e-test-confirm-publish';
var createTopicButtonSelector = '.e2e-test-create-topic-button';
var topicUrlFragmentField =
  '.e2e-test-new-topic-url-fragment-field .e2e-test-url-fragment-field';
var topicNameField = '.e2e-test-new-topic-name-field';
var topicDescriptionField = '.e2e-test-new-topic-description-field';
var topicPageTitleFragmField = '.e2e-test-new-page-title-fragm-field';
var topicThumbnailButton = '.e2e-test-photo-button';
var topicUploadButton = '.e2e-test-photo-upload-input';
var topicPhotoSubmit = 'button.e2e-test-photo-upload-submit';
var thumbnailContainer = '.e2e-test-thumbnail-container';
var confirmTopicCreationButton = '.e2e-test-confirm-topic-creation-button';
var createdTopicLink = '.e2e-test-topic-name';

var createStoryButtonSelector = '.e2e-test-create-story-button';
var storyNameField = '.e2e-test-new-story-title-field';
var storyUrlFragmentField =
  '.e2e-test-create-new-story-url-fragment-field .e2e-test-url-fragment-field';
var storyDescriptionField = '.e2e-test-new-story-description-field';
var storyThumbnailButton =
  'oppia-create-new-story-modal .e2e-test-photo-button';
var storyUploadButton = '.e2e-test-photo-upload-input';
var storyPhotoSubmit = '.e2e-test-photo-upload-submit';
var confirmStoryCreationButton = '.e2e-test-confirm-story-creation-button';

var createSkillButtonSelector = '.puppeteer-test-add-skill-button';
var skillDescriptionField = '.e2e-test-new-skill-description-field';
var skillOpenConceptCard = '.e2e-test-open-concept-card';
var confirmSkillCreationButton = '.e2e-test-confirm-skill-creation-button';
var skillReviewMaterialInput = '.e2e-test-concept-card-text .e2e-test-rte';

var usernameInputFieldForRolesEditing = '.e2e-test-username-for-role-editor';
var editUserRoleButton = '.e2e-test-role-edit-button';
var roleEditorContainer = '.e2e-test-roles-editor-card-container';
var addNewRoleButton = '.e2e-test-add-new-role-button';
var roleSelect = '.e2e-test-new-role-selector';
var generateTopicButton = '.load-dummy-new-structures-data-button';
var generateClassroomButton = '.load-dummy-math-classroom';
var blogGenerateButton = '.e2e-test-generate-blog-post';
var classroomEditButton = '.e2e-test-edit-classroom-config-button';
var diagnosticTestStatusButton = '.e2e-test-toggle-diagnostic-test-status-btn';
var classroomSaveButton = '.e2e-test-save-classroom-config-button';
var classroomNameView = '.e2e-test-classroom-name-view';
var featuresTab = '.e2e-test-features-tab';
var featureFlagDiv = '.e2e-test-feature-flag';
var featureFlagNameSelector = '.e2e-test-feature-name';
var featureFlagValueSelector = '.e2e-test-value-selector';
var featureFlagSaveButton = '.e2e-test-save-button';
var generateClassroomCountInput =
  '#label-target-number-of-classrooms-to-generate';
var generateDefaultClassroomCountInput =
  '#label-target-number-of-default-classrooms-to-generate';
var generateDefaultClassroomButton = '.load-dummy-default-classroom';
var generateExplorationsCountInput = '#label-target-explorations-to-generate';
var generateExplorationsPublishInput = '#label-target-explorations-to-publish';
var reloadExplorationButton = '.e2e-test-reload-exploration-button';
var reloadExplorationRow = '.e2e-test-reload-exploration-row';
var reloadExplorationTitle = '.e2e-test-reload-exploration-title';
var topicThumbnailResetButton = '.e2e-test-thumbnail-reset-button';
var topicMetaTagInput = '.e2e-test-topic-meta-tag-content-field';
var saveTopicButton = '.e2e-test-save-topic-button';
var topicCommitMessageInput = '.e2e-test-commit-message-input';
var publishChangesButton = '.e2e-test-close-save-modal-button';
var cookieBannerAcceptButton = '.e2e-test-oppia-cookie-banner-accept-button';

var roleOptionLabels = {
  ADMIN: 'curriculum admin',
  COLLECTION_EDITOR: 'collection editor',
  FULL_USER: 'full user',
  RELEASE_COORDINATOR: 'release coordinator',
  TECH_TEAM_LEAD: 'tech team lead',
  VOICEOVER_ADMIN: 'voiceover admin',
};

// Wraps a setup step so it logs its name and elapsed time to stdout. This
// surfaces each scaffolded piece of data (login, generated explorations,
// generated classrooms, and so on) in the CI logs, which makes it easy to see
// which step consumes the most time in a shard setup.
const logStep = async function (name, step) {
  // eslint-disable-next-line no-console
  console.log(`[lighthouse-setup] ${name}...`);
  const startTime = Date.now();
  await step();
  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
  // eslint-disable-next-line no-console
  console.log(`[lighthouse-setup] ${name} done (${elapsedSeconds}s)`);
};

const login = async function (browser, page) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto(ADMIN_URL, {waitUntil: networkIdle});
    await page.waitForSelector(emailInput, {visible: true});
    await page.type(emailInput, 'testadmin@example.com');
    await page.click(signInButton);

    let cookies = await page.cookies();
    if (!cookies.find(item => item.name === 'OPPIA_COOKIES_ACKNOWLEDGED')) {
      await page.waitForSelector(cookieBannerAcceptButton, {visible: true});
      await page.click(cookieBannerAcceptButton);
    }

    let usernameInputElement = null;
    try {
      usernameInputElement = await page.waitForSelector(usernameInput, {
        visible: true,
        timeout: 5000,
      });
    } catch (error) {
      // Already signed in.
    }

    if (usernameInputElement === null) {
      await page.waitForSelector(navbarToggle);
      return;
    }

    await usernameInputElement.type('username1');
    await Promise.all([
      page.waitForResponse(response =>
        response.url().includes('/usernamehandler/data')
      ),
      page.evaluate(selector => {
        document.querySelector(selector).blur();
      }, usernameInput),
    ]);
    await page.click(agreeToTermsCheckBox);
    await page.waitForSelector(registerUser);
    await page.click(registerUser);
    await page.waitForSelector(navbarToggle);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('Login Failed');
    // eslint-disable-next-line no-console
    console.log(e);
    process.exit(1);
  }
};

const setRole = async function (browser, page, role) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto('http://localhost:8181/admin#/roles', {
      waitUntil: networkIdle,
    });
    await page.waitForSelector(usernameInputFieldForRolesEditing);
    await page.type(usernameInputFieldForRolesEditing, 'username1');
    await page.waitForSelector(editUserRoleButton);
    await page.click(editUserRoleButton);
    await page.waitForSelector(roleEditorContainer);

    await page.waitForSelector(addNewRoleButton);
    await page.click(addNewRoleButton);

    await page.click(roleSelect);
    await page.waitForSelector('mat-option');
    const roleOptionWasSelected = await page.evaluate(
      (role, roleOptionLabels) => {
        const roleOptionLabel = roleOptionLabels[role];
        if (!roleOptionLabel) {
          throw new Error(`No role option label configured for ${role}.`);
        }

        const normalizedRoleOptionLabel = roleOptionLabel.toLowerCase();
        const normalizedRole = role.toLowerCase();
        const options = Array.from(document.querySelectorAll('mat-option'));
        const match = options.find(option => {
          const optionValue = (
            option.getAttribute('ng-reflect-value') ||
            option.getAttribute('value') ||
            option.id ||
            ''
          ).toLowerCase();
          const optionLabel = option.textContent.trim().toLowerCase();

          return (
            optionValue === normalizedRole ||
            optionLabel === normalizedRoleOptionLabel ||
            optionLabel === normalizedRole
          );
        });

        if (!match) {
          return false;
        }

        match.click();
        return true;
      },
      role,
      roleOptionLabels
    );

    if (roleOptionWasSelected) {
      await page.waitForResponse(response =>
        response.url().includes('/adminrolehandler')
      );
    } else {
      const roleIsAlreadyAssigned = await page.evaluate(
        (role, roleOptionLabels, roleEditorContainer) => {
          const roleOptionLabel = roleOptionLabels[role];
          const roleEditorText = document
            .querySelector(roleEditorContainer)
            .textContent.toLowerCase();
          return roleEditorText.includes(roleOptionLabel.toLowerCase());
        },
        role,
        roleOptionLabels,
        roleEditorContainer
      );
      if (!roleIsAlreadyAssigned) {
        throw new Error(`Could not find role option for ${role}.`);
      }
    }
    await page.waitForTimeout(2000);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    process.exit(1);
  }
};

const getExplorationEditorUrl = async function (browser, page) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto(CREATOR_DASHBOARD_URL, {waitUntil: networkIdle});
    await page.waitForSelector(createButtonSelector, {visible: true});

    await page.click(createButtonSelector);

    // The create button opens a creation modal when the user has the
    // collection-creator role (as the CI admin does). In that case we need to
    // pick the exploration option to reach the exploration editor, instead of
    // navigating directly.
    const isCreationModalVisible = await page
      .waitForSelector(creationModalSelector, {visible: true, timeout: 10000})
      .then(() => true)
      .catch(() => false);

    if (isCreationModalVisible) {
      await page.waitForSelector(createExplorationInModalSelector, {
        visible: true,
      });
      await page.click(createExplorationInModalSelector);
    }

    // Wait for the navigation to the created exploration's editor before
    // interacting with it.
    await page.waitForFunction(
      urlFragment => document.URL.indexOf(urlFragment) !== -1,
      {},
      '/create/'
    );

    // The exploration creation flow may or may not show a welcome modal,
    // depending on prior state, so the dismissal is optional to avoid
    // blocking the whole shard setup when the modal never appears.
    try {
      await page.waitForSelector(dismissWelcomeModalSelector, {
        visible: true,
        timeout: 30000,
      });
      await page.click(dismissWelcomeModalSelector);
      await page.waitForTimeout(3000);
    } catch (e) {
      if (!(e instanceof puppeteer.errors.TimeoutError)) {
        throw e;
      }
    }
    await page.waitForSelector(stateEditSelector, {visible: true});
    await page.click(stateEditSelector);
    await page.waitForTimeout(5000);
    await page.waitForSelector(saveContentButton, {visible: true});
    await page.click(saveContentButton);
    await page.waitForTimeout(2000);
    await page.waitForSelector(addInteractionButton, {visible: true});
    await page.click(addInteractionButton);
    await page.waitForTimeout(3000);
    await page.waitForSelector(endIneractionSelector, {visible: true});
    await page.click(endIneractionSelector);
    await page.waitForSelector(saveInteractionButton, {visible: true});
    await page.click(saveInteractionButton);
    await page.waitForTimeout(2000);

    await page.waitForSelector(saveChangesButton, {visible: true});
    await page.click(saveChangesButton);

    await page.waitForSelector(saveDraftButton, {visible: true});
    await page.click(saveDraftButton);

    const successMessage = 'Changes saved.';
    let statusMessage;
    do {
      await new Promise(r => setTimeout(r, 1000));
      statusMessage = await page.evaluate(() => {
        const statusMessageElement = document.querySelector(
          '.e2e-test-toast-message'
        );
        return statusMessageElement
          ? statusMessageElement.textContent.trim()
          : '';
      });
    } while (statusMessage !== successMessage);

    await page.waitForTimeout(3000);
    await page.waitForSelector(publishExplorationButton);
    await page.click(publishExplorationButton);

    await page.waitForTimeout(3000);
    await page.waitForSelector(explorationTitleInput, {visible: true});
    await page.type(explorationTitleInput, 'Sample exploration');

    await page.waitForSelector(explorationGoalInput, {visible: true});
    await page.type(explorationGoalInput, 'Sample exploration goal');

    await page.waitForTimeout(3000);
    await page.waitForSelector(expCategoryDropdownElement, {visible: true});
    await page.click(expCategoryDropdownElement);
    await page.waitForSelector('mat-option .mat-option-text', {
      visible: true,
    });
    await page.evaluate(() => {
      const options = Array.from(
        document.querySelectorAll('mat-option .mat-option-text')
      );

      const match = options.find(el => el.textContent.trim() === 'Algebra');

      if (match) {
        match.closest('mat-option').click();
      } else {
        throw new Error('Could not find Algebra category option');
      }
    });

    await page.waitForTimeout(3000);
    await page.waitForSelector(expConfirmPublishButton, {visible: true});
    await page.click(expConfirmPublishButton);
    await page.waitForTimeout(5000);
    await page.waitForSelector(explorationConfirmPublish, {visible: true});
    await page.click(explorationConfirmPublish);

    explorationEditorUrl = await page.url();
    explorationId = explorationEditorUrl.split('/')[4];
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    process.exit(1);
  }
};

const getTopicEditorUrl = async function (browser, page) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto(TOPIC_AND_SKILLS_DASHBOARD_URL, {waitUntil: networkIdle});
    await page.waitForSelector(createTopicButtonSelector, {visible: true});
    await page.click(createTopicButtonSelector);

    await page.waitForSelector(topicNameField, {visible: true});
    await page.type(topicNameField, 'Topic1 TASD');
    await page.waitForSelector(topicUrlFragmentField, {
      visible: true,
    });
    await page.type(topicUrlFragmentField, 'topic-tasd-one');
    await page.type(topicDescriptionField, 'Topic 1 description');
    await page.type(topicPageTitleFragmField, 'page-fragment');
    await page.click(topicThumbnailButton);
    await page.waitForSelector(topicUploadButton, {visible: true});

    const elementHandle = await page.$(topicUploadButton);
    await elementHandle.uploadFile('core/tests/data/test_svg.svg');

    await page.waitForSelector(thumbnailContainer, {visible: true});
    await page.click(topicPhotoSubmit);

    await page.waitForSelector(confirmTopicCreationButton, {visible: true});
    await page.waitForTimeout(5000);
    await page.click(confirmTopicCreationButton);
    // Doing waitForTimeout(10000) to handle new tab being opened.
    await page.waitForTimeout(10000);
    await browser.pages();

    // Refresh page and click on topic link.
    // eslint-disable-next-line dot-notation
    await page.goto(TOPIC_AND_SKILLS_DASHBOARD_URL, {waitUntil: networkIdle});
    await page.waitForSelector(createdTopicLink, {visible: true});
    await page.click(createdTopicLink);
    await page.waitForSelector(createStoryButtonSelector);

    topicEditorUrl = await page.url();
    topicId = topicEditorUrl.split('/')[4];
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    process.exit(1);
  }
};

const getStoryEditorUrl = async function (browser, page) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto(topicEditorUrl, {waitUntil: networkIdle});
    await page.waitForSelector(createStoryButtonSelector, {visible: true});
    await page.click(createStoryButtonSelector);

    await page.waitForSelector(storyNameField, {visible: true});
    await page.type(storyNameField, 'Story TASD');
    await page.waitForSelector(storyUrlFragmentField, {
      visible: true,
    });
    await page.type(storyUrlFragmentField, 'storyurlone');
    await page.type(storyDescriptionField, 'Story 1 description');
    await page.click(storyThumbnailButton);
    await page.waitForSelector(storyUploadButton, {visible: true});

    const elementHandle = await page.$(storyUploadButton);
    await elementHandle.uploadFile('core/tests/data/test_svg.svg');

    await page.waitForSelector(thumbnailContainer, {visible: true});
    await page.click(storyPhotoSubmit);

    await page.waitForSelector(confirmStoryCreationButton, {visible: true});
    await page.waitForTimeout(5000);
    await page.click(confirmStoryCreationButton);
    await page.waitForTimeout(15000);
    storyEditorUrl = await page.url();
    storyId = storyEditorUrl.split('/')[4];
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    process.exit(1);
  }
};

const getSkillEditorUrl = async function (browser, page) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto(topicEditorUrl, {waitUntil: networkIdle});
    await page.waitForSelector(createSkillButtonSelector, {visible: true});
    await page.click(createSkillButtonSelector);

    await page.waitForSelector(skillDescriptionField, {visible: true});
    await page.type(skillDescriptionField, 'Skill Description here');
    await page.click(skillOpenConceptCard);
    await page.waitForSelector(skillReviewMaterialInput, {visible: true});
    await page.click(skillReviewMaterialInput);
    await page.type(skillReviewMaterialInput, 'Skill Overview here');

    await page.waitForSelector(`${confirmSkillCreationButton}:not([disabled])`);
    await page.waitForTimeout(5000);
    await page.click(confirmSkillCreationButton);
    // Doing waitForTimeout(15000) to handle new tab being opened.
    await page.waitForTimeout(15000);
    let pages = await browser.pages();
    skillEditorUrl = await pages[2].url();
    if (await skillEditorUrl.includes('topic_editor')) {
      skillEditorUrl = await pages[3].url();
      skillId = skillEditorUrl.split('/')[4];
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    process.exit(1);
  }
};

const generateDataForTopicAndStoryPlayer = async function (browser, page) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto('http://localhost:8181/admin#/activities', {
      waitUntil: networkIdle,
    });

    await page.waitForSelector(generateTopicButton);
    await page.click(generateTopicButton);

    const successMessage = 'Dummy new structures data generated successfully.';
    let statusMessage;
    do {
      await new Promise(r => setTimeout(r, 1000));
      statusMessage = await page.evaluate(() => {
        const statusMessageElement = document.querySelector(
          '.oppia-status-message-container'
        );
        return statusMessageElement
          ? statusMessageElement.textContent.trim()
          : '';
      });
    } while (statusMessage !== successMessage);

    // Capture the seeded learner group id from the facilitator dashboard,
    // which lists the groups the admin is a facilitator of.
    learnerGroupId = await page.evaluate(async () => {
      const response = await fetch('/facilitator_dashboard_handler');
      const data = await response.json();
      return data.learner_groups_list[0].id;
    });

    // Capture the seeded technical feedback report id from the
    // technical-external dashboard summaries.
    technicalFeedbackReportId = await page.evaluate(async () => {
      const response = await fetch(
        '/platform-feedback/technical/tech-external'
      );
      const data = await response.json();
      return data.summaries.length > 0 ? data.summaries[0].id : null;
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  }
};

const generateDataForClassroom = async function (browser, page) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto('http://localhost:8181/admin#/activities', {
      waitUntil: networkIdle,
    });

    await page.waitForSelector(generateClassroomButton);
    // Only the first dummy math classroom is needed here: it backs the
    // diagnostic test toggle, the topic thumbnails and the certificate
    // offering/attempt captures below. The classroom routes get their
    // additional populated classrooms from generateBareClassrooms.
    await page.type(generateClassroomCountInput, '1');
    await page.click(generateClassroomButton);

    const successMessage = 'Dummy new classroom generated successfully.';
    let statusMessage;
    do {
      await new Promise(r => setTimeout(r, 1000));
      statusMessage = await page.evaluate(() => {
        const statusMessageElement = document.querySelector(
          '.oppia-status-message-container'
        );
        return statusMessageElement
          ? statusMessageElement.textContent.trim()
          : '';
      });
    } while (statusMessage !== successMessage);
    await addThumbnailToTopic(page, 'Fraction');
    await addThumbnailToTopic(page, 'Addition');
    await addThumbnailToTopic(page, 'Subtraction');
    await addThumbnailToTopic(page, 'Multiplication');
    await addThumbnailToTopic(page, 'Division');

    // Capture the seeded certificate offering and the attempt started for the
    // admin so that the certificate pages render real content.
    certificateId = await page.evaluate(async () => {
      const response = await fetch('/certificate_assessment_offering_handler');
      const data = await response.json();
      return data.certificate_offerings.length > 0
        ? data.certificate_offerings[0].id
        : null;
    });
    attemptId = await page.evaluate(async () => {
      const response = await fetch('/certificate_assessment_attempts_handler');
      const data = await response.json();
      return data.attempts.length > 0 ? data.attempts[0].attempt_id : null;
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    process.exit(1);
  }
};

const generateBareClassrooms = async function (browser, page) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto('http://localhost:8181/admin#/activities', {
      waitUntil: networkIdle,
    });

    await page.waitForSelector(generateDefaultClassroomCountInput);
    await page.type(generateDefaultClassroomCountInput, '5');
    await page.waitForSelector(generateDefaultClassroomButton);
    await page.click(generateDefaultClassroomButton);

    const successMessage = 'Dummy default classrooms generated successfully.';
    let statusMessage;
    do {
      await new Promise(r => setTimeout(r, 1000));
      statusMessage = await page.evaluate(() => {
        const statusMessageElement = document.querySelector(
          '.oppia-status-message-container'
        );
        return statusMessageElement
          ? statusMessageElement.textContent.trim()
          : '';
      });
    } while (statusMessage !== successMessage);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    process.exit(1);
  }
};

const generateDataForBlogPosts = async function (browser, page) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto('http://localhost:8181/admin#/activities', {
      waitUntil: networkIdle,
    });

    await page.waitForSelector(blogGenerateButton);

    // The activities tab provides a separate generate button for each dummy
    // blog post title. Each click creates a single blog post, so 11 dummy
    // blog posts are generated by cycling through the available buttons.
    const successMessage = 'Dummy Blog Post generated successfully.';
    for (let i = 0; i < 11; i++) {
      const blogGenerateButtons = await page.$$(blogGenerateButton);
      await blogGenerateButtons[i % blogGenerateButtons.length].click();
      let statusMessage;
      do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        statusMessage = await page.evaluate(() => {
          const statusMessageElement = document.querySelector(
            '.oppia-status-message-container'
          );
          return statusMessageElement
            ? statusMessageElement.textContent.trim()
            : '';
        });
      } while (statusMessage !== successMessage);
    }

    // Navigate to the blog homepage and open the first published blog post to
    // capture its URL fragment, which is needed for the blog post page
    // lighthouse check.
    // eslint-disable-next-line dot-notation
    await page.goto('http://localhost:8181/blog', {waitUntil: networkIdle});
    await page.waitForSelector('.e2e-test-blog-post-list .blog-card', {
      visible: true,
    });
    const blogCards = await page.$$('.e2e-test-blog-post-list .blog-card');
    await blogCards[0].click();
    await page.waitForFunction(() =>
      window.location.pathname.startsWith('/blog/')
    );
    blogUrlFragment = new URL(await page.url()).pathname.split('/')[2];
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    process.exit(1);
  }
};

const generateDummyExplorations = async function (browser, page) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto('http://localhost:8181/admin#/activities', {
      waitUntil: networkIdle,
    });

    await page.waitForSelector(generateExplorationsCountInput);
    await page.type(generateExplorationsCountInput, '5');
    await page.waitForSelector(generateExplorationsPublishInput);
    await page.type(generateExplorationsPublishInput, '5');

    // The generate button uses the shared .oppia-generate-exploration-text
    // class across several cards, so it is targeted by its label text instead.
    await page.waitForXPath(
      "//*[contains(normalize-space(text()), 'Generate Explorations')]"
    );
    const [generateButton] = await page.$x(
      "//*[contains(normalize-space(text()), 'Generate Explorations')]"
    );
    await generateButton.click();

    const successMessage = 'Dummy explorations generated successfully.';
    let statusMessage;
    do {
      await new Promise(r => setTimeout(r, 1000));
      statusMessage = await page.evaluate(() => {
        const statusMessageElement = document.querySelector(
          '.oppia-status-message-container'
        );
        return statusMessageElement
          ? statusMessageElement.textContent.trim()
          : '';
      });
    } while (statusMessage !== successMessage);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    process.exit(1);
  }
};

const reloadAllInteractionsExploration = async function (browser, page) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto('http://localhost:8181/admin#/activities', {
      waitUntil: networkIdle,
    });

    // Locate the reload button for the all_interactions demo exploration so
    // that the exploration editor, player and new lesson player pages have
    // content exercising every interaction type to render.
    await page.waitForSelector(reloadExplorationRow);
    const reloadButtons = await page.$$(reloadExplorationButton);
    for (let i = 0; i < reloadButtons.length; i++) {
      const title = await page.evaluate(
        (el, sel) =>
          el
            .closest(sel)
            .querySelector(reloadExplorationTitle)
            .textContent.trim(),
        reloadButtons[i],
        reloadExplorationRow
      );
      if (title === 'all_interactions') {
        await reloadButtons[i].click();
        break;
      }
    }

    const successMessage = 'Data reloaded successfully.';
    let statusMessage;
    do {
      await new Promise(r => setTimeout(r, 1000));
      statusMessage = await page.evaluate(() => {
        const statusMessageElement = document.querySelector(
          '.oppia-status-message-container'
        );
        return statusMessageElement
          ? statusMessageElement.textContent.trim()
          : '';
      });
    } while (statusMessage !== successMessage);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    process.exit(1);
  }
};

const enableDiagnosticTestForMathClassroom = async function (browser, page) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto('http://localhost:8181/classroom-admin', {
      waitUntil: networkIdle,
    });

    // Open the details of the first dummy math classroom that was generated
    // by the generate dummy classrooms action.
    const classroomTileXPath =
      "//*[contains(@class, 'e2e-test-classroom-tile')][.//*[contains(@class, 'e2e-test-classroom-tile-name')][text()='math']]";
    await page.waitForXPath(classroomTileXPath);
    const [classroomTileElement] = await page.$x(classroomTileXPath);
    await classroomTileElement.click();

    // Enter the editor mode to reveal the diagnostic test status toggle.
    await page.waitForSelector(classroomEditButton, {visible: true});
    await page.click(classroomEditButton);

    // Enable the diagnostic test for the math classroom.
    await page.waitForSelector(diagnosticTestStatusButton, {visible: true});
    await page.click(diagnosticTestStatusButton);

    // Wait for the save button to become enabled and save the changes.
    await page.waitForSelector(classroomSaveButton, {visible: true});
    await page.waitForFunction(
      selector => {
        const button = document.querySelector(selector);
        return button && !button.disabled;
      },
      {},
      classroomSaveButton
    );
    await page.click(classroomSaveButton);

    // Wait for the classroom data to be saved and the editor to close.
    await page.waitForSelector(classroomNameView, {visible: true});
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    process.exit(1);
  }
};

const enableFeatureFlag = async function (browser, page, featureName) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto('http://localhost:8181/release-coordinator', {
      waitUntil: networkIdle,
    });
    await page.waitForSelector(featuresTab);
    await page.click(featuresTab);

    // Locate the feature flag card and force-enable it for all users.
    await page.waitForSelector(featureFlagDiv);
    const featureFlags = await page.$$(featureFlagDiv);
    let targetFeatureFlag = null;
    for (let i = 0; i < featureFlags.length; i++) {
      const featureFlagNameElement = await featureFlags[i].$(
        featureFlagNameSelector
      );
      const featureFlagName = await page.evaluate(
        element => element.textContent.trim(),
        featureFlagNameElement
      );
      if (featureFlagName === featureName) {
        targetFeatureFlag = featureFlags[i];
        break;
      }
    }
    if (!targetFeatureFlag) {
      throw new Error(`Feature flag ${featureName} was not found.`);
    }

    await targetFeatureFlag.waitForSelector(featureFlagValueSelector);
    const valueSelectorElement = await targetFeatureFlag.$(
      featureFlagValueSelector
    );
    await valueSelectorElement.select('0: true');

    await targetFeatureFlag.waitForSelector(
      `${featureFlagSaveButton}:not([disabled])`,
      {visible: true}
    );
    const saveButtonElement = await targetFeatureFlag.$(featureFlagSaveButton);
    await saveButtonElement.click();

    // Wait for the feature flag configuration to be saved.
    await targetFeatureFlag.waitForSelector(
      `${featureFlagSaveButton}[disabled]`,
      {visible: true}
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    process.exit(1);
  }
};

const addThumbnailToTopic = async function (page, topicName) {
  try {
    await page.goto(TOPIC_AND_SKILLS_DASHBOARD_URL, {waitUntil: networkIdle});

    const topicLinkXPath = `//a[contains(text(), "${topicName}")]`;
    await page.waitForXPath(topicLinkXPath);
    const [topicLinkElement] = await page.$x(topicLinkXPath);
    await topicLinkElement.click();
    await page.waitForTimeout(5000);

    await page.waitForSelector(topicThumbnailButton);
    await page.click(topicThumbnailButton);

    await page.waitForSelector(topicThumbnailResetButton);
    await page.click(topicThumbnailResetButton);

    await page.waitForSelector(topicUploadButton, {visible: true});

    const elementHandle = await page.$(topicUploadButton);
    await elementHandle.uploadFile('core/tests/data/test2_svg.svg');

    await page.waitForSelector(thumbnailContainer, {visible: true});
    await page.click(topicPhotoSubmit);
    await page.waitForTimeout(3000);

    await page.waitForSelector(topicMetaTagInput);
    await page.focus(topicMetaTagInput);
    await page.type(topicMetaTagInput, 'meta');
    await page.keyboard.press('Tab');

    await page.waitForSelector(saveTopicButton);
    await page.click(saveTopicButton);
    await page.waitForSelector(topicCommitMessageInput);
    await page.focus(topicCommitMessageInput);
    await page.type(topicCommitMessageInput, 'Updated thumbnail');

    await page.waitForSelector(publishChangesButton);
    await page.click(publishChangesButton);
    await page.waitForTimeout(10000);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    process.exit(1);
  }
};

const setRoles = async function (browser, page) {
  await setRole(browser, page, 'COLLECTION_EDITOR');
  await setRole(browser, page, 'VOICEOVER_ADMIN');
  await setRole(browser, page, 'ADMIN');
  await setRole(browser, page, 'RELEASE_COORDINATOR');
  await setRole(browser, page, 'FULL_USER');
  await setRole(browser, page, 'TECH_TEAM_LEAD');
};

const runDataPagesSetup = async function (browser, page) {
  await logStep('exploration editor setup', () =>
    getExplorationEditorUrl(browser, page)
  );
  await logStep('assigning roles', () => setRoles(browser, page));

  // Feature flags must be enabled before the data-generation steps below,
  // because those steps fetch the handlers that are gated by the flags (e.g.
  // the learner group and technical feedback dashboard captures inside
  // generateDataForTopicAndStoryPlayer). On a fresh datastore the flags start
  // disabled, so enabling them here avoids the captures failing.
  await logStep('enabling story_editor_arcs flag', () =>
    enableFeatureFlag(browser, page, 'story_editor_arcs')
  );
  await logStep('enabling learner_groups flag', () =>
    enableFeatureFlag(browser, page, 'learner_groups_are_enabled')
  );
  await logStep('enabling technical_feedback flag', () =>
    enableFeatureFlag(browser, page, 'technical_feedback_dashboard_enabled')
  );
  await logStep('enabling certificate_assessment flag', () =>
    enableFeatureFlag(browser, page, 'enable_certificate_assessment')
  );
  await logStep('topic editor URL setup', () =>
    getTopicEditorUrl(browser, page)
  );
  await logStep('story editor URL setup', () =>
    getStoryEditorUrl(browser, page)
  );
  await logStep('skill editor URL setup', () =>
    getSkillEditorUrl(browser, page)
  );
  await logStep('generating topic and story data', () =>
    generateDataForTopicAndStoryPlayer(browser, page)
  );
  await logStep('generating math classroom', () =>
    generateDataForClassroom(browser, page)
  );
  await logStep('enabling diagnostic test', () =>
    enableDiagnosticTestForMathClassroom(browser, page)
  );
  await logStep('generating dummy explorations', () =>
    generateDummyExplorations(browser, page)
  );
  await logStep('loading all-interactions exploration', () =>
    reloadAllInteractionsExploration(browser, page)
  );
  await logStep('generating bare classrooms', () =>
    generateBareClassrooms(browser, page)
  );
};

const runFullSetup = async function (browser, page) {
  await logStep('logging in', () => login(browser, page));
  await logStep('data pages setup', () => runDataPagesSetup(browser, page));
  await logStep('generating blog posts', () =>
    generateDataForBlogPosts(browser, page)
  );
};

const shard2Setup = async function (browser, page) {
  await logStep('logging in', () => login(browser, page));
  await logStep('assigning roles', () => setRoles(browser, page));
  await logStep('exploration editor setup', () =>
    getExplorationEditorUrl(browser, page)
  );
  await logStep('generating blog posts', () =>
    generateDataForBlogPosts(browser, page)
  );
};

const shard3Setup = async function (browser, page) {
  await logStep('logging in', () => login(browser, page));
  await logStep('data pages setup', () => runDataPagesSetup(browser, page));
};

const shard4Setup = async function (browser, page) {
  await logStep('logging in', () => login(browser, page));
  await logStep('assigning roles', () => setRoles(browser, page));
  await logStep('enabling learner_groups flag', () =>
    enableFeatureFlag(browser, page, 'learner_groups_are_enabled')
  );
  await logStep('enabling technical_feedback flag', () =>
    enableFeatureFlag(browser, page, 'technical_feedback_dashboard_enabled')
  );
  await logStep('enabling certificate_assessment flag', () =>
    enableFeatureFlag(browser, page, 'enable_certificate_assessment')
  );
  await logStep('generating topic and story data', () =>
    generateDataForTopicAndStoryPlayer(browser, page)
  );
  await logStep('generating math classroom', () =>
    generateDataForClassroom(browser, page)
  );
  await logStep('enabling diagnostic test', () =>
    enableDiagnosticTestForMathClassroom(browser, page)
  );
};

const shard5Setup = async function (browser, page) {
  await logStep('logging in', () => login(browser, page));
  await logStep('assigning roles', () => setRoles(browser, page));
  await logStep('enabling learner_groups flag', () =>
    enableFeatureFlag(browser, page, 'learner_groups_are_enabled')
  );
  await logStep('enabling technical_feedback flag', () =>
    enableFeatureFlag(browser, page, 'technical_feedback_dashboard_enabled')
  );
  await logStep('exploration editor setup', () =>
    getExplorationEditorUrl(browser, page)
  );
  await logStep('generating topic and story data', () =>
    generateDataForTopicAndStoryPlayer(browser, page)
  );
};

const shard6Setup = async function (browser, page) {
  await logStep('logging in', () => login(browser, page));
  await logStep('assigning roles', () => setRoles(browser, page));
};

const main = async function () {
  // Change headless to false to see the puppeteer actions.
  const browser = await puppeteer.launch({
    headless: true,
    args: [],
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 1080,
  });

  var recorder = null;
  let record = process.argv[2] && process.argv[2] === '-record';
  let videoPath = process.argv[3];
  if (record && videoPath) {
    // Start recording via puppeteer-screen-recorder.
    const Config = {
      followNewTab: true,
      fps: 25,
      ffmpeg_Path: null,
      videoFrame: {
        width: 1920,
        height: 1080,
      },
      videoCrf: 18,
      videoCodec: 'libx264',
      videoPreset: 'ultrafast',
      videoBitrate: 1000,
      autopad: {
        color: 'black' | '#35A5FF',
      },
      aspectRatio: '16:9',
    };
    recorder = new PuppeteerScreenRecorder(page, Config);
    // Create directory for video in opensource.
    await recorder.start(videoPath);
  }

  const shard = Number(process.env.LIGHTHOUSE_SHARD || 0);
  const shardSetupRunners = {
    2: shard2Setup,
    3: shard3Setup,
    4: shard4Setup,
    5: shard5Setup,
    6: shard6Setup,
  };
  // Each shard runs only the setup its pages need. Shard 1 audits only static
  // public pages, so the runner never invokes this script for it. An unset
  // shard (0) keeps the previous full setup for local runs.
  const runShardSetup = shardSetupRunners[shard] || runFullSetup;
  // Only record the entities and URL lines produced by the steps the current
  // shard ran, so that unresolvable URLs are not reported. The flags below
  // mirror the setup steps each shard function executes.
  let setupKind = 'full';
  if (shard === 2) {
    setupKind = 'blog';
  } else if (shard === 3) {
    setupKind = 'data';
  } else if (shard === 4) {
    setupKind = 'classroom';
  } else if (shard === 5) {
    setupKind = 'structures';
  } else if (shard === 6) {
    setupKind = 'roles';
  }
  const ranBlogSetup = setupKind === 'full' || setupKind === 'blog';
  const ranExplorationSetup =
    setupKind === 'data' ||
    setupKind === 'full' ||
    setupKind === 'structures' ||
    setupKind === 'blog';
  const ranTopicStorySkillSetup = setupKind === 'data' || setupKind === 'full';
  const ranStructuresSetup =
    setupKind === 'data' || setupKind === 'full' || setupKind === 'structures';
  const ranClassroomSetup =
    setupKind === 'data' || setupKind === 'full' || setupKind === 'classroom';

  await runShardSetup(browser, page);

  var envEntries = [];
  if (ranExplorationSetup) {
    envEntries.push(`exploration_id=${explorationId}`);
  }
  if (ranTopicStorySkillSetup) {
    envEntries.push(`topic_id=${topicId}`);
    envEntries.push(`story_id=${storyId}`);
    envEntries.push(`skill_id=${skillId}`);
  }
  if (ranStructuresSetup) {
    envEntries.push(`learner_group_id=${learnerGroupId}`);
    envEntries.push(
      `technical_feedback_report_id=${technicalFeedbackReportId}`
    );
  }
  if (ranClassroomSetup) {
    envEntries.push(`certificate_id=${certificateId}`);
    envEntries.push(`attempt_id=${attemptId}`);
  }
  if (ranBlogSetup) {
    envEntries.push(`blog_post_url_fragment=${blogUrlFragment}`);
  }
  fs.writeFileSync('core/tests/puppeteer/.env', envEntries.join('\n'));

  var urls = [];
  if (ranTopicStorySkillSetup) {
    urls.push(topicEditorUrl);
    urls.push(storyEditorUrl);
    urls.push(skillEditorUrl);
  }
  if (ranStructuresSetup) {
    urls.push(`http://localhost:8181/learner-group/${learnerGroupId}`);
    urls.push(
      `http://localhost:8181/technical-feedback-dashboard/tech-external/${technicalFeedbackReportId}`
    );
  }
  if (ranClassroomSetup) {
    urls.push(`http://localhost:8181/certificate-assessment/${certificateId}`);
    urls.push(
      `http://localhost:8181/certificate-assessment-result/${attemptId}`
    );
  }
  if (ranExplorationSetup) {
    urls.push(explorationEditorUrl);
  }
  if (ranBlogSetup) {
    urls.push(`http://localhost:8181/blog/${blogUrlFragment}`);
  }
  await process.stdout.write(urls.join('\n'));
  if (record) {
    await recorder.stop();
  }
  await page.close();
  process.exit(0);
};

main();
