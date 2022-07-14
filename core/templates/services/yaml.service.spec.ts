// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for YamlService.
 */

import { TestBed } from '@angular/core/testing';
import { YamlService } from './yaml.service';

describe('Yaml service', () => {
  let yamlService: YamlService;

  beforeEach(() => {
    yamlService = TestBed.inject(YamlService);
  });

  it('should stringify objects', () => {
    const objectToStringify = {
      someProperty: 'some property',
      someOtherProperty: {
        someSubProperty: 1,
        someOtherSubProperty: 'some other sub property',
        yetAnotherSubProperty: true
      }
    };
    const expectedYamlString = (
      'someProperty: some property\n' +
      'someOtherProperty:\n' +
      '  someSubProperty: 1\n' +
      '  someOtherSubProperty: some other sub property\n' +
      '  yetAnotherSubProperty: true\n'
    );

    const yamlString = yamlService.stringify(objectToStringify);

    expect(yamlString).toEqual(expectedYamlString);
  });

  it('should parse a yaml string to get the corresponding object', () => {
    const yamlString = (
      'someProperty: some property\n' +
      'someOtherProperty:\n' +
      '  someSubProperty: 1\n' +
      '  someOtherSubProperty: some other sub property\n' +
      '  yetAnotherSubProperty: true\n'
    );
    const expectedObject = {
      someProperty: 'some property',
      someOtherProperty: {
        someSubProperty: 1,
        someOtherSubProperty: 'some other sub property',
        yetAnotherSubProperty: true
      }
    };

    const parsedObject = yamlService.parse(yamlString);

    expect(expectedObject).toEqual(parsedObject);
  });
});
