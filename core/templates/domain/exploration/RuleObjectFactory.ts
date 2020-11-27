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

const INTERACTION_SPECS = require('interactions/interaction_specs.json');

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
      if (this.inputs[ruleName] instanceof SubtitledSetOfNormalizedString) {
        inputsDict[ruleName] = (
          <SubtitledSetOfNormalizedString> this.inputs[ruleName]
        ).toBackendDict();
      } else if (this.inputs[ruleName] instanceof SubtitledSetOfUnicodeString) {
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
    return new Rule(type, inputs);
  }

  createFromBackendDict(
      ruleDict: RuleBackendDict, interactionId: string
  ): Rule {
    const ruleType = ruleDict.rule_type;
    const inputs = {};
    const inputsBackendDict = ruleDict.inputs;

    let ruleDescription = (
      INTERACTION_SPECS[interactionId].rule_descriptions[ruleType]);

    // Finds the parameters and sets them in ctrl.rule.inputs.
    const PATTERN = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
    while (true) {
      if (!ruleDescription.match(PATTERN)) {
        break;
      }
      const varName = ruleDescription.match(PATTERN)[1];
      let varType = null;
      if (ruleDescription.match(PATTERN)[2]) {
        varType = ruleDescription.match(PATTERN)[2].substring(1);
      }

      if (varType === 'SubtitledSetOfNormalizedString') {
        inputs[varName] = (
          this.subtitledSetOfNormalizedStringObjectFactory
            .createFromBackendDict(
              <SubtitledSetOfNormalizedStringBackendDict>
                inputsBackendDict[varName])
        );
      } else if (varType === 'SubtitledSetOfUnicodeString') {
        inputs[varName] = (
          this.subtitledSetOfUnicodeStringObjectFactory
            .createFromBackendDict(
              <SubtitledSetOfUnicodeStringBackendDict>
                inputsBackendDict[varName])
        );
      } else {
        inputs[varName] = varType;
      }

      ruleDescription = ruleDescription.replace(PATTERN, ' ');
    }


    return new Rule(ruleType, inputs);
  }
}

angular.module('oppia').factory('RuleObjectFactory',
  downgradeInjectable(RuleObjectFactory));
