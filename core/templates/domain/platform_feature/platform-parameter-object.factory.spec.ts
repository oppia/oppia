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
 * @fileoverview Unit tests for PlatformParameterRuleObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import {
  PlatformParameterBackendDict,
  PlatformParameterObjectFactory
} from 'domain/platform_feature/platform-parameter-object.factory';
import {
  PlatformParameterFilterType,
  ServerMode
} from './platform-parameter-filter-object.factory';

describe('PlatformParameterObjectFactory', () => {
  let factory: PlatformParameterObjectFactory;

  beforeEach(() => {
    factory = TestBed.get(PlatformParameterObjectFactory);
  });

  it('should create an instance from a backend dict.', () => {
    const param = factory.createFromBackendDict({
      name: 'param name',
      description: 'This is a param for test.',
      data_type: 'string',
      rules: [
        {
          filters: [
            {
              type: PlatformParameterFilterType.ServerMode,
              conditions: [['=', ServerMode.Dev.toString()]]
            }
          ],
          value_when_matched: 'matched'
        }
      ],
      is_feature: false,
      feature_stage: null,
      rule_schema_version: 1,
      default_value: 'default value'
    });

    expect(param.name).toEqual('param name');
    expect(param.description).toEqual('This is a param for test.');
    expect(param.dataType).toEqual('string');
    expect(param.rules.length).toEqual(1);
    expect(param.ruleSchemaVersion).toEqual(1);
    expect(param.defaultValue).toEqual('default value');
  });

  it('should convert an instance back to a dict.', () => {
    const backendDict: PlatformParameterBackendDict = {
      name: 'param name',
      description: 'This is a param for test.',
      data_type: 'string',
      rules: [
        {
          filters: [
            {
              type: PlatformParameterFilterType.ServerMode,
              conditions: [['=', ServerMode.Dev.toString()]]
            }
          ],
          value_when_matched: 'matched'
        }
      ],
      is_feature: false,
      feature_stage: null,
      rule_schema_version: 1,
      default_value: 'default value'
    };

    const instance = factory.createFromBackendDict(backendDict);

    expect(instance.createBackendDictsForRules()).toEqual(backendDict.rules);
  });
});
