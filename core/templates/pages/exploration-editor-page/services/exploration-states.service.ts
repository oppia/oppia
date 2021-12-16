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
 * @fileoverview Data service for keeping track of the exploration's states.
 * Note that this is unlike the other exploration property services, in that it
 * keeps no mementos.
 */

import { Interaction } from 'domain/exploration/InteractionObjectFactory';

require('domain/exploration/StatesObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('filters/string-utility-filters/normalize-whitespace.filter.ts');
require('pages/exploration-editor-page/services/angular-name.service.ts');
require('pages/exploration-editor-page/services/change-list.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-init-state-name.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'solution-validity.service.ts');
require(
  'pages/exploration-player-page/services/answer-classification.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'pages/exploration-editor-page/services/state-editor-refresh.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/validators.service.ts');

import { EventEmitter } from '@angular/core';
import { ConfirmDeleteStateModalComponent } from '../editor-tab/templates/modal-templates/confirm-delete-state-modal.component';

angular.module('oppia').factory('ExplorationStatesService', [
  '$filter', '$injector', '$location', '$q', '$rootScope',
  'AlertsService', 'AngularNameService', 'AnswerClassificationService',
  'ChangeListService', 'ContextService', 'ExplorationInitStateNameService',
  'NgbModal', 'SolutionValidityService', 'StateEditorRefreshService',
  'StateEditorService', 'StatesObjectFactory', 'ValidatorsService',
  function(
      $filter, $injector, $location, $q, $rootScope,
      AlertsService, AngularNameService, AnswerClassificationService,
      ChangeListService, ContextService, ExplorationInitStateNameService,
      NgbModal, SolutionValidityService, StateEditorRefreshService,
      StateEditorService, StatesObjectFactory, ValidatorsService) {
    var _states = null;

    var stateAddedCallbacks = [];
    var stateDeletedCallbacks = [];
    var stateRenamedCallbacks = [];
    var stateInteractionSavedCallbacks = [];
    /** @private */
    var refreshGraphEventEmitter = new EventEmitter();

    // Properties that have a different backend representation from the
    // frontend and must be converted.
    var BACKEND_CONVERSIONS = {
      answer_groups: function(answerGroups) {
        return answerGroups.map(function(answerGroup) {
          return answerGroup.toBackendDict();
        });
      },
      content: function(content) {
        return content.toBackendDict();
      },
      recorded_voiceovers: function(recordedVoiceovers) {
        return recordedVoiceovers.toBackendDict();
      },
      default_outcome: function(defaultOutcome) {
        if (defaultOutcome) {
          return defaultOutcome.toBackendDict();
        } else {
          return null;
        }
      },
      hints: function(hints) {
        return hints.map(function(hint) {
          return hint.toBackendDict();
        });
      },
      param_changes: function(paramChanges) {
        return paramChanges.map(function(paramChange) {
          return paramChange.toBackendDict();
        });
      },
      param_specs: function(paramSpecs) {
        return paramSpecs.toBackendDict();
      },
      solution: function(solution) {
        if (solution) {
          return solution.toBackendDict();
        } else {
          return null;
        }
      },
      written_translations: function(writtenTranslations) {
        return writtenTranslations.toBackendDict();
      },
      widget_customization_args: function(customizationArgs) {
        return Interaction.convertCustomizationArgsToBackendDict(
          customizationArgs);
      }
    };

    // Maps backend names to the corresponding frontend dict accessor lists.
    var PROPERTY_REF_DATA = {
      answer_groups: ['interaction', 'answerGroups'],
      confirmed_unclassified_answers: [
        'interaction', 'confirmedUnclassifiedAnswers'],
      content: ['content'],
      recorded_voiceovers: ['recordedVoiceovers'],
      linked_skill_id: ['linkedSkillId'],
      default_outcome: ['interaction', 'defaultOutcome'],
      param_changes: ['paramChanges'],
      param_specs: ['paramSpecs'],
      hints: ['interaction', 'hints'],
      next_content_id_index: ['nextContentIdIndex'],
      solicit_answer_details: ['solicitAnswerDetails'],
      card_is_checkpoint: ['cardIsCheckpoint'],
      solution: ['interaction', 'solution'],
      widget_id: ['interaction', 'id'],
      widget_customization_args: ['interaction', 'customizationArgs'],
      written_translations: ['writtenTranslations']
    };

    var CONTENT_ID_EXTRACTORS = {
      answer_groups: function(answerGroups) {
        var contentIds = new Set();
        answerGroups.forEach(function(answerGroup) {
          contentIds.add(answerGroup.outcome.feedback.contentId);
          answerGroup.rules.forEach(rule => {
            Object.keys(rule.inputs).forEach(inputName => {
              if (rule.inputTypes[inputName].indexOf('Translatable') === 0) {
                contentIds.add(rule.inputs[inputName].contentId);
              }
            });
          });
        });
        return contentIds;
      },
      default_outcome: function(defaultOutcome) {
        var contentIds = new Set();
        if (defaultOutcome) {
          contentIds.add(defaultOutcome.feedback.contentId);
        }
        return contentIds;
      },
      hints: function(hints) {
        var contentIds = new Set();
        hints.forEach(function(hint) {
          contentIds.add(hint.hintContent.contentId);
        });
        return contentIds;
      },
      solution: function(solution) {
        var contentIds = new Set();
        if (solution) {
          contentIds.add(solution.explanation.contentId);
        }
        return contentIds;
      },
      widget_customization_args: function(customizationArgs) {
        return new Set(
          Interaction.getCustomizationArgContentIds(customizationArgs));
      }
    };

    var _getElementsInFirstSetButNotInSecond = function(setA, setB) {
      var diffList = Array.from(setA).filter(function(element) {
        return !setB.has(element);
      });
      return diffList;
    };

    var _setState = function(stateName, stateData, refreshGraph) {
      _states.setState(stateName, angular.copy(stateData));
      if (refreshGraph) {
        refreshGraphEventEmitter.emit();
      }
    };

    var getStatePropertyMemento = function(stateName, backendName) {
      var accessorList = PROPERTY_REF_DATA[backendName];
      var propertyRef = _states.getState(stateName);
      try {
        accessorList.forEach(function(key) {
          propertyRef = propertyRef[key];
        });
      } catch (e) {
        var additionalInfo = (
          '\nUndefined states error debug logs:' +
          '\nRequested state name: ' + stateName +
          '\nExploration ID: ' + ContextService.getExplorationId() +
          '\nChange list: ' + JSON.stringify(
            ChangeListService.getChangeList()) +
          '\nAll states names: ' + _states.getStateNames());
        $rootScope.$applyAsync();
        e.message += additionalInfo;
        throw e;
      }

      return angular.copy(propertyRef);
    };

    var saveStateProperty = function(stateName, backendName, newValue) {
      var oldValue = getStatePropertyMemento(stateName, backendName);
      var newBackendValue = angular.copy(newValue);
      var oldBackendValue = angular.copy(oldValue);

      if (BACKEND_CONVERSIONS.hasOwnProperty(backendName)) {
        newBackendValue = convertToBackendRepresentation(newValue, backendName);
        oldBackendValue = convertToBackendRepresentation(oldValue, backendName);
      }

      if (!angular.equals(oldValue, newValue)) {
        ChangeListService.editStateProperty(
          stateName, backendName, newBackendValue, oldBackendValue);
        $rootScope.$applyAsync();

        var newStateData = _states.getState(stateName);
        var accessorList = PROPERTY_REF_DATA[backendName];

        if (CONTENT_ID_EXTRACTORS.hasOwnProperty(backendName)) {
          var oldContentIds = CONTENT_ID_EXTRACTORS[backendName](oldValue);
          var newContentIds = CONTENT_ID_EXTRACTORS[backendName](newValue);
          var contentIdsToDelete = _getElementsInFirstSetButNotInSecond(
            oldContentIds, newContentIds);
          var contentIdsToAdd = _getElementsInFirstSetButNotInSecond(
            newContentIds, oldContentIds);
          contentIdsToDelete.forEach(function(contentId) {
            newStateData.recordedVoiceovers.deleteContentId(contentId);
            newStateData.writtenTranslations.deleteContentId(contentId);
          });
          contentIdsToAdd.forEach(function(contentId) {
            newStateData.recordedVoiceovers.addContentId(contentId);
            newStateData.writtenTranslations.addContentId(contentId);
          });
        }
        var propertyRef = newStateData;
        for (var i = 0; i < accessorList.length - 1; i++) {
          propertyRef = propertyRef[accessorList[i]];
        }

        propertyRef[accessorList[accessorList.length - 1]] = angular.copy(
          newValue);

        // We do not refresh the state editor immediately after the interaction
        // id alone is saved, because the customization args dict will be
        // temporarily invalid. A change in interaction id will always entail
        // a change in the customization args dict anyway, so the graph will
        // get refreshed after both properties have been updated.
        var refreshGraph = (backendName !== 'widget_id');
        _setState(stateName, newStateData, refreshGraph);
      }
    };

    var convertToBackendRepresentation = function(frontendValue, backendName) {
      var conversionFunction = BACKEND_CONVERSIONS[backendName];
      return conversionFunction(frontendValue);
    };

    // TODO(sll): Add unit tests for all get/save methods.
    return {
      init: function(statesBackendDict) {
        _states = StatesObjectFactory.createFromBackendDict(statesBackendDict);
        // Initialize the solutionValidityService.
        SolutionValidityService.init(_states.getStateNames());
        _states.getStateNames().forEach(function(stateName) {
          var solution = _states.getState(stateName).interaction.solution;
          if (solution) {
            var result = (
              AnswerClassificationService.getMatchingClassificationResult(
                stateName,
                _states.getState(stateName).interaction,
                solution.correctAnswer,
                $injector.get(
                  AngularNameService.getNameOfInteractionRulesService(
                    _states.getState(stateName).interaction.id))));
            var solutionIsValid = stateName !== result.outcome.dest;
            SolutionValidityService.updateValidity(
              stateName, solutionIsValid);
          }
        });
      },
      getStates: function() {
        return angular.copy(_states);
      },
      getStateNames: function() {
        return _states.getStateNames();
      },
      hasState: function(stateName) {
        return _states.hasState(stateName);
      },
      getState: function(stateName) {
        return angular.copy(_states.getState(stateName));
      },
      setState: function(stateName, stateData) {
        _setState(stateName, stateData, true);
      },
      getCheckpointCount: function() {
        var count: number = 0;
        if (_states) {
          _states.getStateNames().forEach(function(stateName) {
            if (_states.getState(stateName).cardIsCheckpoint) {
              count++;
            }
          });
        }
        return count;
      },
      isNewStateNameValid: function(newStateName, showWarnings) {
        if (_states.hasState(newStateName)) {
          if (showWarnings) {
            AlertsService.addWarning('A state with this name already exists.');
          }
          return false;
        }
        return (
          ValidatorsService.isValidStateName(newStateName, showWarnings));
      },
      getStateContentMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'content');
      },
      saveStateContent: function(stateName, newContent) {
        saveStateProperty(stateName, 'content', newContent);
      },
      getStateParamChangesMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'param_changes');
      },
      saveStateParamChanges: function(stateName, newParamChanges) {
        saveStateProperty(stateName, 'param_changes', newParamChanges);
      },
      getInteractionIdMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'widget_id');
      },
      saveInteractionId: function(stateName, newInteractionId) {
        saveStateProperty(stateName, 'widget_id', newInteractionId);
        stateInteractionSavedCallbacks.forEach(function(callback) {
          callback(_states.getState(stateName));
        });
      },
      saveLinkedSkillId: function(stateName, newLinkedSkillId) {
        saveStateProperty(stateName, 'linked_skill_id', newLinkedSkillId);
      },
      saveNextContentIdIndex: function(stateName, newNextContentIdIndex) {
        saveStateProperty(
          stateName, 'next_content_id_index', newNextContentIdIndex);
      },
      getInteractionCustomizationArgsMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'widget_customization_args');
      },
      saveInteractionCustomizationArgs: function(
          stateName, newCustomizationArgs) {
        saveStateProperty(
          stateName, 'widget_customization_args', newCustomizationArgs);
        stateInteractionSavedCallbacks.forEach(function(callback) {
          callback(_states.getState(stateName));
        });
      },
      getInteractionAnswerGroupsMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'answer_groups');
      },
      saveInteractionAnswerGroups: function(stateName, newAnswerGroups) {
        saveStateProperty(stateName, 'answer_groups', newAnswerGroups);
        stateInteractionSavedCallbacks.forEach(function(callback) {
          callback(_states.getState(stateName));
        });
      },
      getConfirmedUnclassifiedAnswersMemento: function(stateName) {
        return getStatePropertyMemento(
          stateName, 'confirmed_unclassified_answers');
      },
      saveConfirmedUnclassifiedAnswers: function(stateName, newAnswers) {
        saveStateProperty(
          stateName, 'confirmed_unclassified_answers', newAnswers);
        stateInteractionSavedCallbacks.forEach(function(callback) {
          callback(_states.getState(stateName));
        });
      },
      getInteractionDefaultOutcomeMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'default_outcome');
      },
      saveInteractionDefaultOutcome: function(stateName, newDefaultOutcome) {
        saveStateProperty(stateName, 'default_outcome', newDefaultOutcome);
      },
      getHintsMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'hints');
      },
      saveHints: function(stateName, newHints) {
        saveStateProperty(stateName, 'hints', newHints);
      },
      getSolutionMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'solution');
      },
      saveSolution: function(stateName, newSolution) {
        saveStateProperty(stateName, 'solution', newSolution);
      },
      getRecordedVoiceoversMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'recorded_voiceovers');
      },
      saveRecordedVoiceovers: function(stateName, newRecordedVoiceovers) {
        saveStateProperty(
          stateName, 'recorded_voiceovers', newRecordedVoiceovers);
      },
      getSolicitAnswerDetailsMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'solicit_answer_details');
      },
      saveSolicitAnswerDetails: function(stateName, newSolicitAnswerDetails) {
        saveStateProperty(
          stateName, 'solicit_answer_details', newSolicitAnswerDetails);
      },
      getCardIsCheckpointMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'card_is_checkpoint');
      },
      saveCardIsCheckpoint: function(stateName, newCardIsCheckpoint) {
        saveStateProperty(
          stateName, 'card_is_checkpoint', newCardIsCheckpoint);
      },
      getWrittenTranslationsMemento: function(stateName) {
        return _states.getState(stateName).writtenTranslations;
      },
      saveWrittenTranslation: function(
          contentId, dataFormat, languageCode, stateName, translationHtml) {
        ChangeListService.addWrittenTranslation(
          contentId, dataFormat, languageCode, stateName, translationHtml);
        let stateData = _states.getState(stateName);
        if (stateData.writtenTranslations.hasWrittenTranslation(
          contentId, languageCode)) {
          stateData.writtenTranslations.updateWrittenTranslation(
            contentId, languageCode, translationHtml);
        } else {
          stateData.writtenTranslations.addWrittenTranslation(
            contentId, languageCode, dataFormat, translationHtml);
        }
        _states.setState(stateName, angular.copy(stateData));
      },
      markWrittenTranslationAsNeedingUpdate: function(
          contentId, languageCode, stateName) {
        ChangeListService.markTranslationAsNeedingUpdate(
          contentId, languageCode, stateName);
        let stateData = _states.getState(stateName);
        stateData.writtenTranslations.translationsMapping[contentId][
          languageCode].markAsNeedingUpdate();
        _states.setState(stateName, angular.copy(stateData));
      },
      markWrittenTranslationsAsNeedingUpdate: function(contentId, stateName) {
        ChangeListService.markTranslationsAsNeedingUpdate(contentId, stateName);
        let stateData = _states.getState(stateName);
        const translationMapping = (
          stateData.writtenTranslations.translationsMapping[contentId]);
        for (const languageCode in translationMapping) {
          stateData.writtenTranslations.translationsMapping[contentId][
            languageCode].markAsNeedingUpdate();
        }
        _states.setState(stateName, angular.copy(stateData));
      },
      isInitialized: function() {
        return _states !== null;
      },
      addState: function(newStateName, successCallback) {
        newStateName = $filter('normalizeWhitespace')(newStateName);
        if (!ValidatorsService.isValidStateName(newStateName, true)) {
          return;
        }
        if (_states.hasState(newStateName)) {
          AlertsService.addWarning('A state with this name already exists.');
          return;
        }
        AlertsService.clearWarnings();

        _states.addState(newStateName);

        ChangeListService.addState(newStateName);
        $rootScope.$applyAsync();
        stateAddedCallbacks.forEach(function(callback) {
          callback(newStateName);
        });
        refreshGraphEventEmitter.emit();
        if (successCallback) {
          successCallback(newStateName);
        }
      },
      deleteState: function(deleteStateName) {
        AlertsService.clearWarnings();

        var initStateName = ExplorationInitStateNameService.displayed;
        if (deleteStateName === initStateName) {
          return $q.reject('The initial state can not be deleted.');
        }
        if (!_states.hasState(deleteStateName)) {
          var message = 'No state with name ' + deleteStateName + ' exists.';
          AlertsService.addWarning(message);
          return $q.reject(message);
        }

        const modelRef = NgbModal.open(ConfirmDeleteStateModalComponent, {
          backdrop: true,
        });
        modelRef.componentInstance.deleteStateName = deleteStateName;
        return modelRef.result.then(function() {
          _states.deleteState(deleteStateName);

          ChangeListService.deleteState(deleteStateName);
          $rootScope.$applyAsync();

          if (StateEditorService.getActiveStateName() === deleteStateName) {
            StateEditorService.setActiveStateName(
              ExplorationInitStateNameService.savedMemento);
          }

          stateDeletedCallbacks.forEach(function(callback) {
            callback(deleteStateName);
          });
          $location.path('/gui/' + StateEditorService.getActiveStateName());
          refreshGraphEventEmitter.emit();
          // This ensures that if the deletion changes rules in the current
          // state, they get updated in the view.
          StateEditorRefreshService.onRefreshStateEditor.emit();
        }, function() {
          AlertsService.clearWarnings();
        });
      },
      renameState: function(oldStateName, newStateName) {
        newStateName = $filter('normalizeWhitespace')(newStateName);
        if (!ValidatorsService.isValidStateName(newStateName, true)) {
          return;
        }
        if (_states.hasState(newStateName)) {
          AlertsService.addWarning('A state with this name already exists.');
          return;
        }
        AlertsService.clearWarnings();

        _states.renameState(oldStateName, newStateName);

        StateEditorService.setActiveStateName(newStateName);
        StateEditorService.setStateNames(_states.getStateNames());
        // The 'rename state' command must come before the 'change
        // init_state_name' command in the change list, otherwise the backend
        // will raise an error because the new initial state name does not
        // exist.
        ChangeListService.renameState(newStateName, oldStateName);
        $rootScope.$applyAsync();
        SolutionValidityService.onRenameState(newStateName, oldStateName);
        // Amend initStateName appropriately, if necessary. Note that this
        // must come after the state renaming, otherwise saving will lead to
        // a complaint that the new name is not a valid state name.
        if (ExplorationInitStateNameService.displayed === oldStateName) {
          ExplorationInitStateNameService.displayed = newStateName;
          ExplorationInitStateNameService.saveDisplayedValue(newStateName);
        }
        stateRenamedCallbacks.forEach(function(callback) {
          callback(oldStateName, newStateName);
        });
        refreshGraphEventEmitter.emit();
      },
      registerOnStateAddedCallback: function(callback) {
        stateAddedCallbacks.push(callback);
      },
      registerOnStateDeletedCallback: function(callback) {
        stateDeletedCallbacks.push(callback);
      },
      registerOnStateRenamedCallback: function(callback) {
        stateRenamedCallbacks.push(callback);
      },
      registerOnStateInteractionSavedCallback: function(callback) {
        stateInteractionSavedCallbacks.push(callback);
      },
      get onRefreshGraph() {
        return refreshGraphEventEmitter;
      }
    };
  }
]);
