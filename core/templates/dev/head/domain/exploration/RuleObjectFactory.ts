// Copyright 2015 The Oppia Authors. All Rights Reserved.
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

export class Rule {
  type: string;
  // TODO(#7165): Replace 'any' with the exact type. This has been typed
  // as 'any' since 'inputs' is a complex object having varying types. A general
  // type needs to be found.
  inputs: any;
  constructor(type: string, inputs: any) {
    this.type = type;
    this.inputs = inputs;
  }
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a dict with underscore_cased keys which
  // gives tslint errors against underscore_casing in favor of camelCasing.
  toBackendDict(): any {
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
  createNew(type: string, inputs: any): Rule {
    return new Rule(type, inputs);
  }
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'ruleDict' is a dict with underscore_cased keys which
  // gives tslint errors against underscore_casing in favor of camelCasing.
  createFromBackendDict(ruleDict: any): Rule {
    return new Rule(ruleDict.rule_type, ruleDict.inputs);
  }
}

angular.module('oppia').factory(
  'RuleObjectFactory',
  downgradeInjectable(RuleObjectFactory));
