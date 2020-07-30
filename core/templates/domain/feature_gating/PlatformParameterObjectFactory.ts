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
 * @fileoverview Factory for creating PlatformParameter domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import {
  PlatformParameterRule,
  PlatformParameterRuleBackendDict,
  PlatformParameterRuleObjectFactory,
  PlatformParameterValue
} from 'domain/feature_gating/PlatformParameterRuleObjectFactory';
import {
  PlatformParameterMetadata,
  PlatformParameterMetadataObjectFactory,
  PlatformParameterMetadataBackendDict,
  FeatureFlagStage
} from 'domain/feature_gating/PlatformParameterMetadataObjectFactory';
import { PlatformParameterFilterType, ServerMode }
  from './PlatformParameterFilterObjectFactory';

export interface PlatformParameterBackendDict {
  'name': string;
  'description': string;
  'data_type': string;
  'rules': PlatformParameterRuleBackendDict[];
  'rule_schema_version': number;
  'default_value': PlatformParameterValue;
  'metadata': PlatformParameterMetadataBackendDict;
}

export class PlatformParameter {
  readonly name: string;
  readonly description: string;
  readonly dataType: string;
  readonly ruleSchemaVersion: number;
  readonly defaultValue: PlatformParameterValue;
  readonly metadata: PlatformParameterMetadata;
  rules: PlatformParameterRule[];

  constructor(
      name: string, description: string, dataType: string,
      rules: PlatformParameterRule[], ruleSchemaVersion: number,
      defaultValue: PlatformParameterValue,
      metadata: PlatformParameterMetadata) {
    this.name = name;
    this.description = description;
    this.dataType = dataType;
    this.rules = rules;
    this.ruleSchemaVersion = ruleSchemaVersion;
    this.defaultValue = defaultValue;
    this.metadata = metadata;
  }

  /**
   * Validates the PlatformParameter instance.
   *
   * @returns {string[]} The messages of issues found during validation,
   * if any.
   */
  validate(): string[] {
    let issues = [];
    for (const [index, rule] of this.rules.entries()) {
      if (!rule.hasServerModeFilter()) {
        issues.push(
          `All rules must have a server_mode filter, but the ${index + 1}-th` +
          ' rule doesn\'t.');
      }
    }

    if (this.metadata.isFeature) {
      issues = issues.concat(this.validateFeatureFlag());
    }

    return issues;
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

  /**
   * Validates the PlatformParameter instance when it's also a feature flag.
   *
   * @returns {string[]} The messages of issues found during validation,
   * if any.
   */
  private validateFeatureFlag(): string[] {
    const issues = [];
    for (const [ruleIndex, rule] of this.rules.entries()) {
      if (!rule.valueWhenMatched) {
        continue;
      }
      for (const [filterIndex, filter] of rule.filters.entries()) {
        if (filter.type === PlatformParameterFilterType.ServerMode) {
          const matchingModes = filter.conditions.map(([_, mode]) => mode);
          switch (this.metadata.featureStage) {
            case FeatureFlagStage.DEV:
              if (
                matchingModes.includes(ServerMode.Test.toString()) ||
                matchingModes.includes(ServerMode.Prod.toString())) {
                issues.push(
                  'Feature in dev stage cannot be enabled in test or ' +
                  'production environment, violated by the ' +
                  `${filterIndex + 1}-th filter of the ${ruleIndex + 1}-th` +
                  ' rule.'
                );
              }
              break;
            case FeatureFlagStage.TEST:
              if (matchingModes.includes(ServerMode.Prod.toString())) {
                issues.push(
                  'Feature in test stage cannot be enabled in production ' +
                  `environment, violated by the ${filterIndex + 1}-th filter` +
                  ` of the ${ruleIndex + 1}-th rule.`
                );
              }
              break;
            case FeatureFlagStage.PROD:
              break;
          }
        }
      }
    }
    return issues;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PlatformParameterObjectFactory {
  constructor(
    private platformParameterRuleObjectFactory:
      PlatformParameterRuleObjectFactory,
    private platformParameterMetadataObjectFactory:
      PlatformParameterMetadataObjectFactory) {}

  createFromBackendDict(
      backendDict: PlatformParameterBackendDict): PlatformParameter {
    return new PlatformParameter(
      backendDict.name,
      backendDict.description,
      backendDict.data_type,
      backendDict.rules.map(
        ruleDict => (
          this.platformParameterRuleObjectFactory.createFromBackendDict(
            ruleDict)
        )),
      backendDict.rule_schema_version,
      backendDict.default_value,
      this.platformParameterMetadataObjectFactory.createFromBackendDict(
        backendDict.metadata)
    );
  }
}

angular.module('oppia').factory(
  'PlatformParameterObjectFactory',
  downgradeInjectable(PlatformParameterRuleObjectFactory));
