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
  QuestionChange,
} from 'domain/editor/undo_redo/change.model';
import {QuestionUndoRedoService} from 'domain/editor/undo_redo/question-undo-redo.service';
import {QuestionDomainConstants} from 'domain/question/question-domain.constants';
import cloneDeep from 'lodash/cloneDeep';
import {Injectable} from '@angular/core';
import {StateBackendDict} from 'domain/state/state.model';
import {Question} from './question.model';

// Type for property values that can appear in QuestionChange objects.
type QuestionPropertyValue = string | string[] | number | StateBackendDict;

type QuestionUpdateApply = (
  questionChange: QuestionChange,
  domainObject: DomainObject
) => void;
type QuestionUpdateReverse = (
  questionChange: QuestionChange,
  domainObject: DomainObject
) => void;

@Injectable({
  providedIn: 'root',
})
export class QuestionUpdateService {
  constructor(private questionUndoRedoService: QuestionUndoRedoService) {}

  private _applyChange(
    question: Question,
    command: string,
    params: Record<string, QuestionPropertyValue>,
    apply: QuestionUpdateApply,
    reverse: QuestionUpdateReverse
  ): void {
    let changeDict = cloneDeep(params);
    changeDict.cmd = command;
    let changeObj = new Change(
      changeDict as Partial<QuestionChange> as QuestionChange,
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

  private _applyPropertyChange(
    question: Question,
    propertyName: string,
    newValue: QuestionPropertyValue,
    oldValue: QuestionPropertyValue,
    apply: QuestionUpdateApply,
    reverse: QuestionUpdateReverse
  ): void {
    this._applyChange(
      question,
      QuestionDomainConstants.CMD_UPDATE_QUESTION_PROPERTY,
      {
        property_name: propertyName,
        new_value: cloneDeep(newValue) as QuestionPropertyValue,
        old_value: cloneDeep(oldValue) as QuestionPropertyValue,
      },
      apply,
      reverse
    );
  }

  private _getParameterFromChangeDict(
    changeDict: QuestionChange,
    paramName: string
  ): QuestionPropertyValue {
    return changeDict[
      paramName as keyof QuestionChange
    ] as QuestionPropertyValue;
  }

  private _getNewPropertyValueFromChangeDict(
    changeDict: QuestionChange
  ): QuestionPropertyValue {
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

  setQuestionLanguageCode(question: Question, newLanguageCode: string): void {
    let oldLanguageCode = cloneDeep(question.getLanguageCode());
    this._applyPropertyChange(
      question,
      QuestionDomainConstants.QUESTION_PROPERTY_LANGUAGE_CODE,
      newLanguageCode,
      oldLanguageCode,
      (changeDict: QuestionChange, domainObject: DomainObject) => {
        const question = domainObject as Question;
        const languageCode = this._getNewPropertyValueFromChangeDict(
          changeDict
        ) as string;
        question.setLanguageCode(languageCode);
      },
      (changeDict: QuestionChange, domainObject: DomainObject) => {
        const question = domainObject as Question;
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
      (changeDict: QuestionChange, domainObject: DomainObject) => {
        const question = domainObject as Question;
        const ids = this._getNewPropertyValueFromChangeDict(
          changeDict
        ) as string[];
        question.setInapplicableSkillMisconceptionIds(ids);
      },
      (changeDict: QuestionChange, domainObject: DomainObject) => {
        const question = domainObject as Question;
        question.setInapplicableSkillMisconceptionIds(
          oldInapplicableSkillMisconceptionIds
        );
      }
    );
  }

  setQuestionNextContentIdIndex(question: Question, newValue: number): void {
    const oldValue = question.getNextContentIdIndex();
    this._applyPropertyChange(
      question,
      QuestionDomainConstants.QUESTION_PROPERTY_NEXT_CONTENT_ID_INDEX,
      newValue,
      oldValue,
      (changeDict: QuestionChange, domainObject: DomainObject) => {
        const question = domainObject as Question;
        const val = this._getNewPropertyValueFromChangeDict(
          changeDict
        ) as number;
        question.setNextContentIdIndex(val);
      },
      (changeDict: QuestionChange, domainObject: DomainObject) => {
        const question = domainObject as Question;
        question.setNextContentIdIndex(
          this._getParameterFromChangeDict(changeDict, 'old_value') as number
        );
      }
    );
  }

  setQuestionStateData(question: Question, updateFunction: () => void): void {
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
    this._applyPropertyChange(
      question,
      QuestionDomainConstants.QUESTION_PROPERTY_QUESTION_STATE_DATA,
      newStateData.toBackendDict(),
      oldStateData.toBackendDict(),
      (changeDict: QuestionChange, domainObject: DomainObject) => {
        // Unused (see comment above).
      },
      (changeDict: QuestionChange, domainObject: DomainObject) => {
        const question = domainObject as Question;
        question.setStateData(oldStateData);
      }
    );
  }
}
