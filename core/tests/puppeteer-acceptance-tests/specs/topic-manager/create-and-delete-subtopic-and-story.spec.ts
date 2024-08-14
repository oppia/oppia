import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {TopicManager} from '../../utilities/user/topic-manager';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

describe('Topic Manager', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let topicManager: TopicManager & CurriculumAdmin;
  let explorationId1: string | null;
  let explorationId2: string | null;

  const originalConsoleError = console.error;

  beforeAll(async function () {
    // Override console.error to filter out specific messages
    console.error = (message?: any, ...optionalParams: any[]) => {
      if (
        message &&
        message.includes(
          "Cannot read properties of undefined (reading 'getStory')"
        )
      ) {
        // Ignore the specific error message
        return;
      }
      // Call the original console.error method for other messages
      originalConsoleError(message, ...optionalParams);
    };

    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_Admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    explorationId1 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'test exploration 1'
      );
    explorationId2 =
      await curriculumAdmin.createAndPublishAMinimalExplorationWithTitle(
        'test exploration 2'
      );

    await curriculumAdmin.createTopic('Addition', 'add');

    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Addition'
    );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should create a topic, add a subtopic, story, and chapters to it.',
    async function () {
      await topicManager.navigateToTopicAndSkillsDashboardPage();
      await topicManager.createSubtopicForTopic(
        'Test Subtopic 1',
        'test-subtopic-one',
        'Addition'
      );
      // Verify the subtopic is present in the topic.
      await topicManager.verifySubtopicPresenceInTopic(
        'Test Subtopic 1',
        'Addition',
        true
      );

      await topicManager.addStoryToTopic(
        'Test Story 1',
        'test-story-one',
        'Addition'
      );
      // Creating 2 chapter in the story so that we can test delete the second one (cannot delete the first chapter).
      await topicManager.addChapter('Test Chapter 1', explorationId1 as string);
      await topicManager.addChapter('Test Chapter 2', explorationId2 as string);
      await topicManager.saveStoryDraft();

      // Verify the story is present in the topic.
      await topicManager.verifyStoryPresenceInTopic(
        'Test Story 1',
        'Addition',
        true
      );

      // Verify the chapter is present in the story.
      await topicManager.verifyChapterPresenceInStory(
        'Test Chapter 1',
        'Test Story 1',
        'Addition',
        true
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should delete a chapter from a story, delete the story from a topic, and delete the subtopic from a topic.',
    async function () {
      await topicManager.deleteSubtopicFromTopic('Test Subtopic 1', 'Addition');
      await topicManager.saveTopicDraft('Addition');
      await topicManager.verifySubtopicPresenceInTopic(
        'Test Subtopic 1',
        'Addition',
        false
      );

      // Deleting 2nd chapter since topic manager cannot delete the first chapter.
      await topicManager.deleteChapterFromStory(
        'Test Chapter 2',
        'Test Story 1',
        'Addition'
      );
      await topicManager.saveStoryDraft();

      await topicManager.verifyChapterPresenceInStory(
        'Test Chapter 2',
        'Test Story 1',
        'Addition',
        false
      );

      await topicManager.deleteStoryFromTopic('Test Story 1', 'Addition');
      await topicManager.saveTopicDraft('Addition');
      await topicManager.verifyStoryPresenceInTopic(
        'Test Story 1',
        'Addition',
        false
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    console.error = originalConsoleError;
    await UserFactory.closeAllBrowsers();
  });
});
