

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {TopicManager} from '../../utilities/user/topic-manager';

const ROLES = testConstants.Roles;

describe('Topic Manager', function () {
  let topicManager: TopicManager & CurriculumAdmin & ExplorationEditor;
  let curriculumAdmin: CurriculumAdmin & ExplorationEditor;
  let explorationId: string;
  let secondExplorationId: string;

  beforeAll(async function () {
    curriculumAdmin = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_adm@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    // Prepare explorations for chapters.
    explorationId = await curriculumAdmin.createAndPublishExplorationWithCards(
      'Solving problems without a calculator',
      'Mathematics'
    );
    secondExplorationId = await curriculumAdmin.createAndPublishExplorationWithCards(
      'Basic Multiplication',
      'Mathematics'
    );

    // Setup Topic and Classroom.
    await curriculumAdmin.createAndPublishTopic(
      'Arithmetic Operations',
      'Addition',
      'Addition'
    );
    await curriculumAdmin.createAndPublishClassroom(
      'Maths',
      'maths',
      'Arithmetic Operations'
    );

    // Create skills for testing prerequisite/acquired logic.
    await curriculumAdmin.createSkillFromSkillsDashboard(
      'Subtraction',
      'Review Material for Subtraction'
    );
    await curriculumAdmin.createSkillFromSkillsDashboard(
      'Word Problems',
      'Review Material for Word Problems'
    );

    // Create topic manager user.
    topicManager = await UserFactory.createNewUser(
      'topicManager',
      'topic_manager@example.com',
      [ROLES.TOPIC_MANAGER],
      'Arithmetic Operations'
    );
  }, 600000);

  it('should handle duplicate exploration warnings and chapter reordering', async function () {
    await topicManager.openTopicEditor('Arithmetic Operations');
    await topicManager.addStoryToTopic(
      'The Story of Numbers',
      'story-numbers',
      'Arithmetic Operations',
      'meta tag content',
      testConstants.data.profilePicture
    );

    // 1. Add first chapter.
    await topicManager.addChapter('Chapter One', explorationId);
    
    // 2. Scenario: Same exploration for two chapters -> Warning validation.
    // We try to add a new chapter with the SAME explorationId as Chapter One.
    await topicManager.addChapterWithoutSaving('Chapter Two Duplicate', explorationId);
    await topicManager.expectWarningMessage('Exploration ID already used in this story');
    
    // Dismiss or fix the exploration ID to proceed.
    await topicManager.cancelChapterCreation();
    await topicManager.addChapter('Chapter Two', secondExplorationId);

    // 3. Scenario: Reorder chapters.
    await topicManager.expectChaptersToBeInOrder(['Chapter One', 'Chapter Two']);
    await topicManager.reorderChapters(0, 1); // Drag index 0 to index 1.
    await topicManager.expectChaptersToBeInOrder(['Chapter Two', 'Chapter One']);
    
    await topicManager.saveStoryDraft('Added chapters and tested reordering');
  });

  it('should validate, edit, and delete prerequisite and acquired skills', async function () {
    await topicManager.openStoryEditor('The Story of Numbers', 'Arithmetic Operations');
    await topicManager.openChapterEditor('Chapter Two');

    // Add skills.
    await topicManager.addPrerequisiteSkill('Subtraction');
    await topicManager.addAcquiredSkill('Word Problems');
    await topicManager.saveStoryDraft('Added skills to chapter');

    // Verify presence.
    await topicManager.expectPrerequisiteSkillToBeVisible('Subtraction');
    await topicManager.expectAquiredSkillToBeVisible('Word Problems');

    // Scenario: Delete prerequisite and acquired skills.
    await topicManager.deletePrerequisiteSkill('Subtraction');
    await topicManager.deleteAcquiredSkill('Word Problems');
    
    await topicManager.expectPrerequisiteSkillNotToBeVisible('Subtraction');
    await topicManager.expectAquiredSkillNotToBeVisible('Word Problems');
    
    await topicManager.saveStoryDraft('Deleted skills from chapter');
  });

  it('should be able to edit story details and then delete the story', async function () {
    await topicManager.openTopicEditor('Arithmetic Operations');
    await topicManager.openStoryEditor('The Story of Numbers', 'Arithmetic Operations');

    await topicManager.editStoryDetails(
      'Final Story Title',
      'Final Description',
      'Final Meta Tag',
      'final-url-fragment'
    );
    await topicManager.saveStoryDraft('Updated story details');

    // Delete the story and ensure the list is empty.
    await topicManager.openTopicEditor('Arithmetic Operations');
    await topicManager.deleteStory('Final Story Title');
    await topicManager.saveTopicDraft('Arithmetic Operations', 'Removed the story');
    await topicManager.expectStoriesListToBeEmpty();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});