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
 * @fileoverview Unit tests for SchemaDefaultValueService.
 */

import { TestBed } from '@angular/core/testing';
import { SchemaDefaultValueService } from
  'services/schema-default-value.service';
import { LoggerService } from 'services/contextual/logger.service';

describe('Schema Default Value Service', () => {
  let sdvs, ls;

  beforeEach(() => {
    sdvs = TestBed.get(SchemaDefaultValueService);
    ls = TestBed.get(LoggerService);
  });

  it('should get default value if schema has choices', () => {
    const schema = {
      choices: ['Choice 1']
    };
    expect(sdvs.getDefaultValue(schema)).toBe('Choice 1');
  });

  it('should get default value if schema type is bool', () => {
    const schema = {
      type: 'bool'
    };
    expect(sdvs.getDefaultValue(schema)).toBeFalse();
  });

  it('should get default value if schema type is unicode or html', () => {
    let schema = {
      type: 'unicode'
    };
    expect(sdvs.getDefaultValue(schema)).toBe('');

    schema = {
      type: 'html'
    };
    expect(sdvs.getDefaultValue(schema)).toBe('');
  });

  it('should get default value if schema type is list', () => {
    let schema = {
      type: 'list',
      items: [{
        type: 'bool'
      }, {
        type: 'int'
      }]
    };
    expect(sdvs.getDefaultValue(schema)).toEqual([false, 0]);
  });

  it('should get default value if schema type is dict', () => {
    const schema = {
      type: 'dict',
      properties: [{
        name: 'property_1',
        schema: {
          type: 'bool'
        }
      }, {
        name: 'property_2',
        schema: {
          type: 'unicode'
        }
      }, {
        name: 'property_3',
        schema: {
          type: 'int'
        }
      }]
    };
    expect(sdvs.getDefaultValue(schema)).toEqual({
      property_1: false,
      property_2: '',
      property_3: 0
    });
  });

  it('should get default value if schema type is int or float', () => {
    let schema = {
      type: 'int'
    };
    expect(sdvs.getDefaultValue(schema)).toBe(0);

    schema = {
      type: 'float'
    };
    expect(sdvs.getDefaultValue(schema)).toBe(0);
  });

  it('should not get default value if schema type is invalid', () => {
    var loggerErrorSpy = spyOn(ls, 'error').and.callThrough();
    const schema = {
      type: 'invalid'
    };

    expect(sdvs.getDefaultValue(schema)).toBeUndefined();
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Invalid schema type: invalid');
  });
});
