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

export interface IBackendRuleDict {
  inputs: IRuleInput,
  'rule_type': string
}
// The rule inputs are dependent on the 'type' of rule
// that's why 'any' is used here
export interface IRuleInput {
  [propName: string]: any;
}

export class Rule {
  type: string;
  inputs: IRuleInput;

  constructor(type: string, inputs: IRuleInput) {
    this.type = type;
    this.inputs = inputs;
  }
  toBackendDict(): IBackendRuleDict {
    return {
      rule_type: this.type,
      inputs: this.inputs
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class RuleObjectFactory {
  createNew(type: string, inputs: IRuleInput): Rule {
    return new Rule(type, inputs);
  }

  createFromBackendDict(ruleDict: IBackendRuleDict): Rule {
    return new Rule(ruleDict.rule_type, ruleDict.inputs);
  }
}

angular.module('oppia').factory('RuleObjectFactory',
  downgradeInjectable(RuleObjectFactory));
