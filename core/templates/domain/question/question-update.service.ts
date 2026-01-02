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
import { QuestionUndoRedoService } from
  'domain/editor/undo_redo/question-undo-redo.service';
import { QuestionDomainConstants } from
  'domain/question/question-domain.constants';
import cloneDeep from 'lodash/cloneDeep';
import { Injectable } from '@angular/core';
import { StateBackendDict } from 'domain/state/state.model';
import { Question } from './question.model';

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
  constructor(
    private questionUndoRedoService: QuestionUndoRedoService
  ) {}

  _applyChange(
    question: Question,
    command: string,
    params: ApplyParams | BackendChangeObject,
    apply: (
      backendChangeObject: BackendChangeObject,
      domainObject: DomainObject
    ) => void,
    reverse: (
      backendChangeObject: BackendChangeObject,
      domainObject: DomainObject
    ) => void
  ): void {
    const changeDict: BackendChangeObject = cloneDeep(
      params as BackendChangeObject
    );
    changeDict.cmd = command as BackendChangeObject['cmd'];

    const changeObj = new Change(changeDict, apply, reverse);
    this.questionUndoRedoService.applyChange(changeObj, question);
  }

  _applyPropertyChange(
    question: Question,
    propertyName: string,
    newValue: StateBackendDict | string | string[] | number,
    oldValue: StateBackendDict | string | string[] | number,
    apply: (
      backendChangeObject: BackendChangeObject,
      domainObject: DomainObject
    ) => void,
    reverse: (
      backendChangeObject: BackendChangeObject,
      domainObject: DomainObject
    ) => void
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
  ): string | string[] | number {
    return (changeDict as unknown as Record<string, unknown>)[paramName] as
      | string
      | string[]
      | number;
  }

  _getNewPropertyValueFromChangeDict(
    changeDict: BackendChangeObject
  ): string | string[] | number {
    return this._getParameterFromChangeDict(changeDict, 'new_value');
  }

  _getElementsInFirstSetButNotInSecond(
    setA: Set<string>,
    setB: Set<string>
  ): string[] {
    return Array.from(setA).filter(element => !setB.has(element));
  }

  setQuestionLanguageCode(question: Question, newLanguageCode: string): void {
    const oldLanguageCode = cloneDeep(question.getLanguageCode());

    this._applyPropertyChange(
      question,
      QuestionDomainConstants.QUESTION_PROPERTY_LANGUAGE_CODE,
      newLanguageCode,
      oldLanguageCode,
      (changeDict: BackendChangeObject, domainObject: DomainObject) => {
        const questionObj = domainObject as Question;
        const languageCode =
          this._getNewPropertyValueFromChangeDict(changeDict) as string;
        questionObj.setLanguageCode(languageCode);
      },
      (_changeDict: BackendChangeObject, domainObject: DomainObject) => {
        const questionObj = domainObject as Question;
        questionObj.setLanguageCode(oldLanguageCode);
      }
    );
  }

  setQuestionInapplicableSkillMisconceptionIds(
    question: Question,
    newInapplicableSkillMisconceptionIds: string[]
  ): void {
    const oldIds = cloneDeep(
      question.getInapplicableSkillMisconceptionIds()
    );

    this._applyPropertyChange(
      question,
      QuestionDomainConstants
        .QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS,
      newInapplicableSkillMisconceptionIds,
      oldIds,
      (changeDict: BackendChangeObject, domainObject: DomainObject) => {
        const questionObj = domainObject as Question;
        const ids =
          this._getNewPropertyValueFromChangeDict(changeDict) as string[];
        questionObj.setInapplicableSkillMisconceptionIds(ids);
      },
      (_changeDict: BackendChangeObject, domainObject: DomainObject) => {
        const questionObj = domainObject as Question;
        questionObj.setInapplicableSkillMisconceptionIds(oldIds);
      }
    );
  }

  setQuestionNextContentIdIndex(
    question: Question,
    newValue: number
  ): void {
    const oldValue = question.getNextContentIdIndex();

    this._applyPropertyChange(
      question,
      QuestionDomainConstants.QUESTION_PROPERTY_NEXT_CONTENT_ID_INDEX,
      newValue,
      oldValue,
      (changeDict: BackendChangeObject, domainObject: DomainObject) => {
        const questionObj = domainObject as Question;
        const value =
          this._getNewPropertyValueFromChangeDict(changeDict) as number;
        questionObj.setNextContentIdIndex(value);
      },
      (_changeDict: BackendChangeObject, domainObject: DomainObject) => {
        const questionObj = domainObject as Question;
        questionObj.setNextContentIdIndex(oldValue);
      }
    );
  }

  setQuestionStateData(
    question: Question,
    updateFunction: () => void
  ): void {
    const oldStateData = cloneDeep(question.getStateData());

    updateFunction();
    const newStateData = question.getStateData();

    this._applyPropertyChange(
      question,
      QuestionDomainConstants.QUESTION_PROPERTY_QUESTION_STATE_DATA,
      newStateData.toBackendDict(),
      oldStateData.toBackendDict(),
      (_changeDict: BackendChangeObject, _domainObject: DomainObject) => {
        // Intentionally unused.
      },
      (_changeDict: BackendChangeObject, domainObject: DomainObject) => {
        const questionObj = domainObject as Question;
        questionObj.setStateData(oldStateData);
      }
    );
  }
}
