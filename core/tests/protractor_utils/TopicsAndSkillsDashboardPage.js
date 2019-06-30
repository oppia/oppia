// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the topics and skills dashboard page, for use
 * in Protractor tests.
 */

var forms = require('./forms.js');
var waitFor = require('./waitFor.js');

var TopicsAndSkillsDashboardPage = function() {
  var DASHBOARD_URL = '/topics_and_skills_dashboard';
  var topicNames = element.all(by.css('.protractor-test-topic-name'));
  var skillDescriptions = element.all(
    by.css('.protractor-test-skill-description'));
  var createTopicButton = element(
    by.css('.protractor-test-create-topic-button'));
  var deleteTopicButtons = element.all(
    by.css('.protractor-test-delete-topic-button'));
  var createSkillButton = element(
    by.css('.protractor-test-create-skill-button'));
  var deleteSkillButtons = element.all(
    by.css('.protractor-test-delete-skill-button'));
  var topicsListItems = element.all(
    by.css('.protractor-test-topics-list-item'));
  var skillsListItems = element.all(
    by.css('.protractor-test-skills-list-item'));
  var topicNameField = element(by.css('.protractor-test-new-topic-name-field'));
  var skillNameField = element(
    by.css('.protractor-test-new-skill-description-field')
  );
  var confirmTopicCreationButton = element(
    by.css('.protractor-test-confirm-topic-creation-button')
  );
  var confirmTopicDeletionButton = element(
    by.css('.protractor-test-confirm-topic-deletion-button')
  );
  var confirmSkillCreationButton = element(
    by.css('.protractor-test-confirm-skill-creation-button')
  );
  var confirmSkillDeletionButton = element(
    by.css('.protractor-test-confirm-skill-deletion-button')
  );
  var unpublishedSkillsTabButton = element(
    by.css('.protractor-test-unpublished-skills-tab')
  );
  var unusedSkillsTabButton = element(
    by.css('.protractor-test-unused-skills-tab')
  );
  var assignSkillToTopicButtons = element.all(
    by.css('.protractor-test-assign-skill-to-topic-button'));
  var confirmMoveButton = element(
    by.css('.protractor-test-confirm-move-button'));
  var mergeSkillsButtons = element.all(
    by.css('.protractor-test-merge-skills-button'));
  var confirmSkillsMergeButton = element(
    by.css('.protractor-test-confirm-skills-merge-button'));

  this.get = function() {
    browser.get(DASHBOARD_URL);
    waitFor.pageToFullyLoad();
  };

  this.mergeSkillWithIndexToSkillWithIndex = (
    function(oldSkillIndex, newSkillIndex) {
      mergeSkillsButtons.then(function(elems) {
        elems[oldSkillIndex].click();
        skillsListItems.then(function(skills) {
          skills[newSkillIndex].click();
          confirmSkillsMergeButton.click();
        });
      });
    });

  this.navigateToTopicWithIndex = function(index) {
    topicsListItems.then(function(elems) {
      elems[index].click();
    });
  };

  this.assignSkillWithIndexToTopic = function(index, topicIndex) {
    assignSkillToTopicButtons.then(function(elems) {
      elems[index].click();
      topicsListItems.then(function(topics) {
        topics[index].click();
        confirmMoveButton.click();
      });
    });
  };

  this.createTopicWithTitle = function(title) {
    waitFor.elementToBeClickable(
      createTopicButton,
      'Create Topic button takes too long to be clickable');
    createTopicButton.click();

    topicNameField.sendKeys(title);
    confirmTopicCreationButton.click();
    waitFor.pageToFullyLoad();
  };

  this.deleteTopicWithIndex = function(index) {
    deleteTopicButtons.then(function(elems) {
      waitFor.elementToBeClickable(
        elems[0],
        'Delete Topic button takes too long to be clickable');
      elems[0].click();

      waitFor.elementToBeClickable(
        confirmTopicDeletionButton,
        'Confirm Delete Topic button takes too long to be clickable');
      confirmTopicDeletionButton.click();
    });

    waitFor.pageToFullyLoad();
  };

  this.deleteSkillWithIndex = function(index) {
    deleteSkillButtons.then(function(elems) {
      waitFor.elementToBeClickable(
        elems[0],
        'Delete skill button takes too long to be clickable');
      elems[0].click();

      waitFor.elementToBeClickable(
        confirmSkillDeletionButton,
        'Confirm Delete Skill button takes too long to be clickable');
      confirmSkillDeletionButton.click();
    });

    waitFor.pageToFullyLoad();
  };

  this.createSkillWithDescription = function(description) {
    waitFor.elementToBeClickable(
      createSkillButton,
      'Create Skill button takes too long to be clickable');
    createSkillButton.click();

    skillNameField.sendKeys(description);
    confirmSkillCreationButton.click();
    waitFor.pageToFullyLoad();
  };

  this.navigateToUnpublishedSkillsTab = function() {
    unpublishedSkillsTabButton.click();
  };

  this.navigateToUnusedSkillsTab = function() {
    unusedSkillsTabButton.click();
  };

  this.expectNumberOfTopicsToBe = function(number) {
    topicsListItems.then(function(elems) {
      expect(elems.length).toBe(number);
    });
  };

  this.expectTopicNameToBe = function(topicName, index) {
    topicNames.then(function(elems) {
      expect(elems[index].getText()).toEqual(topicName);
    });
  };


  this.expectSkillDescriptionToBe = function(description, index) {
    skillDescriptions.then(function(elems) {
      expect(elems[index].getText()).toEqual(description);
    });
  };

  this.expectNumberOfSkillsToBe = function(number) {
    skillsListItems.then(function(elems) {
      expect(elems.length).toBe(number);
    });
  };
};

exports.TopicsAndSkillsDashboardPage = TopicsAndSkillsDashboardPage;
