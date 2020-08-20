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
 * @fileoverview Factory for creating new frontend instances of
 * SubtitledVariableLengthListOfRuleInputsBackendDict domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { InteractionRuleInputs } from 'interactions/rule-input-defs';

export interface SubtitledVariableLengthListOfRuleInputsBackendDict {
  'content_id': string;
  'rule_inputs': InteractionRuleInputs[];
}

export class SubtitledVariableLengthListOfRuleInputs {
  // A null content_id indicates that the rule inputs are not translatble.
  constructor(
    public ruleInputs: InteractionRuleInputs[],
    public contentId: string | null
  ) {}

  toBackendDict(): SubtitledVariableLengthListOfRuleInputsBackendDict {
    return {
      rule_inputs: this.ruleInputs,
      content_id: this.contentId
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class SubtitledVariableLengthListOfRuleInputsObjectFactory {
  createFromBackendDict(
      subtitledVariableLengthListOfRuleInputsBackendDict:
        SubtitledVariableLengthListOfRuleInputsBackendDict
  ): SubtitledVariableLengthListOfRuleInputs {
    return new SubtitledVariableLengthListOfRuleInputs(
      subtitledVariableLengthListOfRuleInputsBackendDict.rule_inputs,
      subtitledVariableLengthListOfRuleInputsBackendDict.content_id);
  }

  createDefault(
      ruleInputs: InteractionRuleInputs[], contentId: string
  ): SubtitledVariableLengthListOfRuleInputs {
    return new SubtitledVariableLengthListOfRuleInputs(ruleInputs, contentId);
  }
}

angular.module('oppia').factory(
  'SubtitledVariableLengthListOfRuleInputsObjectFactory',
  downgradeInjectable(SubtitledVariableLengthListOfRuleInputsObjectFactory));
