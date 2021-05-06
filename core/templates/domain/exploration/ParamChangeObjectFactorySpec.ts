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
 * @fileoverview Unit tests for ParamChangeObjectFactory.
 */

import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';

describe('Param Change Object Factory', () => {
  let pcof: ParamChangeObjectFactory;

  beforeEach(() => {
    pcof = new ParamChangeObjectFactory();
  });

  it('should create a param change object from backend dict', () => {
    const sampleData = {
      customization_args: {
        parse_with_jinja: false,
        value: '10'
      },
      generator_id: 'Copier',
      name: 'Param change from backend'
    };
    const paramChangeObject = (
      pcof.createFromBackendDict(sampleData));

    expect(paramChangeObject.toBackendDict()).toEqual(sampleData);
  });

  it('should reset a copier custom customization args from param change ' +
    'object', () => {
    const sampleData = {
      customization_args: {
        parse_with_jinja: false,
        value: ''
      },
      generator_id: 'Copier',
      name: 'Reset copier custom customization args'
    };
    const paramChangeObject = (
      pcof.createFromBackendDict(sampleData));
    paramChangeObject.resetCustomizationArgs();

    expect(paramChangeObject.toBackendDict()).toEqual({
      customization_args: {
        parse_with_jinja: true,
        value: '5'
      },
      generator_id: 'Copier',
      name: 'Reset copier custom customization args'
    });
  });

  it('should reset a random selector custom customization args from param ' +
    'change object', () => {
    const sampleData = {
      customization_args: {
        parse_with_jinja: false,
        value: '10'
      },
      generator_id: 'RandomSelector',
      name: 'Reset random selector custom customization args'
    };
    const paramChangeObject = (
      pcof.createFromBackendDict(sampleData));
    paramChangeObject.resetCustomizationArgs();

    expect(paramChangeObject.toBackendDict()).toEqual({
      customization_args: {
        list_of_values: ['sample value']
      },
      generator_id: 'RandomSelector',
      name: 'Reset random selector custom customization args'
    });
  });

  it('should create an empty param change object', () => {
    const emptyParamChangeObject = (
      pcof.createEmpty('param'));

    expect(emptyParamChangeObject.toBackendDict()).toEqual({
      customization_args: {
        parse_with_jinja: true,
        value: '',
      },
      generator_id: 'Copier',
      name: 'param'
    });
  });

  it('should create a default param change object', () => {
    const emptyParamChangeObject = (
      pcof.createDefault('param'));

    expect(emptyParamChangeObject.toBackendDict()).toEqual({
      customization_args: {
        parse_with_jinja: true,
        value: '5',
      },
      generator_id: 'Copier',
      name: 'param'
    });
  });
});
