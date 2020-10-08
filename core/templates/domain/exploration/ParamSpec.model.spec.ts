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
 * @fileoverview Unit tests for ParamSpec model.
 */
import { ParamSpec } from 'domain/exploration/ParamSpec.model';
import { ParamTypeRegistry } from 'domain/exploration/ParamType.model';

describe('Param Spec Model', () => {
  let paramType;

  beforeEach(() => {
    paramType = ParamTypeRegistry.getDefaultType();
  });

  it('should create a param spec object from backend dict', () => {
    const paramSpecObject = ParamSpec.createFromBackendDict({
      obj_type: 'UnicodeString'
    });

    expect(paramSpecObject.getType()).toEqual(paramType);
    expect(paramSpecObject.toBackendDict()).toEqual({
      obj_type: 'UnicodeString'
    });
  });

  it('should create a param spec object from a non default type', () => {
    const paramType = ParamTypeRegistry.getTypeFromBackendName('UnicodeString');
    const paramSpecObject = ParamSpec.createFromBackendDict({
      obj_type: 'UnicodeString'
    });

    expect(paramSpecObject.getType()).toEqual(paramType);
    expect(paramSpecObject.toBackendDict()).toEqual({
      obj_type: 'UnicodeString'
    });
  });

  it('should not create a param spec objec from backend when obj_type ' +
    'is invalid', () => {
    expect(() => {
      ParamSpec.createFromBackendDict({
        obj_type: 'Invalid'
      });
    }).toThrowError('Invalid is not a registered parameter type.');
  });

  it('should create a default param spec object', () => {
    const paramSpecObject = ParamSpec.createDefault();

    expect(paramSpecObject.getType()).toEqual(paramType);
    expect(paramSpecObject.toBackendDict()).toEqual({
      obj_type: 'UnicodeString'
    });
  });
});
