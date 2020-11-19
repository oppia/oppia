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
 * @fileoverview Factory for creating new frontend instances of Rule
 * domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { InteractionRuleInputs } from 'interactions/rule-input-defs';
import {
  SubtitledSetOfNormalizedString, SubtitledSetOfNormalizedStringBackendDict,
  SubtitledSetOfNormalizedStringObjectFactory
} from 'domain/exploration/SubtitledSetOfNormalizedStringObjectFactory';
import {
  SubtitledSetOfUnicodeString, SubtitledSetOfUnicodeStringBackendDict,
  SubtitledSetOfUnicodeStringObjectFactory
} from 'domain/exploration/SubtitledSetOfUnicodeStringObjectFactory';

export interface RuleBackendDict {
  'inputs': RuleInputs;
  'rule_type': string;
}

export interface RuleInputs {
  [propName: string]: InteractionRuleInputs;
}

export class Rule {
  type: string;
  inputs: RuleInputs;

  constructor(type: string, inputs: RuleInputs) {
    this.type = type;
    this.inputs = inputs;
  }
  toBackendDict(): RuleBackendDict {
    let inputsDict = {};

    Object.keys(this.inputs).forEach(ruleName => {
      if (this.inputs instanceof SubtitledSetOfNormalizedString) {
        inputsDict[ruleName] = (
          <SubtitledSetOfNormalizedString> this.inputs[ruleName]
        ).toBackendDict();
      } else if (this.inputs instanceof SubtitledSetOfUnicodeString) {
        inputsDict[ruleName] = (
          <SubtitledSetOfUnicodeString> this.inputs[ruleName]
        ).toBackendDict();
      } else {
        inputsDict[ruleName] = this.inputs[ruleName];
      }
    });

    return {
      rule_type: this.type,
      inputs: inputsDict
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class RuleObjectFactory {
  constructor(
      private subtitledSetOfNormalizedStringObjectFactory:
        SubtitledSetOfNormalizedStringObjectFactory,
      private subtitledSetOfUnicodeStringObjectFactory:
        SubtitledSetOfUnicodeStringObjectFactory
  ) {}

  createNew(type: string, inputs: RuleInputs): Rule {
    let ruleInputs = {};

    Object.keys(inputs).forEach(ruleName => {
      if ('content_id' in inputs[ruleName]) {
        if ('normalized_str_set' in inputs[ruleName]) {
          ruleInputs[ruleName] = (
            this.subtitledSetOfNormalizedStringObjectFactory
              .createFromBackendDict(
                <SubtitledSetOfNormalizedStringBackendDict> inputs[ruleName])
          );
        } else if ('unicode_str_set' in inputs[ruleName]) {
          ruleInputs[ruleName] = (
            this.subtitledSetOfUnicodeStringObjectFactory
              .createFromBackendDict(
                <SubtitledSetOfUnicodeStringBackendDict> inputs[ruleName])
          );
        }
      } else {
        ruleInputs[ruleName] = inputs[ruleName];
      }
    });
    console.log('here', ruleInputs);

    return new Rule(type, ruleInputs);
  }

  createFromBackendDict(ruleDict: RuleBackendDict): Rule {
    let inputs = {};

    Object.keys(ruleDict).forEach(ruleName => {
      if ('content_id' in ruleDict[ruleName]) {
        if ('normalized_str_set' in ruleDict[ruleName]) {
          inputs[ruleName] = (
            this.subtitledSetOfNormalizedStringObjectFactory
              .createFromBackendDict(ruleDict[ruleName])
          );
        } else if ('unicode_str_set' in ruleDict[ruleName]) {
          inputs[ruleName] = (
            this.subtitledSetOfUnicodeStringObjectFactory
              .createFromBackendDict(ruleDict[ruleName])
          );
        }
      } else {
        inputs[ruleName] = ruleDict[ruleName];
      }
    });

    return new Rule(ruleDict.rule_type, inputs);
  }
}

angular.module('oppia').factory('RuleObjectFactory',
  downgradeInjectable(RuleObjectFactory));
