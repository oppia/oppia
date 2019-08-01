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
 * @fileoverview Factory for creating new frontend instances of State
 * domain objects.
 */

require('domain/exploration/RecordedVoiceoversObjectFactory.ts');
require('domain/exploration/InteractionObjectFactory.ts');
require('domain/exploration/ParamChangesObjectFactory.ts');
require('domain/exploration/SubtitledHtmlObjectFactory.ts');
require('domain/exploration/WrittenTranslationsObjectFactory.ts');

angular.module('oppia').factory('StateObjectFactory', [
  'InteractionObjectFactory', 'ParamChangesObjectFactory',
  'RecordedVoiceoversObjectFactory', 'SubtitledHtmlObjectFactory',
  'WrittenTranslationsObjectFactory', function(
      InteractionObjectFactory, ParamChangesObjectFactory,
      RecordedVoiceoversObjectFactory, SubtitledHtmlObjectFactory,
      WrittenTranslationsObjectFactory) {
    var State = function(name, classifierModelId, content, interaction,
        paramChanges, recordedVoiceovers, solicitAnswerDetails,
        writtenTranslations) {
      this.name = name;
      this.classifierModelId = classifierModelId;
      this.content = content;
      this.interaction = interaction;
      this.paramChanges = paramChanges;
      this.recordedVoiceovers = recordedVoiceovers;
      this.solicitAnswerDetails = solicitAnswerDetails;
      this.writtenTranslations = writtenTranslations;
    };

    State.prototype.setName = function(newName) {
      this.name = newName;
    };

    // Instance methods.
    State.prototype.toBackendDict = function() {
      return {
        content: this.content.toBackendDict(),
        classifier_model_id: this.classifierModelId,
        interaction: this.interaction.toBackendDict(),
        param_changes: this.paramChanges.map(function(paramChange) {
          return paramChange.toBackendDict();
        }),
        recorded_voiceovers: this.recordedVoiceovers.toBackendDict(),
        solicit_answer_details: this.solicitAnswerDetails,
        written_translations: this.writtenTranslations.toBackendDict()
      };
    };

    State.prototype.copy = function(otherState) {
      this.name = otherState.name;
      this.classifierModelId = otherState.classifierModelId;
      this.content = angular.copy(otherState.content);
      this.interaction.copy(otherState.interaction);
      this.paramChanges = angular.copy(otherState.paramChanges);
      this.recordedVoiceovers = angular.copy(otherState.recordedVoiceovers);
      this.solicitAnswerDetails = angular.copy(otherState.solicitAnswerDetails);
      this.writtenTranslations = angular.copy(otherState.writtenTranslations);
    };

    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    State['createDefaultState'] = function(newStateName) {
    /* eslint-enable dot-notation */
      var newStateTemplate = angular.copy(constants.NEW_STATE_TEMPLATE);
      var newState = this.createFromBackendDict(newStateName, {
        classifier_model_id: newStateTemplate.classifier_model_id,
        content: newStateTemplate.content,
        interaction: newStateTemplate.interaction,
        param_changes: newStateTemplate.param_changes,
        recorded_voiceovers: newStateTemplate.recorded_voiceovers,
        solicit_answer_details: newStateTemplate.solicit_answer_details,
        written_translations: newStateTemplate.written_translations
      });
      newState.interaction.defaultOutcome.dest = newStateName;
      return newState;
    };

    // Static class methods. Note that "this" is not available in
    // static contexts.
    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    State['createFromBackendDict'] = function(stateName, stateDict) {
    /* eslint-enable dot-notation */
      return new State(
        stateName,
        stateDict.classifier_model_id,
        SubtitledHtmlObjectFactory.createFromBackendDict(stateDict.content),
        InteractionObjectFactory.createFromBackendDict(stateDict.interaction),
        ParamChangesObjectFactory.createFromBackendList(
          stateDict.param_changes),
        RecordedVoiceoversObjectFactory.createFromBackendDict(
          stateDict.recorded_voiceovers),
        stateDict.solicit_answer_details,
        WrittenTranslationsObjectFactory.createFromBackendDict(
          stateDict.written_translations));
    };

    return State;
  }
]);
