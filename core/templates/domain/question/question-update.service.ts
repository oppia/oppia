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

import { BackendChangeObject, Change, DomainObject } from
  'domain/editor/undo_redo/change.model';
import { Interaction } from 'domain/exploration/InteractionObjectFactory';
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {QuestionDomainConstants} from 'domain/question/question-domain.constants';
import {Question} from 'domain/question/QuestionObjectFactory';

// require('domain/editor/undo_redo/undo-redo.service.ts');
// require('domain/question/QuestionObjectFactory.ts');

// require('domain/question/question-domain.constants.ajs.ts');

@Injectable({
  providedIn: 'root'
})
export class QuestionUpdateService {
  private CMD_UPDATE_QUESTION_PROPERTY: string;
  private QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS: string;
  private QUESTION_PROPERTY_LANGUAGE_CODE: string;
  private QUESTION_PROPERTY_QUESTION_STATE_DATA: string;

  constructor(private QuestionUndoRedoService: UndoRedoService) {
    this.CMD_UPDATE_QUESTION_PROPERTY = (
      QuestionDomainConstants.CMD_UPDATE_QUESTION_PROPERTY);
    this.QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS = (
      QuestionDomainConstants.
        QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS
    );
    this.QUESTION_PROPERTY_LANGUAGE_CODE = (
      QuestionDomainConstants.QUESTION_PROPERTY_LANGUAGE_CODE
    );
    this.QUESTION_PROPERTY_QUESTION_STATE_DATA = (
      QuestionDomainConstants.QUESTION_PROPERTY_QUESTION_STATE_DATA
    );
  }

  private applyChange(
      question: Question, command, params,
      apply: (
       backendChangeObject:
       BackendChangeObject, domainObject: DomainObject) => void,
      reverse: (
       backendChangeObject:
       BackendChangeObject, domainObject: DomainObject) => void): void {
    var changeDict = angular.copy(params);
    changeDict.cmd = command;
    var changeObj = new Change(changeDict, apply, reverse);
    this.QuestionUndoRedoService.applyChange(changeObj, question);
  }

  private applyPropertyChange(
      question: Question, propertyName, newValue, oldValue, apply, reverse
  ): void {
    this.applyChange(question, this.CMD_UPDATE_QUESTION_PROPERTY, {
      property_name: propertyName,
      new_value: angular.copy(newValue),
      old_value: angular.copy(oldValue),
    }, apply, reverse);
  }

  private getParameterFromChangeDict(changeDict, paramName) {
    return changeDict[paramName];
  }

  private getNewPropertyValueFromChangeDict(changeDict) {
    return this.getParameterFromChangeDict(changeDict, 'new_value');
  }

  private getAllContentIds(state) {
    var allContentIdsSet = new Set();
    allContentIdsSet.add(state.content.contentId);
    state.interaction.answerGroups.forEach((answerGroup) => {
      allContentIdsSet.add(answerGroup.outcome.feedback.contentId);
      answerGroup.rules.forEach(rule => {
        Object.keys(rule.inputs).forEach(inputName => {
          const ruleInput = rule.inputs[inputName];
          // All rules input types which are translatable are subclasses of
          // BaseTranslatableObject having dict structure with contentId
          // as a key.
          if (ruleInput && ruleInput.hasOwnProperty('contentId')) {
            allContentIdsSet.add(ruleInput.contentId);
          }
        });
      });
    });
    if (state.interaction.defaultOutcome) {
      allContentIdsSet.add(
        state.interaction.defaultOutcome.feedback.contentId);
    }
    state.interaction.hints.forEach((hint) => {
      allContentIdsSet.add(hint.hintContent.contentId);
    });
    if (state.interaction.solution) {
      allContentIdsSet.add(
        state.interaction.solution.explanation.contentId);
    }
    const custArgs = state.interaction.customizationArgs;
    Interaction.getCustomizationArgContentIds(custArgs)
      .forEach(allContentIdsSet.add, allContentIdsSet);
    return allContentIdsSet;
  }

  private getElementsInFirstSetButNotInSecond(setA, setB) {
    var diffList = Array.from(setA).filter((element) => {
      return !setB.has(element);
    });
    return diffList;
  }

