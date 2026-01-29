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
const chapterTitleSelector = '.e2e-test-chapter-title';
const chapterEditorContainerSelector = '.e2e-test-chapter-editor';
const chapterDescriptionField = '.e2e-test-add-chapter-description';
const mobileCollapsibleCardHeaderSelector =
  '.oppia-mobile-collapsible-card-header';
const plannedPublicationDateInput = '.e2e-test-planned-publication-date-input';
const outlineEditorInput = '.e2e-test-rte';
const saveOutlineButton = '.e2e-test-node-outline-save-button';
const finalizeOutlineCheckbox = '.e2e-test-finalize-outline';
const markAsReadyToPublishButton = '.e2e-test-mark-as-ready-to-publish-button';
describe('Logged-In Learner', function () {
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor & TopicManager;
  let releaseCoordinator: ReleaseCoordinator;
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
  }, 6000000);

  it(
    'should should create, track upcoming or delayed publications, and publish chapters.',
    async function () {
      await curriculumAdmin.openStoryEditor(
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );
      await curriculumAdmin.waitForPageToFullyLoad();

      await curriculumAdmin.page.waitForSelector(chapterTitleSelector);
      const chapterTitles = await curriculumAdmin.page.$$(chapterTitleSelector);

      for (const titleElement of chapterTitles) {
        const title = await curriculumAdmin.page.evaluate(
          el => el.textContent.trim(),
          titleElement
        );

        if (title === 'What are the Place Values') {
          await titleElement.click();
          await curriculumAdmin.waitForStaticAssetsToLoad();
          await curriculumAdmin.expectElementToBeVisible(
            chapterEditorContainerSelector
          );

          if (curriculumAdmin.isViewportAtMobileWidth()) {
            await curriculumAdmin.page.waitForSelector(
              mobileCollapsibleCardHeaderSelector
            );
            const elements = await curriculumAdmin.page.$$(
              mobileCollapsibleCardHeaderSelector
            );
            if (elements.length < 5) {
              throw new Error('Not enough elements collapsible headers found,');
            }
            await elements[2].click();
            await elements[3].click();
            await elements[4].click();
          }
        }
      }
      await curriculumAdmin.typeInInputField(
        chapterDescriptionField,
        'This is a chapter description.'
      );

      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1); //Flaky nature

      const dateString = futureDate.toLocaleDateString('en-US');

      await curriculumAdmin.setNodePlannedPublicationDate(
        plannedPublicationDateInput,
        dateString
      );

      await curriculumAdmin.typeInInputField(
        outlineEditorInput,
        'This is an outline.'
      );
      await curriculumAdmin.clickOnElementWithSelector(saveOutlineButton);
      // await curriculumAdmin.page.waitForSelector(finalizeOutlineCheckbox);
      await curriculumAdmin.clickOnElementWithSelector(finalizeOutlineCheckbox);
      await curriculumAdmin.addAcquiredSkill('Place Values skills');

      await curriculumAdmin.saveStoryDraft();
      await curriculumAdmin.page.waitForSelector(markAsReadyToPublishButton);
      await curriculumAdmin.clickOnElementWithSelector(
        markAsReadyToPublishButton
      );

      await curriculumAdmin.expectElementToBeVisible(
        markAsReadyToPublishButton,
        false
      );

      await curriculumAdmin.expectScreenshotToMatch(
        'chapterMarkedAsReadyToPublish.png',
        __dirname
      );

      await curriculumAdmin.openStoryEditor(
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );
      await curriculumAdmin.waitForPageToFullyLoad();
      await curriculumAdmin.clickOnElementWithSelector(
        publishUptoChaptersDropdownSelector
      );
      await curriculumAdmin.select(publishUptoChaptersDropdownSelector, '0');
      await curriculumAdmin.expectScreenshotToMatch(
        'publishChapterUpto1.png',
        __dirname
      );
      await curriculumAdmin.clickOnElementWithSelector(publishChapterButton);

      // UnPublish Functionality test had to add

      await curriculumAdmin.makeChapterReadtToPublish(
        'Find the Value of a Number',
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );
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
      await curriculumAdmin.openStoryEditor(
        "Jamie's Adventures in the Arcade",
        'Place Values'
      );
      await curriculumAdmin.waitForPageToFullyLoad();
      await curriculumAdmin.expectScreenshotToMatch(
        'allChapterInPublishedState.png',
        __dirname
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );
  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
