import { test, expect } from '@playwright/test';
import testConstants from '../../utilities/common/test-constants';
import { UserFactory } from '../../utilities/common/user-factory';
import { CurriculumAdmin } from '../../utilities/user/curriculum-admin';
import { TopicManager } from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;

test.describe.configure({ timeout: 4800000 });

test.describe('Topic Manager', () => {
  let topicManager: TopicManager;
  let curriculumAdmin: CurriculumAdmin;

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(4800000);

    const warmupContext = await browser.newContext();
    const warmupPage = await warmupContext.newPage();
    try {
      console.log('Warming up the server (this may take up to 60s)...');
      await warmupPage.goto('http://localhost:8181', { timeout: 120000 });
      await warmupPage.waitForSelector('.e2e-test-oppia-cookie-banner-accept-button', { state: 'visible', timeout: 120000 });
      console.log('Server is warmed up and ready!');
    } catch (e) {
      console.log('Warmup encountered an issue, proceeding anyway...');
    } finally {
      await warmupPage.close();
      await warmupContext.close();
    }

    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm', 'curriculum_adm@example.com', browser, [ROLES.CURRICULUM_ADMIN]
    );

    const explorationId = await curriculumAdmin.createAndPublishExplorationWithCards(
      'Solving problems without a calculator', 'Mathematics');
    
    // NOTE: This function automatically creates the 'Addition' skill, subtopic, AND 3 questions!
    await curriculumAdmin.createAndPublishTopic('Arithmetic Operations', 'Addition', 'Addition');
    await curriculumAdmin.addStoryToTopic('The Broken Calculator', 'the-broken-calculator', 'Arithmetic Operations');
    await curriculumAdmin.addChapter('Solving problems without a calculator', explorationId);
    await curriculumAdmin.createAndPublishClassroom('Maths', 'maths', 'Arithmetic Operations');
    await curriculumAdmin.createTopic('Whole Numbers', 'whole-numbers');
    
    await curriculumAdmin.createSkillForTopic('Subtraction', 'Arithmetic Operations', false);
    await curriculumAdmin.createSkillForTopic('Word Problems', 'Arithmetic Operations', false);

    // CREATE THE REMAINING 7 QUESTIONS HERE! (Making the total 10)
    // Doing this BEFORE logging in the Topic Manager prevents the Topic Manager's tab from idling out and freezing.
    await curriculumAdmin.createQuestionsForSkill('Addition', 7);

    await curriculumAdmin.waitForNetworkIdle();
    await curriculumAdmin.page.waitForTimeout(5000);

    // CREATE TOPIC MANAGER AFTER ALL QUESTIONS ARE DONE! (Session is 100% fresh)
    topicManager = await UserFactory.createNewUser(
      'topicManager', 
      'topic_manager@example.com', 
      browser, 
      [ROLES.TOPIC_MANAGER], 
      'Arithmetic Operations'
    );
  });

  test('should be able to edit the topic', async () => {
    test.setTimeout(4800000);

    // Since the topic manager was just created, this tab is wide awake and fast!
    await topicManager.navigateToTopicAndSkillsDashboardPage();
    await topicManager.waitForNetworkIdle();

    await topicManager.openTopicEditor('Arithmetic Operations');
    await topicManager.editTopicDetails(
      'Arithmetic Operations (New): This is the new topic description.',
      'Arithmetic Operations (New) • Oppia',
      'New A101 meta tag',
      testConstants.data.curriculumAdminThumbnailImage,
      'AO 101',
      'arithmetic-new'
    );
    await topicManager.saveTopicDraft('AO 101', 'Moved Arithmetic Operations to AO 101');
    await topicManager.expectToastMessageToBe('Changes Saved.');

    // Enable practice tab. (All 10 questions are already made!)
    await topicManager.navigateToTopicAndSkillsDashboardPage();
    await topicManager.openTopicEditor('AO 101');
    
    await topicManager.togglePracticeTabCheckbox();
    await topicManager.expectSaveChangesButtonInTopicEditorToBe('enabled');
    await topicManager.expectScreenshotToMatch('arithmeticOperationsWithPracticeTab');
    await topicManager.saveTopicDraft('AO 101', 'Enabled practice tab.');
    await topicManager.expectToastMessageToBe('Changes Saved.');

   if (process.env.MOBILE !== 'true') {
      await topicManager.navigateToTopicPreviewTab();
      await topicManager.expectTopicPreviewToHaveTitleAndDescription(
        'AO 101', 'Arithmetic Operations (New): This is the new topic description.'
      );
      await topicManager.navigateToTabInPreview('Practice');
      await topicManager.expectTabTitleInTopicPageToBe('Master Skills for AO 101');
      await topicManager.navigateToTabInPreview('Study');
      await topicManager.expectTabTitleInTopicPageToBe('Study Skills for AO 101');
    }
  });

  test.afterAll(async () => {
    await UserFactory.closeAllBrowsers();
  });
});