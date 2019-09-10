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
 * @fileoverview Factory for creating instances of frontend
 * topic summary domain objects.
 */

angular.module('oppia').factory('TopicSummaryObjectFactory', [function() {
  var TopicSummary = function(
      id, name, canonicalStoryCount, subtopicCount, totalSkillCount,
      uncategorizedSkillCount) {
    this._id = id;
    this._name = name;
    this._canonicalStoryCount = canonicalStoryCount;
    this._totalSkillCount = totalSkillCount;
    this._uncategorizedSkillCount = uncategorizedSkillCount;
    this._subtopicCount = subtopicCount;
  };

  // Instance methods

  TopicSummary.prototype.getId = function() {
    return this._id;
  };

  TopicSummary.prototype.getName = function() {
    return this._name;
  };

  TopicSummary.prototype.getCanonicalStoryCount = function() {
    return this._canonicalStoryCount;
  };

  TopicSummary.prototype.getSubtopicCount = function() {
    return this._subtopicCount;
  };

  TopicSummary.prototype.getTotalSkillCount = function() {
    return this._totalSkillCount;
  };

  TopicSummary.prototype.getUncategorizedSkillCount = function() {
    return this._uncategorizedSkillCount;
  };


  // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  TopicSummary['createFromBackendDict'] = function(topicSummaryBackendDict) {
  /* eslint-enable dot-notation */
    return new TopicSummary(
      topicSummaryBackendDict.id,
      topicSummaryBackendDict.name,
      topicSummaryBackendDict.canonical_story_count,
      topicSummaryBackendDict.subtopic_count,
      topicSummaryBackendDict.total_skill_count,
      topicSummaryBackendDict.uncategorized_skill_count
    );
  };

  return TopicSummary;
}]);
