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
 * @fileoverview Factory for creating new frontend instances of Exploration
 * domain objects.
 */

oppia.factory('ExplorationObjectFactory', [
  'INTERACTION_SPECS', 'INTERACTION_DISPLAY_MODE_INLINE', 'StateObjectFactory',
  'StatesObjectFactory', 'ParamChangesObjectFactory',
  'UrlInterpolationService',
  function(
      INTERACTION_SPECS, INTERACTION_DISPLAY_MODE_INLINE, StateObjectFactory,
      StatesObjectFactory, ParamChangesObjectFactory,
      UrlInterpolationService) {
    var Exploration = function(
        initStateName, paramChanges, paramSpecs, skinCustomizations,
        states, title, languageCode) {
      this.initStateName = initStateName;
      this.paramChanges = paramChanges;
      this.paramSpecs = paramSpecs;
      this.skinCustomizations = skinCustomizations;
      this.states = states;
      this.title = title;
      this.languageCode = languageCode;
    };

    // Instance methods
    Exploration.prototype.isStateTerminal = function(stateName) {
      return (
        stateName && this.getInteractionId(stateName) &&
        INTERACTION_SPECS[this.getInteractionId(stateName)].is_terminal);
    };

    Exploration.prototype.getAuthorRecommendedExpIds = function(stateName) {
      if (!this.isStateTerminal(stateName)) {
        throw Error(
          'Tried to get recommendations for a non-terminal state: ' +
          stateName);
      }

      return this.getInteractionCustomizationArgs(
        stateName).recommendedExplorationIds.value;
    };

    Exploration.prototype.getInteraction = function(stateName) {
      return this.states.getState(stateName).interaction;
    };

    Exploration.prototype.getInteractionId = function(stateName) {
      return this.states.getState(stateName).interaction.id;
    };

    Exploration.prototype.getInteractionCustomizationArgs =
      function(stateName) {
        return this.states.getState(stateName).interaction.customizationArgs;
      };

    Exploration.prototype.getInteractionInstructions = function(stateName) {
      var interactionId = this.getInteractionId(stateName);
      return interactionId ? INTERACTION_SPECS[interactionId].instructions : '';
    };

    Exploration.prototype.getNarrowInstructions = function(stateName) {
      var interactionId = this.getInteractionId(stateName);
      return (
        interactionId ?
        INTERACTION_SPECS[interactionId].narrow_instructions :
        '');
    };

    Exploration.prototype.getInteractionThumbnailSrc = function(stateName) {
      // TODO(sll): unify this with the 'choose interaction' modal in
      // state_editor_interaction.html.
      var interactionId = this.getInteractionId(stateName);
      return interactionId ? (
        UrlInterpolationService
          .getInteractionThumbnailImageUrl(interactionId)) : '';
    };

    Exploration.prototype.isInteractionInline = function(stateName) {
      var interactionId = this.getInteractionId(stateName);

      // Note that we treat a null interaction as an inline one, so that the
      // error message associated with it is displayed in the most compact way
      // possible in the learner view.
      return (
        !interactionId ||
        INTERACTION_SPECS[interactionId].display_mode ===
          INTERACTION_DISPLAY_MODE_INLINE);
    };

    Exploration.prototype.getGadgetPanelsContents = function() {
      return this.skinCustomizations.panels_contents;
    };

    Exploration.prototype.getState = function(stateName) {
      return this.states.getState(stateName);
    };

    Exploration.prototype.getInitialState = function() {
      return this.getState(this.initStateName);
    };

    Exploration.prototype.setInitialStateName = function(stateName) {
      this.initStateName = stateName;
    };

    Exploration.prototype.getUninterpolatedContentHtml = function(stateName) {
      return this.getState(stateName).content[0].value;
    };

    // Static class methods. Note that "this" is not available in
    // static contexts.
    Exploration.createFromBackendDict = function(explorationBackendDict) {
      return new Exploration(
        explorationBackendDict.init_state_name,
        ParamChangesObjectFactory.createFromBackendList(
          explorationBackendDict.param_changes),
        explorationBackendDict.param_specs,
        explorationBackendDict.skin_customizations,
        StatesObjectFactory.createFromBackendDict(
          explorationBackendDict.states),
        explorationBackendDict.title,
        explorationBackendDict.language_code);
    };

    return Exploration;
  }
]);
