// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to validate the consistency of a topic. These
 * checks are performable in the frontend to avoid sending a potentially invalid
 * topic to the backend, which performs similar validation checks to these
 * in topic_domain.Topic and subsequent domain objects.
 */

oppia.factory('TopicValidationService', [
  function() {
    var _validateSubtopic = function(subtopic) {
      var issues = [];
      if (subtopic.getTitle() === '') {
        issues.push('Subtopic title should not be empty');
      }
      var skillIds = subtopic.getSkillSummaries().map(function(skillSummary) {
        return skillSummary.getId();
      });
      for (var i = 0; i < skillIds.length; i++) {
        var skillId = skillIds[i];
        if (skillIds.indexOf(skillId) < skillIds.lastIndexOf(skillId)) {
          issues.push(
            'The skill with id ' + skillId + ' is duplicated in' +
            ' subtopic with id ' + subtopic.getId());
        }
      }
      return issues;
    };

    var _validateTopic = function(topic) {
      var issues = [];
      if (topic.getName() === '') {
        issues.push('Topic name should not be empty.');
      }

      var subtopics = topic.getSubtopics();
      var canonicalStoryIds = topic.getCanonicalStoryIds();
      var additionalStoryIds = topic.getAdditionalStoryIds();

      for (var i = 0; i < canonicalStoryIds.length; i++) {
        var storyId = canonicalStoryIds[i];
        if (canonicalStoryIds.indexOf(storyId) <
          canonicalStoryIds.lastIndexOf(storyId)) {
          issues.push(
            'The canonical story with id ' + storyId + ' is duplicated in' +
            ' the topic.');
        }
      }
      for (var i = 0; i < additionalStoryIds.length; i++) {
        var storyId = additionalStoryIds[i];
        if (additionalStoryIds.indexOf(storyId) <
          additionalStoryIds.lastIndexOf(storyId)) {
          issues.push(
            'The additional story with id ' + storyId + ' is duplicated in' +
            ' the topic.');
        }
      }
      for (var i = 0; i < canonicalStoryIds.length; i++) {
        if (additionalStoryIds.indexOf(canonicalStoryIds[i]) !== -1) {
          issues.push(
            'The story with id ' + canonicalStoryIds[i] +
            ' is present in both canonical and additional stories.');
        }
      }
      var topicSkillIds =
        topic.getUncategorizedSkillSummaries().map(function(skillSummary) {
          return skillSummary.getId();
        });
      for (var i = 0; i < subtopics.length; i++) {
        issues = issues.concat(
          _validateSubtopic(subtopics[i]));
        var skillIds = subtopics[i].getSkillSummaries().map(
          function(skillSummary) {
            return skillSummary.getId();
          }
        );
        for (var j = 0; j < skillIds.length; j++) {
          if (topicSkillIds.indexOf(skillIds[j]) === -1) {
            topicSkillIds.push(skillIds[j]);
          } else {
            issues.push(
              'The skill with id ' + skillIds[j] +
              ' is duplicated in the topic');
          }
        }
      }
      return issues;
    };

    return {
      /**
       * Returns a list of error strings found when validating the provided
       * topic. The validation methods used in this function are written to
       * match the validations performed in the backend.
       */
      findValidationIssuesForTopic: function(topic) {
        return _validateTopic(topic);
      }
    };
  }]);
