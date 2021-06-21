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

import { LoggerService } from 'services/contextual/logger.service';
import { Schema, SchemaDefaultValueService } from 'services/schema-default-value.service';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { SubtitledUnicode } from 'domain/exploration/SubtitledUnicodeObjectFactory';

describe('Schema Default Value Service', () => {
  let sdvs: SchemaDefaultValueService;
  let ls: LoggerService;

  beforeEach(() => {
    sdvs = TestBed.inject(SchemaDefaultValueService);
    ls = TestBed.inject(LoggerService);
  });

  it('should get default value if schema has choices', () => {
    const schema = {
      choices: ['Choice 1']
    } as Schema;
    expect(sdvs.getDefaultValue(schema)).toBe('Choice 1');
  });

  it('should get default value if schema type is bool', () => {
    const schema = {
      type: 'bool'
    } as Schema;
    expect(sdvs.getDefaultValue(schema)).toBeFalse();
  });

  it('should get default value if schema type is unicode or html', () => {
    let schema = {
      type: 'unicode'
    } as Schema;
    expect(sdvs.getDefaultValue(schema)).toBe('');

    schema = {
      type: 'html'
    } as Schema;
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
    } as Schema;
    expect(sdvs.getDefaultValue(schema)).toEqual([false, 0]);

    let schema2 = {
      type: 'list',
      items: ''
    } as Schema;
    expect(sdvs.getDefaultValue(schema2)).toEqual([]);
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
    } as Schema;
    expect(sdvs.getDefaultValue(schema)).toEqual({
      property_1: false,
      property_2: '',
      property_3: 0
    });
  });

  it('should get default value if schema type is int or float', () => {
    let schema = {
      type: 'int'
    } as Schema;
    expect(sdvs.getDefaultValue(schema)).toBe(0);

    schema = {
      type: 'float'
    } as Schema;
    expect(sdvs.getDefaultValue(schema)).toBe(0);
  });

  it('should get default value if schema type SubtitledHtml', () => {
    let schema = {
      type: 'custom',
      obj_type: 'SubtitledHtml'
    } as Schema;
    expect(
      sdvs.getDefaultValue(schema)
    ).toEqual(new SubtitledHtml('', null));
  });

  it('should get default value if schema type is SubtitledUnicode', () => {
    let schema = {
      type: 'custom',
      obj_type: 'SubtitledUnicode'
    } as Schema;
    expect(
      sdvs.getDefaultValue(schema)
    ).toEqual(new SubtitledUnicode('', null));
  });

  it('should not get default value if schema type is invalid', () => {
    var loggerErrorSpy = spyOn(ls, 'error').and.callThrough();
    // This throws "{ type: "invalid"; }' is not assignable to type
    // 'Schema'". We need to suppress this error because 'type: 'invalid'
    // does not exist as a type in 'Schema', but we set it to an invalid
    // value in order to test validations.
    // @ts-expect-error
    const schema = {
      type: 'invalid'
    } as Schema;

    expect(() => sdvs.getDefaultValue(schema)).toThrowError('Invalid Schema');
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Invalid schema: ' + JSON.stringify(schema));
  });
});
