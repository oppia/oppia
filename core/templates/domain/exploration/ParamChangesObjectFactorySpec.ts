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
 * @fileoverview unit tests for ParamChangesObjectFactory.
 */

import {TestBed} from '@angular/core/testing';

import {ParamChange} from 'domain/exploration/ParamChangeObjectFactory';
import {ParamChangesObjectFactory} from 'domain/exploration/ParamChangesObjectFactory';

describe('ParamChanges Object Factory', () => {
  let pcsof: ParamChangesObjectFactory;
  const cArgs = {
    parse_with_jinja: true,
    value: '',
  };
  const gId = 'Copier';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ParamChangesObjectFactory],
    });

    pcsof = TestBed.get(ParamChangesObjectFactory);
  });

  it('should create a ParamChange array from a list of dictionaries', () => {
    let paramName = 'param_1';
    let paramName2 = 'param_2';
    let backendList = [
      {
        customization_args: cArgs,
        generator_id: gId,
        name: paramName,
      },
      {
        customization_args: cArgs,
        generator_id: gId,
        name: paramName2,
      },
    ];

    let testOutcome: ParamChange[] = pcsof.createFromBackendList(backendList);

    expect(testOutcome.length).toBe(2);
    expect(testOutcome[0].customizationArgs).toEqual(cArgs);
    expect(testOutcome[0].generatorId).toBe(gId);
    expect(testOutcome[0].name).toBe(paramName);
    expect(testOutcome[1].customizationArgs).toEqual(cArgs);
    expect(testOutcome[1].generatorId).toBe(gId);
    expect(testOutcome[1].name).toBe(paramName2);
  });
});
