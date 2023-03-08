// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of LostChange
 * domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { UtilsService } from 'services/utils.service';
import isEqual from 'lodash/isEqual';

import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';
import { SubtitledHtml, SubtitledHtmlBackendDict } from
  'domain/exploration/subtitled-html.model';
import { ExplorationChange } from './exploration-draft.model';
import { InteractionBackendDict } from './InteractionObjectFactory';
import { ParamChangeBackendDict } from './ParamChangeObjectFactory';
import { ParamSpecBackendDict } from './ParamSpecObjectFactory';
import { RecordedVoiceOverBackendDict } from './recorded-voiceovers.model';
import { WrittenTranslationsBackendDict } from './WrittenTranslationsObjectFactory';
import { AppConstants } from 'app.constants';

interface LostChangeValues {
  'outcome'?: Outcome;
  'dest'?: string;
  'feedback'?: SubtitledHtml;
  'rules'?: Object;
  'html'?: string;
}

export type LostChangeValue = LostChangeValues | SubtitledHtmlBackendDict |
  InteractionBackendDict | ParamChangeBackendDict[] |
  RecordedVoiceOverBackendDict | WrittenTranslationsBackendDict |
  ParamChangeBackendDict[] | ParamSpecBackendDict | boolean | number | string |
  string[];

// Properties are optional in 'LostChangeBackendDict' because all of them may
// not be present in the dict and may change according to the cmd.
export interface LostChangeBackendDict {
  'cmd': string;
  'new_state_name'?: string;
  'old_state_name'?: string;
  'state_name'?: string;
  // 'new_value' here refers to the new value of an entity
  // added into an Exploration. Entity here refers to the
  // Interactions, Translations, Hints, Solutions etc. 'new_value'
  // will be 'null' when any of these entities are deleted.
  'new_value'?: LostChangeValue | null;
  // 'old_value' here refers to the old value of an entity
  // present in an Exploration. Entity here refers to the
  // Interactions, Translations, Hints, Solutions etc. 'old_value'
  // will be 'null' when any of these entities are newly added.
  'old_value'?: LostChangeValue | null;
  'property_name'?: string;
  'translation_html'?: string;
  'content_id'?: string;
  'language_code'?: string;
}

// Properties are optional in 'LostChangeBackendDict' because all of them may
// not be present in the dict and may change according to the cmd. Therefore,
// they can be undefined.
// TODO(#13677): Create separate interfaces for different unique commands(cmd)
// received at LostChangeBackendDict.
export class LostChange {
  cmd: string;
  stateName?: string;
  newStateName?: string;
  oldStateName?: string;
  newValue?: LostChangeValue | null;
  oldValue?: LostChangeValue | null;
  propertyName?: string;
  contentId?: string;
  languageCode?: string;
  translationHTML?: string;
  utilsService: UtilsService;

  constructor(
      utilsService: UtilsService, cmd: string, newStateName?: string,
      oldStateName?: string, stateName?: string,
      newValue?: LostChangeValue | null, oldValue?: LostChangeValue | null,
      propertyName?: string, contentId?: string,
      languageCode?: string, translationHTML?: string) {
    this.utilsService = utilsService;
    this.cmd = cmd;
    this.newStateName = newStateName;
    this.oldStateName = oldStateName;
    this.stateName = stateName;
    this.newValue = newValue;
    this.oldValue = oldValue;
    this.propertyName = propertyName;
    this.contentId = contentId;
    this.languageCode = languageCode;
    this.translationHTML = translationHTML;
  }

  // An edit is represented either as an object or an array. If it's an
  // object, then simply return that object. In case of an array, return
  // the last item.
  getStatePropertyValue(
      statePropertyValue: string[] | Object): string | Object {
    return Array.isArray(statePropertyValue) ?
      statePropertyValue[statePropertyValue.length - 1] : statePropertyValue;
  }

  isEndingExploration(): boolean {
    return this.oldValue === null && this.newValue === 'EndExploration';
  }

  isAddingInteraction(): boolean {
    return this.oldValue === null && this.newValue !== 'EndExploration';
  }

  isOldValueEmpty(): boolean {
    return this.utilsService.isEmpty(this.oldValue);
  }

  isNewValueEmpty(): boolean {
    return this.utilsService.isEmpty(this.newValue);
  }

