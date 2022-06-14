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
 * @fileoverview Service to handle the updating of a question.
 */

import { Change } from
  'domain/editor/undo_redo/change.model';
import { Interaction } from 'domain/exploration/InteractionObjectFactory';

require('domain/editor/undo_redo/question-undo-redo.service.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/question/QuestionObjectFactory.ts');

require('domain/question/question-domain.constants.ajs.ts');

angular.module('oppia').factory('QuestionUpdateService', [
  'QuestionUndoRedoService',
  'CMD_UPDATE_QUESTION_PROPERTY',
  'QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS',
  'QUESTION_PROPERTY_LANGUAGE_CODE', 'QUESTION_PROPERTY_NEXT_CONTENT_ID_INDEX',
  'QUESTION_PROPERTY_QUESTION_STATE_DATA',
  function(
      QuestionUndoRedoService,
      CMD_UPDATE_QUESTION_PROPERTY,
      QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS,
      QUESTION_PROPERTY_LANGUAGE_CODE, QUESTION_PROPERTY_NEXT_CONTENT_ID_INDEX,
      QUESTION_PROPERTY_QUESTION_STATE_DATA) {
    var _applyChange = function(question, command, params, apply, reverse) {
      var changeDict = angular.copy(params);
      changeDict.cmd = command;
      var changeObj = new Change(changeDict, apply, reverse);
      QuestionUndoRedoService.applyChange(changeObj, question);
    };

    var _applyPropertyChange = function(
        question, propertyName, newValue, oldValue, apply, reverse) {
      _applyChange(question, CMD_UPDATE_QUESTION_PROPERTY, {
        property_name: propertyName,
        new_value: angular.copy(newValue),
        old_value: angular.copy(oldValue),
      }, apply, reverse);
    };

    var _getParameterFromChangeDict = function(changeDict, paramName) {
      return changeDict[paramName];
    };

    var _getNewPropertyValueFromChangeDict = function(changeDict) {
      return _getParameterFromChangeDict(changeDict, 'new_value');
    };

    var _getElementsInFirstSetButNotInSecond = function(setA, setB) {
      var diffList = Array.from(setA).filter(function(element) {
        return !setB.has(element);
      });
      return diffList;
    };

    var _updateContentIdsInAssets = function(newState, oldState) {
      var newContentIds = new Set(newState.getAllContentIds());
      var oldContentIds = new Set(oldState.getAllContentIds());
      var contentIdsToDelete = _getElementsInFirstSetButNotInSecond(
        oldContentIds, newContentIds);
      var contentIdsToAdd = _getElementsInFirstSetButNotInSecond(
        newContentIds, oldContentIds);
      contentIdsToDelete.forEach(function(contentId) {
        newState.recordedVoiceovers.deleteContentId(contentId);
      });
      contentIdsToAdd.forEach(function(contentId) {
        newState.recordedVoiceovers.addContentId(contentId);
      });
    };

    return {
      setQuestionLanguageCode: function(question, newLanguageCode) {
        var oldLanguageCode = angular.copy(question.getLanguageCode());
        _applyPropertyChange(
          question, QUESTION_PROPERTY_LANGUAGE_CODE,
          newLanguageCode, oldLanguageCode,
          function(changeDict, question) {
            var languageCode = _getNewPropertyValueFromChangeDict(changeDict);
            question.setLanguageCode(languageCode);
          }, function(changeDict, question) {
            question.setLanguageCode(oldLanguageCode);
          });
      },
      setQuestionInapplicableSkillMisconceptionIds: function(
          question, newInapplicableSkillMisconceptionIds) {
        var oldInapplicableSkillMisconceptionIds = angular.copy(
          question.getInapplicableSkillMisconceptionIds());
        _applyPropertyChange(
          question, QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS,
          newInapplicableSkillMisconceptionIds,
          oldInapplicableSkillMisconceptionIds,
          function(changeDict, question) {
            var languageCode = _getNewPropertyValueFromChangeDict(changeDict);
            question.setInapplicableSkillMisconceptionIds(languageCode);
          }, function(changeDict, question) {
            question.setInapplicableSkillMisconceptionIds(
              oldInapplicableSkillMisconceptionIds);
          });
      },
      setQuestionNextContentIdIndex: function(question, newValue) {
      var oldValue = question.getNextContentIdIndex();
      _applyPropertyChange(
        question, QUESTION_PROPERTY_NEXT_CONTENT_ID_INDEX,
        newValue, oldValue,
        function(changeDict, question) {
          var newValue = _getNewPropertyValueFromChangeDict(changeDict);
          question.setNextContentIdIndex(newValue);
        }, function(changeDict, question) {
          question.setNextContentIdIndex(changeDict['old_value']);
        });
    },
      setQuestionStateData: function(question, updateFunction) {
        var oldStateData = angular.copy(question.getStateData());
        // We update the question here before making the change,
        // so that we can obtain the new state to save to the backend via
        // the change list.
        //
        // We diverge slightly from the other models of update services because
        // a separate service (StateEditorService) is being used to update
        // the question, and we can't retrieve the new state data without
        // simultaneously updating it.
        //
        // The updating of the question in the client can't be deferred to
        // when the change in the change list is applied, because we would
        // have to defer the extraction of the new state data, which we need
        // for creating the change to send to the backend.
        updateFunction();
        var newStateData = question.getStateData();
        _updateContentIdsInAssets(newStateData, oldStateData);
        _applyPropertyChange(
          question, QUESTION_PROPERTY_QUESTION_STATE_DATA,
          newStateData.toBackendDict(),
          oldStateData.toBackendDict(),
          function(changeDict, question) {
            // Unused (see comment above).
          }, function(changeDict, question) {
            question.setStateData(oldStateData);
          });
      }
    };
  }
]);
