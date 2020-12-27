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
 * @fileoverview Service that populates rule content ids.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AppConstants } from 'app.constants';
import { BaseTranslatableObject } from 'interactions/rule-input-defs';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { Rule } from 'domain/exploration/RuleObjectFactory';

@Injectable({
  providedIn: 'root'
})
export class PopulateRuleContentIdsService {
  constructor(private generateContentIdService: GenerateContentIdService) {}

  /**
   * The default values of translatable objects in the rule inputs have
   * null content_id's. This function populates these null content_id's
   * with a content_id. This function should be called on save but not on
   * cancel.
   * @param {Rule} rule The rule to populate null content ids for.
   */
  populateNullRuleContentIds(rule: Rule): void {
    const inputTypes = rule.inputTypes;
    const inputs = rule.inputs;

    if (rule.type === null) {
      return;
    }

    Object.keys(inputTypes).forEach(inputName => {
      const hasContentId = (
        inputTypes[inputName].indexOf('Translatable') === 0);
      if (!hasContentId) {
        return;
      }
      const inputValue = <BaseTranslatableObject>inputs[inputName];
      const needsContentId = inputValue.contentId === null;

      if (needsContentId) {
        inputValue.contentId = (
          this.generateContentIdService.getNextStateId(
            `${AppConstants.COMPONENT_NAME_RULE_INPUT}`));
      }
    });
  }
}

angular.module('oppia').factory(
  'PopulateRuleContentIdsService',
  downgradeInjectable(PopulateRuleContentIdsService));
