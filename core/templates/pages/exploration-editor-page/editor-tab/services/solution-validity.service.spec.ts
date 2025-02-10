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
 * @fileoverview Unit tests for Solution Validity Service.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {SolutionValidityService} from 'pages/exploration-editor-page/editor-tab/services/solution-validity.service';

describe('Solution Validity Service', () => {
  let svs: SolutionValidityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    svs = TestBed.inject(SolutionValidityService);
  });

  it('should store validity of the solution correctly', () => {
    // Initialize SolutionValidityService.
    svs.init(['State 1']);

    svs.updateValidity('State 1', true);
    expect(svs.isSolutionValid('State 1')).toBe(true);

    svs.deleteSolutionValidity('State 1');
    expect(Object.keys(svs.getAllValidities())).toEqual([]);

    svs.updateValidity('State 1', false);
    expect(svs.isSolutionValid('State 1')).toBe(false);
  });

  it('should rename stored validity state of the solution correctly', () => {
    // Initialize SolutionValidityService.
    svs.init(['State 1']);

    svs.updateValidity('State 1', true);
    expect(svs.isSolutionValid('State 1')).toBe(true);

    svs.onRenameState('State 2', 'State 1');
    expect(Object.keys(svs.getAllValidities())).toEqual(['State 2']);

    expect(svs.isSolutionValid('State 2')).toBe(true);
  });

  it('should return false if stateName is invalid', () => {
    svs.solutionValidities = {};
    svs.isSolutionValid('State 1');

    expect(svs.isSolutionValid('State 2')).toBeFalse();
  });
});
