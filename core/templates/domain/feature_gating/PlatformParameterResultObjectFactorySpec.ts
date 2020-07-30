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
 * @fileoverview Unit tests for PlatformParameterResultObjectFactory.
 */

import { TestBed } from '@angular/core/testing';
import { PlatformParameterResultObjectFactory } from
  './PlatformParameterResultObjectFactory';

fdescribe('PlatformParameterRuleObjectFactory', () => {
  let factory: PlatformParameterResultObjectFactory;

  beforeEach(() => {
    factory = TestBed.get(PlatformParameterResultObjectFactory);
  });

  it('should create an instance from a backend dict.', () => {
    const result = factory.createFromBackendDict({
      feature_name_a: true,
      param_name_b: 'string value'
    });

    expect(result.data.size).toBe(2);
  });

  it('should convert an instance back to a dict.', () => {
    const backendDict = {
      feature_name_a: true,
      param_name_b: 'string value'
    };
    const result = factory.createFromBackendDict(backendDict);
    expect(result.toBackendDict()).toEqual(backendDict);
  });

  describe('.getPlatformParameterValue', () => {
    it('should return the value of the parameter', () => {
      const result = factory.createFromBackendDict({
        feature_name_a: true,
        param_name_b: 'string value'
      });

      expect(result.getPlatformParameterValue('feature_name_a')).toBeTrue();
      expect(result.getPlatformParameterValue('param_name_b')).toEqual(
        'string value');
    });

    it('should throws if the parameter does not exist.', () => {
      const result = factory.createFromBackendDict({
        feature_name_a: true,
        param_name_b: 'string value'
      });

      expect(
        () => result.getPlatformParameterValue('invalid_name')
      ).toThrowError('Platform parameter \'invalid_name\' not exists.');
    });
  });
});
