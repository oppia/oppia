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
  '$log', 'ParamChangesObjectFactory', 'ParamSpecsObjectFactory',
  'StatesObjectFactory', 'UrlInterpolationService',
  'INTERACTION_DISPLAY_MODE_INLINE',
  'INTERACTION_SPECS', function(
      $log, ParamChangesObjectFactory, ParamSpecsObjectFactory,
      StatesObjectFactory, UrlInterpolationService,
      INTERACTION_DISPLAY_MODE_INLINE,
      INTERACTION_SPECS) {
    var Exploration = function(
        initStateName, paramChanges, paramSpecs, states, title, languageCode) {
      this.initStateName = initStateName;
      this.paramChanges = paramChanges;
      this.paramSpecs = paramSpecs;
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
      var state = this.states.getState(stateName);
      if (!state) {
        $log.error('Invalid state name: ' + stateName);
        return null;
      }
      return state.interaction;
    };

    Exploration.prototype.getInteractionId = function(stateName) {
      var interaction = this.getInteraction(stateName);
      if (interaction === null) {
        return null;
      }
      return interaction.id;
    };

    Exploration.prototype.getInteractionCustomizationArgs =
      function(stateName) {
        var interaction = this.getInteraction(stateName);
        if (interaction === null) {
          return null;
        }
        return interaction.customizationArgs;
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

    Exploration.prototype.getStates = function() {
      return angular.copy(this.states);
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
      return this.getState(stateName).content.getHtml();
    };

    Exploration.prototype.getAudioTranslations = function(stateName) {
      var state = this.getState(stateName);
      var contentIdsToAudioTranslations = state.contentIdsToAudioTranslations;
      var contentId = state.content.getContentId();
      return contentIdsToAudioTranslations.getBindableAudioTranslations(
        contentId);
    };

    Exploration.prototype.getAudioTranslation = function(
        stateName, languageCode) {
      var state = this.getState(stateName);
      var contentIdsToAudioTranslations = state.contentIdsToAudioTranslations;
      var contentId = state.content.getContentId();
      return contentIdsToAudioTranslations.getAudioTranslation(
        contentId, languageCode);
    };

    Exploration.prototype.getAllAudioTranslations = function(languageCode) {
      return this.states.getAllAudioTranslations(languageCode);
    };

    Exploration.prototype.getLanguageCode = function() {
      return this.languageCode;
    };

    Exploration.prototype.getAllAudioLanguageCodes = function() {
      return this.states.getAllAudioLanguageCodes();
    };

    // Static class methods. Note that "this" is not available in
    // static contexts.
    Exploration.createFromBackendDict = function(explorationBackendDict) {
      return new Exploration(
        explorationBackendDict.init_state_name,
        ParamChangesObjectFactory.createFromBackendList(
          explorationBackendDict.param_changes),
        ParamSpecsObjectFactory.createFromBackendDict(
          explorationBackendDict.param_specs),
        StatesObjectFactory.createFromBackendDict(
          explorationBackendDict.states),
        explorationBackendDict.title,
        explorationBackendDict.language_code);
    };

    return Exploration;
  }
]);
