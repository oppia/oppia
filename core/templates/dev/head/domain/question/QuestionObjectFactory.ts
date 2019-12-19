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
 * @fileoverview Factory for creating and mutating instances of frontend
 * question domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import cloneDeep from 'lodash/cloneDeep';
import { AppConstants } from 'app.constants';
import { LoggerService } from 'services/contextual/logger.service';


// require('domain/state/StateObjectFactory.ts');
import { StateObjectFactory } from 'domain/state/StateObjectFactory';

export class Question {
  _id;
  _stateData;
  _languageCode;
  _version;
  _linkedSkillIds;
  logger: LoggerService;

  constructor(
      id: any, stateData: any, languageCode: any, version: any,
      loggerService: LoggerService) {
    this._id = id;
    this._stateData = stateData;
    this._languageCode = languageCode;
    this._version = version;
    this._linkedSkillIds = linkedSkillIds;
    this.logger = LoggerService;
  }

  // Instance Methods

  getId(): any {
    return this._id;
  }

  getStateData(): any {
    return this._stateData;
  }

  setStateData(newStateData: any): any {
    this._stateData = angular.copy(newStateData);
  }

  getLanguageCode(): any {
    return this._languageCode;
  }

  setLanguageCode(languageCode: any): any {
    this._languageCode = languageCode;
  }

  getVersion(): any {
    return this._version;
  }

  getLinkedSkillIds(): any {
    return this._linkedSkillIds;
  }

  setLinkedSkillIds(linkedSkillIds: string): any {
    this._linkedSkillIds = linkedSkillIds;
  }

  validate(misconceptionsBySkill: any): any {
    let interaction = this._stateData.interaction;
    if (interaction.id === null) {
      return 'An interaction must be specified';
    }
    if (interaction.hints.length === 0) {
      return 'At least 1 hint should be specfied';
    }
    if (
      !interaction.solution &&
      INTERACTION_SPECS[interaction.id].can_have_solution) {
      return 'A solution must be specified';
    }
    let answerGroups = this._stateData.interaction.answerGroups;
    let taggedSkillMisconceptionIds = {};
    let atLeastOneAnswerCorrect = false;
    for (let i = 0; i < answerGroups.length; i++) {
      if (answerGroups[i].outcome.labelledAsCorrect) {
        atLeastOneAnswerCorrect = true;
        continue;
      }
      if (answerGroups[i].taggedSkillMisconceptionId !== null) {
        taggedSkillMisconceptionIds[
          answerGroups[i].taggedSkillMisconceptionId] = true;
      }
    }
    if (!atLeastOneAnswerCorrect) {
      return 'At least one answer should be marked correct';
    }
    let pendingMisconceptionNamesToTag = [];
    Object.keys(misconceptionsBySkill).forEach(function(skillId) {
      for (let i = 0; i < misconceptionsBySkill[skillId].length; i++) {
        if (!misconceptionsBySkill[skillId][i].isMandatory()) {
          continue;
        }
        let skillMisconceptionId =
          skillId + '-' + misconceptionsBySkill[skillId][i].getId();
        if (
          !taggedSkillMisconceptionIds.hasOwnProperty(skillMisconceptionId)) {
          pendingMisconceptionNamesToTag.push(
            misconceptionsBySkill[skillId][i].getName());
        }
      }
    });
    if (pendingMisconceptionNamesToTag.length > 0) {
      let returnString = 'Click on (or create) an answer ' +
        'that is neither marked correct nor is a default answer (marked ' +
        'above as [All other answers]) and tag the following misconceptions' +
        ' to that answer group:';
      pendingMisconceptionNamesToTag.forEach(function(misconceptionName) {
        returnString = returnString + ' ' + misconceptionName + ',';
      });
      returnString = returnString.slice(0, -1);
      return returnString;
    }
    return false;
  }

  toBackendDict(isNewQuestion: any): any {
    let questionBackendDict = {
      id: null,
      question_state_data: this._stateData.toBackendDict(),
      language_code: this._languageCode,
      version: 1
    };
    if (!isNewQuestion) {
      questionBackendDict.id = this._id;
      questionBackendDict.version = this._version;
    }
    return questionBackendDict;
  }
}

@Injectable({
  providedIn: 'root'
})
export class QuestionObjectFactory {
  constructor(private logger: LoggerService,
              private StateObjectFactory: StateObjectFactory) {}

  // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  createDefaultQuestion(skillIds: any): any {
  /* eslint-enable dot-notation */
    return new Question(
      null, this.StateObjectFactory.createDefaultState(null),
      AppConstants.DEFAULT_LANGUAGE_CODE, 1, skillIds);
  }

  // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  createFromBackendDict(questionBackendDict: any): any {
  /* eslint-enable dot-notation */
    return new Question(
      questionBackendDict.id,
      this.StateObjectFactory.createFromBackendDict(
        'question', questionBackendDict.question_state_data),
      questionBackendDict.language_code, questionBackendDict.version,
      questionBackendDict.linked_skill_ids
    );
  }
}

angular.module('oppia').factory(
  'QuestionObjectFactory',
  downgradeInjectable(QuestionObjectFactory));
