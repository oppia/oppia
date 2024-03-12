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
 * @fileoverview Unit tests for ParamSpecObjectFactory.
 */

import {TestBed} from '@angular/core/testing';

import {ParamSpecObjectFactory} from 'domain/exploration/ParamSpecObjectFactory';
import {
  ParamTypeObjectFactory,
  ParamType,
} from 'domain/exploration/ParamTypeObjectFactory';

describe('Param Spec Object Factory', () => {
  let psof: ParamSpecObjectFactory;
  let ptof: ParamTypeObjectFactory;
  let paramType: ParamType;

  beforeEach(() => {
    psof = TestBed.inject(ParamSpecObjectFactory);
    ptof = TestBed.inject(ParamTypeObjectFactory);

    paramType = ptof.getDefaultType();
  });

  it('should create a param spec object from backend dict', () => {
    const paramSpecObject = psof.createFromBackendDict({
      obj_type: 'UnicodeString',
    });

    expect(paramSpecObject.getType()).toEqual(paramType);
    expect(paramSpecObject.toBackendDict()).toEqual({
      obj_type: 'UnicodeString',
    });
  });

  it('should create a param spec objec from a non default type', () => {
    const paramType = ptof.getTypeFromBackendName('UnicodeString');
    const paramSpecObject = psof.createFromBackendDict({
      obj_type: 'UnicodeString',
    });

    expect(paramSpecObject.getType()).toEqual(paramType);
    expect(paramSpecObject.toBackendDict()).toEqual({
      obj_type: 'UnicodeString',
    });
  });

  it(
    'should not create a param spec objec from backend when obj_type ' +
      'is invalid',
    () => {
      expect(() => {
        psof.createFromBackendDict({
          obj_type: 'Invalid',
        });
      }).toThrowError('Invalid is not a registered parameter type.');
    }
  );

  it('should create a default param spec object', () => {
    const paramSpecObject = psof.createDefault();

    expect(paramSpecObject.getType()).toEqual(paramType);
    expect(paramSpecObject.toBackendDict()).toEqual({
      obj_type: 'UnicodeString',
    });
  });
});
