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

import { INumberWithUnitsBackendDict } from
  'domain/objects/NumberWithUnitsObjectFactory';
import { IFractionDict } from
  'domain/objects/FractionObjectFactory.ts';
/* eslint-disable max-len */
import { INote } from 'extensions/interactions/MusicNotesInput/directives/music-notes-input-rules.service';
import { IGraphBackendDict } from 'extensions/interactions/GraphInput/directives/graph-detail.service';
/* eslint-enable max-len */

export interface IBackendRuleDict {
  'inputs': IRuleInputs;
  'rule_type': string;
}

export type IRuleInput = (string | number | IFractionDict |
  INumberWithUnitsBackendDict | string[] | INote[] |
  number[] | IGraphBackendDict| string[][]);

export interface IRuleInputs {
  [propName: string]: IRuleInput;
}

export class Rule {
  type: string;
  inputs: IRuleInputs;

  constructor(type: string, inputs: IRuleInputs) {
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
  createNew(type: string, inputs: IRuleInputs): Rule {
    return new Rule(type, inputs);
  }

  createFromBackendDict(ruleDict: IBackendRuleDict): Rule {
    return new Rule(ruleDict.rule_type, ruleDict.inputs);
  }
}

angular.module('oppia').factory('RuleObjectFactory',
  downgradeInjectable(RuleObjectFactory));
