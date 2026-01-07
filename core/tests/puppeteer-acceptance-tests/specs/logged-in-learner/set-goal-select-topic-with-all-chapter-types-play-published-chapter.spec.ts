import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {TopicManager} from '../../utilities/user/topic-manager';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {Page} from 'puppeteer';

const ROLES = testConstants.Roles;
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Logged-In Learner', function () {
  let curriculumAdmin: CurriculumAdmin & TopicManager & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;
  let loggedInLearner1: LoggedInUser & LoggedOutUser;
  let loggedInLearner2: LoggedInUser & LoggedOutUser;
  const chapterIds: string[] = [];

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculumAdmin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseAdm',
      'releaseAdm@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    await releaseCoordinator.enableFeatureFlag(
      'serial_chapter_launch_curriculum_admin_view'
    );

    await releaseCoordinator.enableFeatureFlag(
      'serial_chapter_launch_learner_view'
    );

    await UserFactory.closeBrowserForUser(releaseCoordinator);

    await curriculumAdmin.createNewClassroom('Math', 'math');
    await curriculumAdmin.updateClassroom(
      'Math',
      'Welcome to Math classroom!',
      'This course covers basic operations.',
      'In this course, you will learn the following topics: Place Values.'
    );

    await curriculumAdmin.createAndPublishTopic(
      'Place Values',
      'Place Values subtopics',
      'Place Values skills'
    );
    await curriculumAdmin.addTopicToClassroom('Math', 'Place Values');
    await curriculumAdmin.publishClassroom('Math');

    const placeValueChapters = [
      'What are the Place Values',
      'Find the Value of a Number',
      'Comparing Numbers',
      'Rounding Numbers part 1',
      'Rounding Numbers part 2',
      'Jaya at the Market',
    ];

    for (const chapter of placeValueChapters) {
      const expId = await curriculumAdmin.createAndPublishExplorationWithCards(
        chapter,
        'Algebra',
        3
      );
      chapterIds.push(expId ?? '');
    }

    await curriculumAdmin.addStoryToTopic(
      "Jamie's Adventures in the Arcade",
      'story',
      'Place Values'
    );

    for (const [index, id] of chapterIds.entries()) {
      await curriculumAdmin.addChapter(placeValueChapters[index], id as string);
    }

    await curriculumAdmin.saveStoryDraft();
    await curriculumAdmin.publishStoryDraft();

    await curriculumAdmin.navigateToTopicAndSkillsDashboardPage();
    await curriculumAdmin.openTopicEditor('Place Values');
    await curriculumAdmin.openStoryEditor("Jamie's Adventures in the Arcade");

    await UserFactory.closeBrowserForUser(curriculumAdmin);

    loggedInLearner1 = await UserFactory.createNewUser(
      'loggedInLearner1',
      'logged_in_learner1@example.com'
    );
    loggedInLearner2 = await UserFactory.createNewUser(
      'loggedInLearner2',
      'logged_in_learner2@example.com'
    );
  }, 6000000);

  it(
    'should toggle Display More button for community lessons',
    async function () {},
    DEFAULT_SPEC_TIMEOUT_MSECS
  );
});
