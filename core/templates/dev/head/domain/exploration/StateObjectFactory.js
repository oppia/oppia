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

oppia.factory('StateObjectFactory', [
  'AnswerGroupObjectFactory', 'InteractionObjectFactory',
  'SubtitledHtmlObjectFactory', 'ParamChangesObjectFactory',
  function(AnswerGroupObjectFactory, InteractionObjectFactory,
      SubtitledHtmlObjectFactory, ParamChangesObjectFactory) {
    var State = function(name, classifierModelId, content, interaction,
        paramChanges) {
      this.name = name;
      this.classifierModelId = classifierModelId;
      this.content = content;
      this.interaction = interaction;
      this.paramChanges = paramChanges;
    };

    // Instance methods.
    State.prototype.toBackendDict = function() {
      return {
        content: this.content.toBackendDict(),
        classifier_model_id: this.classifierModelId,
        interaction: this.interaction.toBackendDict(),
        param_changes: this.paramChanges.map(function(paramChange) {
          return paramChange.toBackendDict();
        })
      };
    };

    // Static class methods. Note that "this" is not available in
    // static contexts.
    State.createFromBackendDict = function(stateName, stateDict) {
      return new State(
        stateName,
        stateDict.classifier_model_id,
        SubtitledHtmlObjectFactory.createFromBackendDict(stateDict.content),
        InteractionObjectFactory.createFromBackendDict(stateDict.interaction),
        ParamChangesObjectFactory.createFromBackendList(
          stateDict.param_changes));
    };

    State.createSampleBackendDict = function(stateName) {
      return {
        classifier_model_id: 0,
        SubtitledHtmlObjectFactory.createSampleBackendDict(),
        InteractionObjectFactory.createSampleBackendDict(),
        ParamChangesObjectFactory.createSampleBackendList()
      };
    };

    return State;
  }
]);
