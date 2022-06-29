// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the skill editor page, for use
 * in WebdriverIO tests.
 */

var action = require('./action.js');
var waitFor = require('./waitFor.js');

var SkillEditorPage = function() {
  var EDITOR_URL_PREFIX = '/skill_editor/';

  this.get = async function(skillId) {
    await browser.get(EDITOR_URL_PREFIX + skillId);
    await waitFor.pageToFullyLoad();
  };

  this.addRubricExplanationForDifficulty = async function(
      difficulty, explanation) {
    await this.selectDifficultyForRubric(difficulty);
    var addRubricExplanationButton = $(
      '.e2e-test-add-explanation-button-' + difficulty);
    await action.click(
      'Add rubric explanation button',
      addRubricExplanationButton);
    await action.keys(
      'Rubric explanation editor input',
      rubricExplanationEditorInput, explanation, true);
    await action.click(
      'Save rubric explanation button',
      saveRubricExplanationButton);
    await waitFor.invisibilityOf(
      saveRubricExplanationButton,
      'Save Rubric Explanation editor takes too long to close.');
  };
};

exports.SkillEditorPage = SkillEditorPage;