  isOutcomeFeedbackEqual(): boolean {
    let newValueOutcome = (this.newValue as LostChangeValues).outcome;
    let oldValueOutcome = (this.oldValue as LostChangeValues).outcome;
    if (
      newValueOutcome && newValueOutcome?.feedback &&
      oldValueOutcome && oldValueOutcome?.feedback
    ) {
      return newValueOutcome.feedback.html === oldValueOutcome.feedback.html;
    }
    return false;
  }

  isOutcomeDestEqual(): boolean {
    let newValueOutcome = (this.newValue as LostChangeValues).outcome;
    let oldValueOutcome = (this.oldValue as LostChangeValues).outcome;
    if (newValueOutcome && oldValueOutcome) {
      return newValueOutcome?.dest === oldValueOutcome?.dest;
    }
    return false;
  }

  isDestEqual(): boolean {
    let newValueDest = (this.newValue as LostChangeValues).dest;
    let oldValueDest = (this.oldValue as LostChangeValues).dest;
    return newValueDest === oldValueDest;
  }

  isFeedbackEqual(): boolean {
    let newValueFeedback = (this.newValue as LostChangeValues).feedback;
    let oldValueFeedback = (this.oldValue as LostChangeValues).feedback;
    if (newValueFeedback && oldValueFeedback) {
      return newValueFeedback?.html === oldValueFeedback?.html;
    }
    return false;
  }

  isRulesEqual(): boolean {
    return isEqual(
      (this.newValue as LostChangeValues).rules,
      (this.oldValue as LostChangeValues).rules);
  }

  // Detects whether an object of the type 'answer_group' or
  // 'default_outcome' has been added, edited or deleted.
  // Returns - 'addded', 'edited' or 'deleted' accordingly.
  getRelativeChangeToGroups(): string {
    let result = '';

    if (Array.isArray(this.newValue) && Array.isArray(this.oldValue)) {
      if (this.newValue.length > this.oldValue.length) {
        result = 'added';
      } else if (this.newValue.length === this.oldValue.length) {
        result = 'edited';
      } else {
        result = 'deleted';
      }
    } else {
      if (!this.utilsService.isEmpty(this.oldValue)) {
        if (!this.utilsService.isEmpty(this.newValue)) {
          result = 'edited';
        } else {
          result = 'deleted';
        }
      } else if (!this.utilsService.isEmpty(this.newValue)) {
        result = 'added';
      }
    }
    return result;
  }

  getLanguage(): string {
    let language = '';
    let supportedLanguages = AppConstants.SUPPORTED_CONTENT_LANGUAGES;
    if (this.cmd === 'add_written_translation') {
      for (let i = 0; i < supportedLanguages.length; i++) {
        if (this.languageCode === supportedLanguages[i].code) {
          language = supportedLanguages[i].description;
        }
      }
    } else {
      for (let i = 0; i < supportedLanguages.length; i++) {
        if (this.newValue === supportedLanguages[i].code) {
          language = supportedLanguages[i].description;
        }
      }
    }
    return language;
  }
}

@Injectable({
  providedIn: 'root'
})
export class LostChangeObjectFactory {
  constructor(private utilsService: UtilsService) {
    // The createNew function needs to be binded because it's used a lot in
    // calbacks and then `this` would refer to window instead of the service
    // itself.
    this.createNew = this.createNew.bind(this);
  }

  /**
   * @param {String} lostChangeDict - the name of the type to fetch.
   * @returns {LostChange} - The associated type, if any.
   */
  createNew(
      lostChangeDict: ExplorationChange | LostChangeBackendDict): LostChange {
    lostChangeDict = lostChangeDict as LostChangeBackendDict;
    return new LostChange(
      this.utilsService,
      lostChangeDict.cmd,
      lostChangeDict.new_state_name,
      lostChangeDict.old_state_name,
      lostChangeDict.state_name,
      lostChangeDict.new_value,
      lostChangeDict.old_value,
      lostChangeDict.property_name,
      lostChangeDict.content_id,
      lostChangeDict.language_code,
      lostChangeDict.translation_html,
    );
  }
}

angular.module('oppia').factory(
  'LostChangeObjectFactory', downgradeInjectable(LostChangeObjectFactory));
