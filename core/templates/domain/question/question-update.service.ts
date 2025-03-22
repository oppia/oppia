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

import {
  BackendChangeObject,
  Change,
  DomainObject,
} from 'domain/editor/undo_redo/change.model';
import {QuestionUndoRedoService} from 'domain/editor/undo_redo/question-undo-redo.service';
import {QuestionDomainConstants} from 'domain/question/question-domain.constants';
import cloneDeep from 'lodash/cloneDeep';
import {Injectable} from '@angular/core';
import {State, StateBackendDict} from 'domain/state/StateObjectFactory';
import {Question} from './QuestionObjectFactory';

interface ApplyParams {
  property_name: string;
  new_value: StateBackendDict | string | string[] | number;
  old_value: StateBackendDict | string | string[] | number;
  cmd: string;
}

@Injectable({
  providedIn: 'root',
})
export class QuestionUpdateService {
  constructor(private questionUndoRedoService: QuestionUndoRedoService) {}

  _applyChange(
    question: Question,
    command: string,
    params: ApplyParams | BackendChangeObject,
    apply: Function,
    reverse: Function
  ): void {
    let changeDict = cloneDeep(params);
    changeDict.cmd = command;
    let changeObj = new Change(
      changeDict as BackendChangeObject,
      apply as (
        backendChangeObject: BackendChangeObject,
        domainObject: DomainObject
      ) => void,
      reverse as (
        backendChangeObject: BackendChangeObject,
        domainObject: DomainObject
      ) => void
    );
    this.questionUndoRedoService.applyChange(changeObj, question);
  }

  _applyPropertyChange(
    question: Question,
    propertyName: string,
    newValue: StateBackendDict | string | string[] | number,
    oldValue: StateBackendDict | string | string[] | number,
    apply: Function,
    reverse: Function
  ): void {
    this._applyChange(
      question,
      QuestionDomainConstants.CMD_UPDATE_QUESTION_PROPERTY,
      {
        property_name: propertyName,
        new_value: cloneDeep(newValue),
        old_value: cloneDeep(oldValue),
        cmd: '',
      },
      apply,
      reverse
    );
  }

  _getParameterFromChangeDict(
    changeDict: BackendChangeObject,
    paramName: string
  ): string | string[] {
    return changeDict[paramName];
  }

  _getNewPropertyValueFromChangeDict(
    changeDict: BackendChangeObject
  ): string | string[] {
    return this._getParameterFromChangeDict(changeDict, 'new_value');
  }

  _getElementsInFirstSetButNotInSecond(
    setA: Set<string>,
    setB: Set<string>
  ): string[] {
    let diffList = Array.from(setA).filter(element => {
      return !setB.has(element);
    });
    return diffList;
  }

  _updateContentIdsInAssets(newState: State, oldState: State): void {
    let newContentIds = new Set(newState.getAllContentIds());
    let oldContentIds = new Set(oldState.getAllContentIds());
    let contentIdsToDelete = this._getElementsInFirstSetButNotInSecond(
      oldContentIds,
      newContentIds
    );
    let contentIdsToAdd = this._getElementsInFirstSetButNotInSecond(
      newContentIds,
      oldContentIds
    );
    contentIdsToDelete.forEach(contentId => {
      newState.recordedVoiceovers.deleteContentId(contentId);
    });
    contentIdsToAdd.forEach(contentId => {
      newState.recordedVoiceovers.addContentId(contentId);
    });
  }

  setQuestionLanguageCode(question: Question, newLanguageCode: string): void {
    let oldLanguageCode = cloneDeep(question.getLanguageCode());
    this._applyPropertyChange(
      question,
      QuestionDomainConstants.QUESTION_PROPERTY_LANGUAGE_CODE,
      newLanguageCode,
      oldLanguageCode,
      (changeDict: BackendChangeObject, question: Question) => {
        const languageCode =
          this._getNewPropertyValueFromChangeDict(changeDict);
        question.setLanguageCode(languageCode as string);
      },
      (changeDict: BackendChangeObject, question: Question) => {
        question.setLanguageCode(oldLanguageCode);
      }
    );
  }

  setQuestionInapplicableSkillMisconceptionIds(
    question: Question,
    newInapplicableSkillMisconceptionIds: string[]
  ): void {
    let oldInapplicableSkillMisconceptionIds = cloneDeep(
      question.getInapplicableSkillMisconceptionIds()
    );
    this._applyPropertyChange(
      question,
      QuestionDomainConstants.QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS,
      newInapplicableSkillMisconceptionIds,
      oldInapplicableSkillMisconceptionIds,
      (changeDict: BackendChangeObject, question: Question) => {
        const inapplicableSkillMisconceptionIds =
          this._getNewPropertyValueFromChangeDict(changeDict);
        question.setInapplicableSkillMisconceptionIds(
          inapplicableSkillMisconceptionIds as string[]
        );
      },
      (changeDict: BackendChangeObject, question: Question) => {
        question.setInapplicableSkillMisconceptionIds(
          oldInapplicableSkillMisconceptionIds
        );
      }
    );
  }

  setQuestionNextContentIdIndex(question: Question, newValue: number): void {
    var oldValue = question.getNextContentIdIndex();
    this._applyPropertyChange(
      question,
      QuestionDomainConstants.QUESTION_PROPERTY_NEXT_CONTENT_ID_INDEX,
      newValue,
      oldValue,
      (changeDict, question) => {
        var newValue = this._getNewPropertyValueFromChangeDict(changeDict);
        question.setNextContentIdIndex(newValue);
      },
      (changeDict, question) => {
        question.setNextContentIdIndex(changeDict.old_value);
      }
    );
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
      question,
      QuestionDomainConstants.QUESTION_PROPERTY_QUESTION_STATE_DATA,
      newStateData.toBackendDict(),
      oldStateData.toBackendDict(),
      (changeDict: BackendChangeObject, question: Question) => {
        // Unused (see comment above).
      },
      (changeDict: BackendChangeObject, question: Question) => {
        question.setStateData(oldStateData);
      }
    );
  }
}