  private updateContentIdsInAssets(newState, oldState) {
    var newContentIds = this.getAllContentIds(newState);
    var oldContentIds = this.getAllContentIds(oldState);
    var contentIdsToDelete = this.getElementsInFirstSetButNotInSecond(
      oldContentIds, newContentIds);
    var contentIdsToAdd = this.getElementsInFirstSetButNotInSecond(
      newContentIds, oldContentIds);
    contentIdsToDelete.forEach((contentId) => {
      newState.recordedVoiceovers.deleteContentId(contentId);
      newState.writtenTranslations.deleteContentId(contentId);
    });
    contentIdsToAdd.forEach((contentId) => {
      newState.recordedVoiceovers.addContentId(contentId);
      newState.writtenTranslations.addContentId(contentId);
    });
  }

  public setQuestionLanguageCode(
      question: Question, newLanguageCode: string): void {
    var oldLanguageCode = angular.copy(question.getLanguageCode());
    this.applyPropertyChange(
      question, this.QUESTION_PROPERTY_LANGUAGE_CODE,
      newLanguageCode, oldLanguageCode,
      (changeDict, question) => {
        var languageCode = this.getNewPropertyValueFromChangeDict(changeDict);
        question.setLanguageCode(languageCode);
      }, (changeDict, question) => {
        question.setLanguageCode(oldLanguageCode);
      });
  }

  public setQuestionInapplicableSkillMisconceptionIds(
      question: Question,
      newInapplicableSkillMisconceptionIds: string[]): void {
    var oldInapplicableSkillMisconceptionIds = angular.copy(
      question.getInapplicableSkillMisconceptionIds());
    this.applyPropertyChange(
      question, this.QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS,
      newInapplicableSkillMisconceptionIds,
      oldInapplicableSkillMisconceptionIds,
      (changeDict, question) => {
        var languageCode = this.getNewPropertyValueFromChangeDict(changeDict);
        question.setInapplicableSkillMisconceptionIds(languageCode);
      }, (changeDict, question) => {
        question.setInapplicableSkillMisconceptionIds(
          oldInapplicableSkillMisconceptionIds);
      });
  }

  public setQuestionStateData(
      question: Question,
      updateFunction: () => void): void {
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
    this.updateContentIdsInAssets(newStateData, oldStateData);
    this.applyPropertyChange(
      question, this.QUESTION_PROPERTY_QUESTION_STATE_DATA,
      newStateData.toBackendDict(),
      oldStateData.toBackendDict(),
      (changeDict, question) => {
        // Unused (see comment above).
      }, (changeDict, question) => {
        question.setStateData(oldStateData);
      });
  }
}
angular.module('oppia').factory(
  'QuestionUpdateService', downgradeInjectable(QuestionUpdateService));


// Angular.module('oppia').factory('QuestionUpdateService', [
//   'QuestionUndoRedoService',
//   'CMD_UPDATE_QUESTION_PROPERTY',
//   'QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS',
//   'QUESTION_PROPERTY_LANGUAGE_CODE', 'QUESTION_PROPERTY_QUESTION_STATE_DATA',
//   function(
//       QuestionUndoRedoService,
//       CMD_UPDATE_QUESTION_PROPERTY,
//       QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS,
//       QUESTION_PROPERTY_LANGUAGE_CODE, QUESTION_PROPERTY_QUESTION_STATE_DATA) {
//     var _applyChange = function(question, command, params, apply, reverse) {
//       var changeDict = angular.copy(params);
//       changeDict.cmd = command;
//       var changeObj = new Change(changeDict, apply, reverse);
//       QuestionUndoRedoService.applyChange(changeObj, question);
//     };

//     var _applyPropertyChange = function(
//         question, propertyName, newValue, oldValue, apply, reverse) {
//       _applyChange(question, CMD_UPDATE_QUESTION_PROPERTY, {
//         property_name: propertyName,
//         new_value: angular.copy(newValue),
//         old_value: angular.copy(oldValue),
//       }, apply, reverse);
//     };

//     var _getParameterFromChangeDict = function(changeDict, paramName) {
//       return changeDict[paramName];
//     };

//     var _getNewPropertyValueFromChangeDict = function(changeDict) {
//       return _getParameterFromChangeDict(changeDict, 'new_value');
//     };

