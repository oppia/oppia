import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {TopicManager} from '../../utilities/user/topic-manager';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';

const ROLES = testConstants.Roles;
const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const publishUptoChaptersDropdownSelector =
  'select.e2e-test-publish-up-to-chapter-dropdown';
const publishChapterButton = '.e2e-test-publish-chapters-button';
const returnToStoryFromLastStateSelector =
  '.e2e-test-end-chapter-return-to-story';
const studyGuideRecommendationSelector =
  '.e2e-test-study-guide-recommendation-text';
const topicPageRevisionTabContentSelector =
  '.e2e-test-topic-viewer-revision-tab';
describe('Logged-In Learner', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
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

    await releaseCoordinator.enableFeatureFlag(
      'show_redesigned_learner_dashboard'
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
        1
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

    await curriculumAdmin.makeChapterReadtToPublish(
      'What are the Place Values',
      "Jamie's Adventures in the Arcade",
      'Place Values'
    );
    await curriculumAdmin.makeChapterReadtToPublish(
      'Find the Value of a Number',
      "Jamie's Adventures in the Arcade",
      'Place Values'
    );

    //Create function for this
    await curriculumAdmin.openStoryEditor(
      "Jamie's Adventures in the Arcade",
      'Place Values'
    );
    await curriculumAdmin.waitForPageToFullyLoad();
    await curriculumAdmin.clickOnElementWithSelector(
      publishUptoChaptersDropdownSelector
    );
    await curriculumAdmin.select(publishUptoChaptersDropdownSelector, '0');
    await curriculumAdmin.clickOnElementWithSelector(publishChapterButton);

    loggedInLearner1 = await UserFactory.createNewUser(
      'loggedInLearner1',
      'logged_in_learner1@example.com'
    );
    loggedInLearner2 = await UserFactory.createNewUser(
      'loggedInLearner2',
      'logged_in_learner2@example.com'
    );

    // await UserFactory.closeBrowserForUser(curriculumAdmin);
  }, 6000000);

  xit(
    'should set goal, select topic with all chapter types and play published chapter successfully',
    async function () {
      await loggedInLearner1.navigateToLearnerDashboard();

      await loggedInLearner1.navigateToGoalsSection();
      await loggedInLearner1.clickOnAddGoalsButtonInRedesignedLearnerDashboard();

      await loggedInLearner1.clickOnGoalCheckboxInRedesignedLearnerDashboard(
        'Place Values',
        true
      );

      await loggedInLearner1.submitGoalInRedesignedLearnerDashboard();

      await loggedInLearner1.expectGoalCardToBeVisible('Place Values');
      await loggedInLearner1.clickOnGoalCard('Place Values');

      await loggedInLearner1.expectScreenshotToMatch(
        'Chap1StartRestCommingSoon',
        __dirname
      );
      await loggedInLearner1.clickLessonCardButton('What are the Place Values');

      await loggedInLearner1.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson!'
      );

      await loggedInLearner1.returnToStoryFromLastState();

      //Make function For Clicking chapter in story view page

      // await loggedInLearner1.expectElementToBeClickable(
      //   '.e2e-test-chapter-title:has-text("What are the Place Values")',
      // );

      // await loggedInLearner1.expectElementToBeClickable(
      //   '.e2e-test-chapter-title:has-text("Find the Value of a Number")',
      //   true // Make it false after kishan PR merged
      // );

      await loggedInLearner1.expectScreenshotToMatch(
        'Chap1AvailableChap2CommingSoon',
        __dirname
      );
      await loggedInLearner1.navigateToLearnerDashboard();
      await loggedInLearner1.expectContinueWhereYouLeftOffSectionToContainLessonCards(
        ['Find the Value of a Number']
      );
      await loggedInLearner1.expectScreenshotToMatch(
        'Chap2ShowInContinueWhereYouLeftOff',
        __dirname
      );

      await loggedInLearner1.navigateToGoalsSection();
      await loggedInLearner1.clickOnGoalCard('Place Values');

      // Todo : Creat a fcuntion to check progress percentage in lesson card in goal section
      // await loggedInLearner1.expectLessonCardProgressToBe(
      //   'Lessons in progress',
      //   ['Chapter 1: What are the Place Values'],
      //   100
      // );

      await loggedInLearner1.expectLessonCardButtonLabel(
        'Find the Value of a Number',
        'Comming Soon'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );
  xit(
    'should learner sees available and coming soon chapters in a topic',
    async function () {
      await loggedInLearner2.navigateToClassroomPage('math');
      await loggedInLearner2.selectAndOpenTopic('Place Values');

      //Working Fine availableLessonListHasChapters function and commingSoonLessonListHasChapters function
      // await loggedInLearner2.availableLessonListHasChapters([
      //   'What are the Place Values'
      // ]);
      // await loggedInLearner2.commingSoonLessonListHasChapters([
      //   'Find the Value of a Number'
      // ]);

      //Need to  create function for this
      // await loggedInLearner2.expectElementToBeClickable(
      //   '.chapter-title a:has-text("Find the Value of a Number")',
      //   true // Makle it false after kishan PR merged
      // );

      await loggedInLearner2.selectAndPlayChapter('What are the Place Values');

      await loggedInLearner2.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson! You will now start the lesson from the beginning the next time you come back'
      );
      await loggedInLearner2.expectElementToBeVisible(
        returnToStoryFromLastStateSelector
      );
      await loggedInLearner2.expectElementToBeVisible(
        studyGuideRecommendationSelector
      );
      await loggedInLearner2.returnToStoryFromLastState();
      // await loggedInLearner2.expectElementToBeClickable(
      //   '.e2e-test-chapter-title:has-text("Find the Value of a Number")',
      //   false
      // );

      await loggedInLearner2.expectScreenshotToMatch(
        'Chap2GreadedOutHasComingSoonLabel',
        __dirname
      );
      // await loggedInLearner2.expectElementToBeClickable(
      //   '.e2e-test-chapter-title:has-text("What are the Place Values")',
      // );
      await loggedInLearner2.selectAndPlayChapter('What are the Place Values');

      await loggedInLearner2.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson! You will now start the lesson from the beginning the next time you come back'
      );
      await loggedInLearner2.clickOnElementWithSelector(
        studyGuideRecommendationSelector
      );
      await loggedInLearner2.expectElementToBeVisible(
        topicPageRevisionTabContentSelector
      ); //Make Selector For LInk and Text Different
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );
  it(
    'should learner sees available and coming soon chapters in a topic',
    async function () {
      await curriculumAdmin.makeChapterReadtToPublish(
        'Comparing Numbers',
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );
      await curriculumAdmin.makeChapterReadtToPublish(
        'Rounding Numbers part 1',
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );
      await curriculumAdmin.makeChapterReadtToPublish(
        'Rounding Numbers part 2',
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );

      //Create function for this
      await curriculumAdmin.openStoryEditor(
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );
      await curriculumAdmin.waitForPageToFullyLoad();
      await curriculumAdmin.clickOnElementWithSelector(
        publishUptoChaptersDropdownSelector
      );
      await curriculumAdmin.select(publishUptoChaptersDropdownSelector, '3');
      await curriculumAdmin.clickOnElementWithSelector(publishChapterButton);

      await loggedInLearner2.navigateToClassroomPage('math');
      await loggedInLearner2.selectAndOpenTopic('Place Values');
      await loggedInLearner2.availableLessonListHasChapters([
        'What are the Place Values',
        'Find the Value of a Number',
        'Comparing Numbers',
        'Rounding Numbers part 1',
      ]);

      await loggedInLearner1.navigateToLearnerDashboard();
      await loggedInLearner1.navigateToProgressSection();

      await loggedInLearner1.expectLessonCardToHaveNewLabel(
        'Find the Value of a Number'
      );
      await loggedInLearner1.resumeLessonFromLearnerDashboard(
        'Find the Value of a Number'
      );
      await loggedInLearner2.expectExplorationCompletionToastMessage(
        'Congratulations for completing this lesson! You will now start the lesson from the beginning the next time you come back'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );
});
