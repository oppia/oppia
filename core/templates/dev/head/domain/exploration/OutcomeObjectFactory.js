// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of Outcome
 * domain objects.
 */

oppia.factory('OutcomeObjectFactory', [
  'SubtitledHtmlObjectFactory',
  function(SubtitledHtmlObjectFactory) {
    var Outcome = function(
        dest, feedback, labelledAsCorrect, paramChanges,
        refresherExplorationId, missingPrerequisiteSkillId) {
      this.dest = dest;
      this.feedback = feedback;
      this.labelledAsCorrect = labelledAsCorrect;
      this.paramChanges = paramChanges;
      this.refresherExplorationId = refresherExplorationId;
      this.missingPrerequisiteSkillId = missingPrerequisiteSkillId;
    };

    Outcome.prototype.setDestination = function(newValue) {
      this.dest = newValue;
    };

    Outcome.prototype.toBackendDict = function() {
      return {
        dest: this.dest,
        feedback: this.feedback.toBackendDict(),
        labelled_as_correct: this.labelledAsCorrect,
        param_changes: this.paramChanges,
        refresher_exploration_id: this.refresherExplorationId,
        missing_prerequisite_skill_id: this.missingPrerequisiteSkillId
      };
    };
    /**
     * Returns true iff an outcome has a self-loop, no feedback, and no
     * refresher exploration.
     */
    Outcome.prototype.isConfusing = function(currentStateName) {
      return (
        this.dest === currentStateName &&
        !this.hasNonemptyFeedback() &&
        this.refresherExplorationId === null
      );
    };

    Outcome.prototype.hasNonemptyFeedback = function() {
      return this.feedback.getHtml().trim() !== '';
    };

    Outcome.createNew = function(dest, feedbackTextId, feedbackText,
        paramChanges) {
      return new Outcome(
        dest,
        SubtitledHtmlObjectFactory.createDefault(feedbackText, feedbackTextId),
        false,
        paramChanges,
        null,
        null);
    };

    Outcome.createFromBackendDict = function(outcomeDict) {
      return new Outcome(
        outcomeDict.dest,
        SubtitledHtmlObjectFactory.createFromBackendDict(outcomeDict.feedback),
        outcomeDict.labelled_as_correct,
        outcomeDict.param_changes,
        outcomeDict.refresher_exploration_id,
        outcomeDict.missing_prerequisite_skill_id);
    };

    return Outcome;
  }
]);
