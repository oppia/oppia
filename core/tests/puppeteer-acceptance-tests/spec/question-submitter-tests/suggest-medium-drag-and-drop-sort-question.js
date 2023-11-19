// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance Test for practice question submitters to
 * suggest question of medium difficulty with a drag and drop sort
 * interaction.
 */

const userFactory = require(
  '../../puppeteer-testing-utilities/user-factory.js');
const testConstants = require(
  '../../puppeteer-testing-utilities/test-constants.js');

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Practice Question Submitter', function() {
  const topicName = 'Test Topic';
  const skillDescription = 'Counting';
  const mediumDifficultyRubric = '';
  const hardDifficultyRubric = '';
  const questionText = 'Question 1: Test Question';
  const correctAnswer = 'Correct';
  const incorrectAnswer = 'Incorrect answer'
  const misconception = {
    feedback: ''
  };
  const hintText = 'Sort by number';
  const acceptedQuestionsPercentage = 30;

  let practiceQuestionSubmitter = null;

  beforeAll(async function() {
    practiceQuestionSubmitter = (
      await userFactory.createPracticeQuestionSubmitter('questionsubmitter'));

    const superAdmin = await userFactory.createNewSuperAdmin('superadmin');
    await superAdmin.assignRoleToUser('superadmin', ROLE_CURRICULUM_ADMIN);
    await superAdmin.assignRoleToUser('superadmin', ROLE_QUESTION_ADMIN);
