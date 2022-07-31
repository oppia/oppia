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

import { BackendChangeObject, Change, DomainObject } from 'domain/editor/undo_redo/change.model';
import { Interaction } from 'domain/exploration/InteractionObjectFactory';
import { QuestionUndoRedoService } from 'domain/editor/undo_redo/question-undo-redo.service';
import { QuestionDomainConstants } from 'domain/question/question-domain.constants';
import cloneDeep from 'lodash/cloneDeep';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { State, StateBackendDict } from 'domain/state/StateObjectFactory';
import { Question } from './QuestionObjectFactory';

interface ApplyParams {
  property_name: string;
  new_value: StateBackendDict | string | string[];
  old_value: StateBackendDict | string | string[];
  cmd: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuestionUpdateService {
  constructor(
    private questionUndoRedoService: QuestionUndoRedoService,
  ) { }

  _applyChange(
      question: Question,
      command: string,
      params: ApplyParams | BackendChangeObject,
      apply: Function, reverse: Function): void {
    let changeDict = cloneDeep(params);
    changeDict.cmd = command;
    let changeObj = new Change(
      changeDict as BackendChangeObject, apply as (
        backendChangeObject: BackendChangeObject,
        domainObject: DomainObject) => void, reverse as (
          backendChangeObject: BackendChangeObject,
          domainObject: DomainObject) => void);
    this.questionUndoRedoService.applyChange(changeObj, question);
  }

  _applyPropertyChange(
      question: Question, propertyName: string,
      newValue: StateBackendDict | string | string[],
      oldValue: StateBackendDict | string | string[],
      apply: Function, reverse: Function): void {
    this._applyChange(
      question,
      QuestionDomainConstants.CMD_UPDATE_QUESTION_PROPERTY, {
        property_name: propertyName,
        new_value: cloneDeep(newValue),
        old_value: cloneDeep(oldValue),
        cmd: ''
      }, apply, reverse);
  }

  _getParameterFromChangeDict(changeDict: unknown, paramName: string): string {
    return changeDict[paramName];
  }

  _getNewPropertyValueFromChangeDict(changeDict: unknown): string {
    return this._getParameterFromChangeDict(changeDict, 'new_value');
  }

  _getAllContentIds(state: State): Set<string> {
    let allContentIdsSet = new Set<string>();
    allContentIdsSet.add(state.content.contentId);
    state.interaction.answerGroups.forEach((answerGroup) => {
      allContentIdsSet.add(answerGroup.outcome.feedback.contentId);
      answerGroup.rules.forEach(rule => {
        Object.keys(rule.inputs).forEach(inputName => {
          let ruleInput = rule.inputs[inputName];
          // All rules input types which are translatable are subclasses of
          // BaseTranslatableObject having dict structure with contentId
          // as a key.
          if (ruleInput && ruleInput.hasOwnProperty('contentId')) {
            if ('contentId' in ruleInput) {
              allContentIdsSet.add(ruleInput.contentId);
            }
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

  _getElementsInFirstSetButNotInSecond(
      setA: Set<string>, setB: Set<string>): string[] {
    let diffList = Array.from(setA).filter((element) => {
      return !setB.has(element);
    });
    return diffList;
  }

  _updateContentIdsInAssets(newState: State, oldState: State): void {
    let newContentIds = this._getAllContentIds(newState);
    let oldContentIds = this._getAllContentIds(oldState);
    let contentIdsToDelete = this._getElementsInFirstSetButNotInSecond(
      oldContentIds, newContentIds);
    let contentIdsToAdd = this._getElementsInFirstSetButNotInSecond(
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

  setQuestionLanguageCode(question: Question, newLanguageCode: string): void {
    let oldLanguageCode = cloneDeep(question.getLanguageCode());
    this._applyPropertyChange(
      question, QuestionDomainConstants.QUESTION_PROPERTY_LANGUAGE_CODE,
      newLanguageCode, oldLanguageCode,
      (changeDict, question) => {
        let languageCode = this._getNewPropertyValueFromChangeDict(changeDict);
        question.setLanguageCode(languageCode);
      }, (changeDict, question) => {
        question.setLanguageCode(oldLanguageCode);
      });
  }

  setQuestionInapplicableSkillMisconceptionIds(
      question: Question,
      newInapplicableSkillMisconceptionIds: string[] | string): void {
    let oldInapplicableSkillMisconceptionIds = cloneDeep(
      question.getInapplicableSkillMisconceptionIds());
    this._applyPropertyChange(
      question, QuestionDomainConstants
        .QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS,
      newInapplicableSkillMisconceptionIds,
      oldInapplicableSkillMisconceptionIds,
      (changeDict, question) => {
        let languageCode = this._getNewPropertyValueFromChangeDict(changeDict);
        question.setInapplicableSkillMisconceptionIds(languageCode);
      }, (changeDict, question) => {
        question.setInapplicableSkillMisconceptionIds(
          oldInapplicableSkillMisconceptionIds);
      });
  }

  setQuestionStateData(question: Question, updateFunction: Function): void {
    let oldStateData = cloneDeep(question.getStateData());
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
    let newStateData = question.getStateData();
    this._updateContentIdsInAssets(newStateData, oldStateData);
    this._applyPropertyChange(
      question, QuestionDomainConstants.
        QUESTION_PROPERTY_QUESTION_STATE_DATA,
      newStateData.toBackendDict(),
      oldStateData.toBackendDict(),
      (changeDict, question) => {
        // Unused (see comment above).
      }, (changeDict, question) => {
        question.setStateData(oldStateData);
      });
  }
}

angular.module('oppia').factory('QuestionUpdateService',
  downgradeInjectable(QuestionUpdateService));
