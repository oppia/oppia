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

var FirebaseAdmin = require('firebase-admin');
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

var emailInput = '.e2e-test-sign-in-email-input';
var signInButton = '.e2e-test-sign-in-button';
var usernameInput = '.e2e-test-username-input';
var agreeToTermsCheckBox = '.e2e-test-agree-to-terms-checkbox';
var registerUser = '.e2e-test-register-user:not([disabled])';
var navbarToggle = '.oppia-navbar-dropdown-toggle';

var createButtonSelector = '.e2e-test-create-activity';
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
var topicPhotoSubmit = '.e2e-test-photo-upload-submit';
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
var skillReviewMaterialInput = '.oppia-rte';
var skillCkEditor = '.e2e-test-ck-editor';

var usernameInputFieldForRolesEditing = '.e2e-test-username-for-role-editor';
var editUserRoleButton = '.e2e-test-role-edit-button';
var roleEditorContainer = '.e2e-test-roles-editor-card-container';
var addNewRoleButton = '.e2e-test-add-new-role-button';
var roleSelect = '.e2e-test-new-role-selector';
var generateTopicButton = '.load-dummy-new-structures-data-button';
var generateClassroomButton = '.load-dummy-math-classroom';
var topicThumbnailResetButton = '.e2e-test-thumbnail-reset-button';
var topicMetaTagInput = '.e2e-test-topic-meta-tag-content-field';
var saveTopicButton = '.e2e-test-save-topic-button';
var topicCommitMessageInput = '.e2e-test-commit-message-input';
var publishChangesButton = '.e2e-test-close-save-modal-button';
var cookieBannerAcceptButton = '.e2e-test-oppia-cookie-banner-accept-button';

const login = async function (browser, page) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto(ADMIN_URL, {waitUntil: networkIdle});
    await page.waitForSelector(emailInput, {visible: true});
    await page.type(emailInput, 'testadmin@example.com');
    await page.click(signInButton);
    // Checks if the user's account was already made.
    try {
      let cookies = await page.cookies();
      if (!cookies.find(item => item.name === 'OPPIA_COOKIES_ACKNOWLEDGED')) {
        await page.waitForSelector(cookieBannerAcceptButton, {visible: true});
        await page.click(cookieBannerAcceptButton);
      }
      await page.waitForSelector(usernameInput, {visible: true});
      await page.type(usernameInput, 'username1');
      await page.click(agreeToTermsCheckBox);
      await page.waitForSelector(registerUser);
      await page.click(registerUser);
      await page.waitForSelector(navbarToggle);
    } catch (error) {
      // Already Signed in.
    }
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
    var selector = `mat-option[ng-reflect-value="${role}"]`;
    await page.click(selector);
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
    await page.waitForSelector(dismissWelcomeModalSelector, {visible: true});

    await page.click(dismissWelcomeModalSelector);
    await page.waitForTimeout(3000);
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

    await page.waitForTimeout(3000);
    await page.waitForSelector('mat-option');
    await page.waitForTimeout(3000);
    await page.click('mat-option[ng-reflect-value="Algebra"]');

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
    await page.waitForSelector(skillCkEditor, {visible: true});
    await page.click(skillCkEditor);
    await page.keyboard.type('Skill Overview here');

    await page.waitForSelector(confirmSkillCreationButton, {visible: true});
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

const main = async function () {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'firebase:9099';
  FirebaseAdmin.initializeApp({projectId: 'dev-project-id'});
  // Change headless to false to see the puppeteer actions.
  const browser = await puppeteer.launch({
    headless: true,
    // Sandbox requires a non-root user, and we use a root user in docker.
    // Thus, we need to disable the sandbox.
    args: ['--no-sandbox'],
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

  await login(browser, page);
  await getExplorationEditorUrl(browser, page);

  await setRole(browser, page, 'COLLECTION_EDITOR');

  await setRole(browser, page, 'ADMIN');
  await getTopicEditorUrl(browser, page);
  await getStoryEditorUrl(browser, page);
  await getSkillEditorUrl(browser, page);
  await generateDataForTopicAndStoryPlayer(browser, page);
  await generateDataForClassroom(browser, page);

  fs.writeFileSync(
    'core/tests/puppeteer/.env',
    `exploration_id=${explorationId}\n` +
      `story_id=${storyId}\n` +
      `topic_id=${topicId}\n` +
      `skill_id=${skillId}\n`
  );

  await process.stdout.write(
    [explorationEditorUrl, topicEditorUrl, storyEditorUrl, skillEditorUrl].join(
      '\n'
    )
  );
  if (record) {
    await recorder.stop();
  }
  await page.close();
  process.exit(0);
};

main();