//     var _getAllContentIds = function(state) {
//       var allContentIdsSet = new Set();
//       allContentIdsSet.add(state.content.contentId);
//       state.interaction.answerGroups.forEach(function(answerGroup) {
//         allContentIdsSet.add(answerGroup.outcome.feedback.contentId);
//         answerGroup.rules.forEach(rule => {
//           Object.keys(rule.inputs).forEach(inputName => {
//             const ruleInput = rule.inputs[inputName];
//             // All rules input types which are translatable are subclasses of
//             // BaseTranslatableObject having dict structure with contentId
//             // as a key.
//             if (ruleInput && ruleInput.hasOwnProperty('contentId')) {
//               allContentIdsSet.add(ruleInput.contentId);
//             }
//           });
//         });
//       });
//       if (state.interaction.defaultOutcome) {
//         allContentIdsSet.add(
//           state.interaction.defaultOutcome.feedback.contentId);
//       }
//       state.interaction.hints.forEach(function(hint) {
//         allContentIdsSet.add(hint.hintContent.contentId);
//       });
//       if (state.interaction.solution) {
//         allContentIdsSet.add(
//           state.interaction.solution.explanation.contentId);
//       }
//       const custArgs = state.interaction.customizationArgs;
//       Interaction.getCustomizationArgContentIds(custArgs)
//         .forEach(allContentIdsSet.add, allContentIdsSet);
//       return allContentIdsSet;
//     };

//     var _getElementsInFirstSetButNotInSecond = function(setA, setB) {
//       var diffList = Array.from(setA).filter(function(element) {
//         return !setB.has(element);
//       });
//       return diffList;
//     };

//     var _updateContentIdsInAssets = function(newState, oldState) {
//       var newContentIds = _getAllContentIds(newState);
//       var oldContentIds = _getAllContentIds(oldState);
//       var contentIdsToDelete = _getElementsInFirstSetButNotInSecond(
//         oldContentIds, newContentIds);
//       var contentIdsToAdd = _getElementsInFirstSetButNotInSecond(
//         newContentIds, oldContentIds);
//       contentIdsToDelete.forEach(function(contentId) {
//         newState.recordedVoiceovers.deleteContentId(contentId);
//         newState.writtenTranslations.deleteContentId(contentId);
//       });
//       contentIdsToAdd.forEach(function(contentId) {
//         newState.recordedVoiceovers.addContentId(contentId);
//         newState.writtenTranslations.addContentId(contentId);
//       });
//     };

//     return {
//       setQuestionLanguageCode: function(question, newLanguageCode) {
//         var oldLanguageCode = angular.copy(question.getLanguageCode());
//         _applyPropertyChange(
//           question, QUESTION_PROPERTY_LANGUAGE_CODE,
//           newLanguageCode, oldLanguageCode,
//           function(changeDict, question) {
//             var languageCode = _getNewPropertyValueFromChangeDict(changeDict);
//             question.setLanguageCode(languageCode);
//           }, function(changeDict, question) {
//             question.setLanguageCode(oldLanguageCode);
//           });
//       },
//       setQuestionInapplicableSkillMisconceptionIds: function(
//           question, newInapplicableSkillMisconceptionIds) {
//         var oldInapplicableSkillMisconceptionIds = angular.copy(
//           question.getInapplicableSkillMisconceptionIds());
//         _applyPropertyChange(
//           question, QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS,
//           newInapplicableSkillMisconceptionIds,
//           oldInapplicableSkillMisconceptionIds,
//           function(changeDict, question) {
//             var languageCode = _getNewPropertyValueFromChangeDict(changeDict);
//             question.setInapplicableSkillMisconceptionIds(languageCode);
//           }, function(changeDict, question) {
//             question.setInapplicableSkillMisconceptionIds(
//               oldInapplicableSkillMisconceptionIds);
//           });
//       },
//       setQuestionStateData: function(question, updateFunction) {
//         var oldStateData = angular.copy(question.getStateData());
//         // We update the question here before making the change,
//         // so that we can obtain the new state to save to the backend via
//         // the change list.
//         //
//         // We diverge slightly from the other models of update services because
//         // a separate service (StateEditorService) is being used to update
//         // the question, and we can't retrieve the new state data without
//         // simultaneously updating it.
//         //
//         // The updating of the question in the client can't be deferred to
//         // when the change in the change list is applied, because we would
//         // have to defer the extraction of the new state data, which we need
//         // for creating the change to send to the backend.
//         updateFunction();
//         var newStateData = question.getStateData();
//         _updateContentIdsInAssets(newStateData, oldStateData);
//         _applyPropertyChange(
//           question, QUESTION_PROPERTY_QUESTION_STATE_DATA,
//           newStateData.toBackendDict(),
//           oldStateData.toBackendDict(),
//           function(changeDict, question) {
//             // Unused (see comment above).
//           }, function(changeDict, question) {
//             question.setStateData(oldStateData);
//           });
//       }
//     };
//   }
// ]);
