// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Param Specs object factory.
 */

import { TestBed } from '@angular/core/testing';

import { ParamSpecObjectFactory } from
  'domain/exploration/ParamSpecObjectFactory.ts';
import { ParamSpecsObjectFactory } from
  'domain/exploration/ParamSpecsObjectFactory.ts';

describe('ParamSpecs', () => {
  let paramSpecsObjectFactory: ParamSpecsObjectFactory = null;
  let paramSpecObjectFactory: ParamSpecObjectFactory = null;
  var emptyParamSpecs = null;
  var paramName = 'x';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ParamSpecsObjectFactory]
    });

    paramSpecsObjectFactory = TestBed.get(ParamSpecsObjectFactory);
    paramSpecObjectFactory = TestBed.get(ParamSpecObjectFactory);
    emptyParamSpecs = paramSpecsObjectFactory.createFromBackendDict({});
  });

  it('should be undefined for missing param names', () => {
    expect(emptyParamSpecs.getParamDict()[paramName]).not.toBeDefined();
  });

  it('should add param when missing', () => {
    var paramSpec = paramSpecObjectFactory.createDefault();

    expect(emptyParamSpecs.addParamIfNew(paramName, paramSpec)).toBe(true);
    // No longer empty.
    expect(emptyParamSpecs.getParamDict()[paramName]).toBe(paramSpec);
  });

  it('should not overwrite existing params', () => {
    var oldParamSpec = paramSpecObjectFactory.createDefault();
    expect(emptyParamSpecs.addParamIfNew(paramName, oldParamSpec)).toBe(true);
    // No longer empty.
    expect(emptyParamSpecs.getParamDict()[paramName]).toBe(oldParamSpec);

    var newParamSpec = paramSpecObjectFactory.createDefault();
    expect(emptyParamSpecs.addParamIfNew(paramName, newParamSpec)).toBe(false);
    expect(emptyParamSpecs.getParamDict()[paramName]).not.toBe(newParamSpec);
    expect(emptyParamSpecs.getParamDict()[paramName]).toBe(oldParamSpec);
  });
});
