import { test} from '@playwright/test';
import testConstants from '../../utilities/common/test-constants';
import { UserFactory } from '../../utilities/common/user-factory';
import { TopicManager } from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;

test.describe.configure({ timeout: 4800000 });

test.describe('Topic Manager', () => {
  let topicManager: TopicManager;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let curriculumAdmin: any;

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(4800000);

    const warmupContext = await browser.newContext();
    const warmupPage = await warmupContext.newPage();
    try {
      await warmupPage.goto('http://localhost:8181', { timeout: 120000 });
      await warmupPage.waitForSelector('.e2e-test-oppia-cookie-banner-accept-button', { state: 'visible', timeout: 120000 });
    } catch (e) {
      // Warmup encountered an issue; proceed anyway.
    } finally {
      await warmupPage.close();
      await warmupContext.close();
    }

    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm', 'curriculum_adm@example.com', browser, [ROLES.CURRICULUM_ADMIN]
    );

    const explorationId = await curriculumAdmin.createAndPublishExplorationWithCards(
  'Solving problems without a calculator',
  'Mathematics',
  2,
  true
);
    
    // Note: This function automatically creates the 'Addition' skill, subtopic, and 3 questions.
    await curriculumAdmin.createAndPublishTopic('Arithmetic Operations', 'Addition', 'Addition');
    await curriculumAdmin.addStoryToTopic('The Broken Calculator', 'the-broken-calculator', 'Arithmetic Operations');
    await curriculumAdmin.addChapter('Solving problems without a calculator', explorationId);
    await curriculumAdmin.createAndPublishClassroom('Maths', 'maths', 'Arithmetic Operations');
    await curriculumAdmin.createTopic('Whole Numbers', 'whole-numbers');
    
    await curriculumAdmin.createSkillForTopic('Subtraction', 'Arithmetic Operations', false);
    await curriculumAdmin.createSkillForTopic('Word Problems', 'Arithmetic Operations', false);

    // Create the remaining 7 questions here (making the total 10). 
    // Doing this before logging in the Topic Manager prevents the Topic Manager tab from idling out.
    await curriculumAdmin.createQuestionsForSkill('Addition', 7);

    await curriculumAdmin.waitForNetworkIdle();
    await curriculumAdmin.page.waitForTimeout(5000);

    // Create topic manager after all questions are done.
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

    // Since the topic manager was just created, this tab is wide awake and fast.
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
    await topicManager.saveTopicDraft('AO 101');
    await topicManager.verifyTopicManagerToastMessage('Changes Saved.');

    // Enable practice tab.
    await topicManager.navigateToTopicAndSkillsDashboardPage();
    await topicManager.openTopicEditor('AO 101');
    
    await topicManager.togglePracticeTabCheckbox();
    await topicManager.expectSaveChangesButtonInTopicEditorToBe('enabled');
    await topicManager.saveTopicDraft('AO 101');
    await topicManager.verifyTopicManagerToastMessage('Changes Saved.');

  if (process.env.MOBILE !== 'true') {
      await topicManager.navigateToTopicPreviewTab();
      await topicManager.expectTopicPreviewToHaveTitleAndDescription(
        'AO 101', 'Arithmetic Operations (New): This is the new topic description.'
      );
      await topicManager.navigateToTabInPreview('Practice');
      await topicManager.verifyTopicManagerTabTitle('Master Skills for AO 101');
      await topicManager.navigateToTabInPreview('Study');
      await topicManager.verifyTopicManagerTabTitle('Study Skills for AO 101');
    }
  });

  test.afterAll(async () => {
    await UserFactory.closeAllBrowsers();
  });
});