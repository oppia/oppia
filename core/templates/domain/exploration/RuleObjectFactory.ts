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

export interface BackendRuleDict {
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
  toBackendDict(): BackendRuleDict {
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
  createNew(type: string, inputs: RuleInputs): Rule {
    return new Rule(type, inputs);
  }

  createFromBackendDict(ruleDict: BackendRuleDict): Rule {
    return new Rule(ruleDict.rule_type, ruleDict.inputs);
  }
}

angular.module('oppia').factory('RuleObjectFactory',
  downgradeInjectable(RuleObjectFactory));
