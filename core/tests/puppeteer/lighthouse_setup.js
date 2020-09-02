const process = require('process');
const puppeteer = require('puppeteer');

const SERVER_URL_PREFIX = 'http://127.0.0.1:8181/';
const ADMIN_URL = 'admin';
const CREATOR_DASHBOARD_URL = 'creator-dashboard';
const TOPIC_AND_SKILLS_DASHBOARD_URL = 'topics-and-skills-dashboard'

var explorationEditorUrl = 'Exploration editor not loaded';
var collectionEditorUrl = 'Collection editor not loaded';
var topicEditorUrl = 'Topic editor not loaded';
var storyEditorUrl = 'Story editor not loaded';
var skillEditorUrl = 'Skill editor not loaded';

var createButtonSelector = '.protractor-test-create-activity';
var createCollectionButtonSelector = '.protractor-test-create-collection';

var createTopicButtonSelector = '.protractor-test-create-topic-button';
var topicNameField = '.protractor-test-new-topic-name-field';
var topicUrlFragmentField = '.protractor-test-new-topic-url-fragment-field';
var topicDescriptionField = '.protractor-test-new-topic-description-field';
var topicThumbnailButton = '.protractor-test-photo-button';
var topicUploadButton = '.protractor-test-photo-upload-input'
var topicPhotoSubmit = '.protractor-test-photo-upload-submit'
var thumbnailContainer = '.protractor-test-thumbnail-container';
var confirmTopicCreationButton = '.protractor-test-confirm-topic-creation-button';

var createStoryButtonSelector = '.protractor-test-create-story-button';
var storyNameField = '.protractor-test-new-story-title-field';
var storyUrlFragmentField = '.protractor-test-new-story-url-fragment-field';
var storyDescriptionField = '.protractor-test-new-story-description-field';
var storyThumbnailButton = '.protractor-test-photo-button';
var storyUploadButton = '.protractor-test-photo-upload-input'
var storyPhotoSubmit = '.protractor-test-photo-upload-submit'
var thumbnailContainer = '.protractor-test-thumbnail-container';
var confirmStoryCreationButton = '.protractor-test-confirm-story-creation-button';

var createSkillButtonSelector = '.puppeteer-test-add-skill-button'
var skillDescriptionField = '.protractor-test-new-skill-description-field'
var skillOpenConceptCard = '.protractor-test-open-concept-card'
var skillEditor = '.protractor-test-concept-card-text'
var confirmSkillCreationButton ='.protractor-test-confirm-skill-creation-button'
var skillReviewMaterialInput = '.oppia-rte';




