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
 * @fileoverview Frontend Model for Platform Parameter.
 */

import {
  PlatformParameterRule,
  PlatformParameterRuleBackendDict,
  PlatformParameterValue
} from 'domain/platform-parameter/platform-parameter-rule.model';

export enum FeatureStage {
  DEV = 'dev',
  TEST = 'test',
  PROD = 'prod',
}

export interface PlatformParameterBackendDict {
  'name': string;
  'description': string;
  'data_type': string;
  'rules': PlatformParameterRuleBackendDict[];
  'rule_schema_version': number;
  'default_value': PlatformParameterValue;
}

/**
 * Frontend domain object representation of platform parameters, which are used
 * to determine application behaviors based on environment context.
 *
 * On the frontend side, this class is used to reflect the edit made to
 * platform parameters in the admin page.
 */
export class PlatformParameter {
  readonly name: string;
  readonly description: string;
  readonly dataType: string;
  readonly ruleSchemaVersion: number;
  rules: PlatformParameterRule[];
  defaultValue: PlatformParameterValue;

  constructor(
      name: string, description: string, dataType: string,
      rules: PlatformParameterRule[], ruleSchemaVersion: number,
      defaultValue: PlatformParameterValue) {
    this.name = name;
    this.description = description;
    this.dataType = dataType;
    this.rules = rules;
    this.ruleSchemaVersion = ruleSchemaVersion;
    this.defaultValue = defaultValue;
  }

  static createFromBackendDict(
      backendDict: PlatformParameterBackendDict): PlatformParameter {
    return new PlatformParameter(
      backendDict.name,
      backendDict.description,
      backendDict.data_type,
      backendDict.rules.map(
        ruleDict => (
          PlatformParameterRule.createFromBackendDict(
            ruleDict)
        )),
      backendDict.rule_schema_version,
      backendDict.default_value
    );
  }

  /**
   * Creates a list of dict representations of rules in the parameter instance.
   *
   * @returns {PlatformParameterRuleBackendDict[]} - Array of dict
   * representations of the rules.
   */
  createBackendDictsForRules(): PlatformParameterRuleBackendDict[] {
    return this.rules.map(rule => rule.toBackendDict());
  }
}
