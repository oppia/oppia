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

import isEqual from 'lodash/isEqual';

import {InteractionRuleInputs} from 'interactions/rule-input-defs';
import {
  BaseTranslatableObject,
  TranslatableField,
} from 'domain/objects/BaseTranslatableObject.model';

const INTERACTION_SPECS = require('interactions/interaction_specs.json');

export interface RuleBackendDict {
  inputs: RuleInputs;
  rule_type: string;
}

export interface RuleInputs {
  [propName: string]: InteractionRuleInputs;
}

export interface RuleInputTypes {
  [propName: string]: string;
}

export class Rule extends BaseTranslatableObject {
  type: string;
  inputs: RuleInputs;
  inputTypes: RuleInputTypes;

  constructor(type: string, inputs: RuleInputs, inputTypes: RuleInputTypes) {
    super();

    this.type = type;
    this.inputs = inputs;
    this.inputTypes = inputTypes;
  }

  getTranslatableFields(): TranslatableField[] {
    let translatableFields: TranslatableField[] = [];
    Object.keys(this.inputs).forEach(inputName => {
      const ruleInput = this.inputs[inputName];
      if (ruleInput && ruleInput.hasOwnProperty('contentId')) {
        // This throws Type error for ruleInput". We need to suppress this error
        // because the type for RuleInputs is incorrect and bypass flag can be
        // removed once we have correct type for RuleInputs.
        // @ts-ignore
        translatableFields.push(ruleInput);
      }
    });

    return translatableFields;
  }

  toBackendDict(): RuleBackendDict {
    return {
      rule_type: this.type,
      inputs: this.inputs,
    };
  }

  static createNew(
    type: string,
    inputs: RuleInputs,
    inputTypes: RuleInputTypes
  ): Rule {
    if (
      !isEqual(new Set(Object.keys(inputs)), new Set(Object.keys(inputTypes)))
    ) {
      throw new Error('The keys of inputs and inputTypes do not match.');
    }
    return new Rule(type, inputs, inputTypes);
  }

  static createFromBackendDict(
    ruleDict: RuleBackendDict,
    interactionId: string
  ): Rule {
    let ruleType = ruleDict.rule_type;
    let ruleInputTypes: RuleInputTypes = {};
    let ruleDescription = null;

    ruleDescription =
      INTERACTION_SPECS[interactionId].rule_descriptions[ruleType];

    const PATTERN = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
    while (ruleDescription.match(PATTERN)) {
      const varName: string = ruleDescription.match(PATTERN)[1];
      let varType = ruleDescription.match(PATTERN)[2];
      if (varType) {
        varType = varType.substring(1);
      }

      ruleInputTypes[varName] = varType;
      ruleDescription = ruleDescription.replace(PATTERN, ' ');
    }
    return new Rule(ruleType, ruleDict.inputs, ruleInputTypes);
  }
}