const login = async function(browser, page) {
    try {
      // eslint-disable-next-line dot-notation
      await page.goto(SERVER_URL_PREFIX + ADMIN_URL, { waitUntil: 'networkidle0' });
      await page.waitForSelector('#admin', {visible: true});
      await page.click('#admin');
      await page.click('#submit-login')
      // This is to check if the user's account was already made.
      try {
        await page.waitForSelector('#username', {visible: true});
        await page.type('#username', 'username1');
        await page.click('#terms-checkbox');
        await page.waitForSelector('#signup-submit');
        await page.click('#signup-submit');
        await page.waitForSelector('.oppia-navbar-dropdown-toggle');
      } catch (error) {
        console.log(error);
        // Already Signed in.
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Login Failed');
      // eslint-disable-next-line no-console
      console.log(e);
    }
  };

const setRole = async function(browser, page, role) {
  try {
    // eslint-disable-next-line dot-notation
    await page.goto('http://127.0.0.1:8181/admin#/roles', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#update-role-username-input');
    await page.type('#update-role-username-input', 'username1');
    await page.select('#update-role-input', role);
    await page.waitForSelector('#update-button-id');
    await page.click('#update-button-id');
    await page.waitForSelector('.protractor-test-status-message');
    await page.waitForFunction(
      'document.querySelector(' +
        '".protractor-test-status-message").innerText.includes(' +
        '"successfully updated to")'
    );
    await page.goto('http://127.0.0.1:8181/creator-dashboard', { waitUntil: 'networkidle0' });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('Changing role to admin failed');
    // eslint-disable-next-line no-console
    console.log(e);
  }
};

const getExplorationEditorUrl = async function(browser, page) {
    try {
        // eslint-disable-next-line dot-notation
        await page.goto(
          SERVER_URL_PREFIX + CREATOR_DASHBOARD_URL, { waitUntil: 'networkidle0' });
        await page.waitForSelector(createButtonSelector, {visible: true});
        await page.click(createButtonSelector);
        await page.waitForSelector('.protractor-test-dismiss-welcome-modal', {visible: true});
        explorationEditorUrl = await page.url();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
      }
    };


const getCollectionEditorUrl = async function(browser, page) {
  try {
    await setRole(browser, page, 'string:COLLECTION_EDITOR');
    // Load in Collection
    // eslint-disable-next-line dot-notation
    await page.goto(
      SERVER_URL_PREFIX + CREATOR_DASHBOARD_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector(createButtonSelector, {visible: true});
    await page.click(createButtonSelector);
    await page.waitForSelector(createCollectionButtonSelector, {visible: true});
    await page.click(createCollectionButtonSelector);
    await page.waitForSelector('.protractor-test-add-exploration-input', {visible: true});
    collectionEditorUrl = await page.url();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('Creating Collections Failed');
    // eslint-disable-next-line no-console
    console.log(e);
  }
};

const getTopicEditorUrl = async function(browser, page) {
  try {
      await setRole(browser, page, 'string:ADMIN'); 
      // eslint-disable-next-line dot-notation
      await page.goto(
        SERVER_URL_PREFIX + TOPIC_AND_SKILLS_DASHBOARD_URL, { waitUntil: 'networkidle0' });
      await page.waitForSelector(createTopicButtonSelector, {visible: true});
      await page.click(createTopicButtonSelector);

      await page.waitForSelector(topicNameField, {visible: true});
      await page.type(topicNameField, 'Topic1 TASD');
      await page.type(topicUrlFragmentField, 'topic-tasd-one');
      await page.type(topicDescriptionField, 'Topic 1 description');
      await page.click(topicThumbnailButton);
      await page.waitForSelector(topicUploadButton, {visible: true});
      
      const elementHandle = await page.$(topicUploadButton);
      await elementHandle.uploadFile('core/tests/data/test_svg.svg');
      
      await page.waitForSelector(thumbnailContainer, {visible: true});
      await page.click(topicPhotoSubmit);

      await page.waitForSelector(confirmTopicCreationButton, {visible: true});
      await page.waitFor(5000);
      await page.click(confirmTopicCreationButton);
      // Doing waitFor(10000) to handle new tab being opened.
      await page.waitFor(10000);
      let pages = await browser.pages();
      topicEditorUrl = await pages[2].url();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  };

const getStoryEditorUrl = async function(browser, page) {
  try {
      // eslint-disable-next-line dot-notation
      await page.goto(topicEditorUrl, { waitUntil: 'networkidle0' });
      await page.waitForSelector(createStoryButtonSelector, {visible: true});
      await page.click(createStoryButtonSelector);

      await page.waitForSelector(storyNameField, {visible: true});
      await page.type(storyNameField, 'Topic1 TASD');
      await page.type(storyUrlFragmentField, 'topic-tasd-one');
      await page.type(storyDescriptionField, 'Topic 1 description');
      await page.click(storyThumbnailButton);
      await page.waitForSelector(storyUploadButton, {visible: true});
      
      const elementHandle = await page.$(storyUploadButton);
      await elementHandle.uploadFile('core/tests/data/test_svg.svg');
      
      await page.waitForSelector(thumbnailContainer, {visible: true});
      await page.click(storyPhotoSubmit);

      await page.waitForSelector(confirmStoryCreationButton, {visible: true});
      await page.waitFor(5000);
      await page.click(confirmStoryCreationButton);
      // Todo Change this to WaitForSelector of an element in the story editor page
      await page.waitFor(15000);
      storyEditorUrl = page.url();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  };
  
const getSkillEditorUrl = async function(browser, page) {
  try {
      // eslint-disable-next-line dot-notation
      await page.goto(topicEditorUrl, { waitUntil: 'networkidle0' });
      await page.waitForSelector(createSkillButtonSelector, {visible: true});
      await page.click(createSkillButtonSelector);

      await page.waitForSelector(skillDescriptionField, {visible: true});
      await page.type(skillDescriptionField, 'Skill Description here');
      await page.click(skillOpenConceptCard);
      await page.waitForSelector(skillReviewMaterialInput, {visible: true});
      await page.waitFor(5000);
      await page.keyboard.type('Skill Overview here');
      
      await page.waitForSelector(confirmSkillCreationButton, {visible: true});
      await page.waitFor(5000);
      await page.click(confirmSkillCreationButton);
      // Doing waitFor(15000) to handle new tab being opened.
      await page.waitFor(15000);
      let pages = await browser.pages();
      skillEditorUrl = await pages[3].url();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  };

const main = async function() {
  // Change headless to false to see the puppeteer actions.
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await login(browser, page);
  await getExplorationEditorUrl(browser, page);
  await getCollectionEditorUrl(browser, page);
  await getTopicEditorUrl(browser, page);
  await getStoryEditorUrl(browser, page);
  await getSkillEditorUrl(browser, page);
  await process.stdout.write(
    [
      new URL(explorationEditorUrl),
      new URL(collectionEditorUrl),
      new URL(topicEditorUrl),
      new URL(storyEditorUrl),
      new URL(skillEditorUrl),
    ].join('\n')
  );
  await page.close();
  process.exit();
}

main();