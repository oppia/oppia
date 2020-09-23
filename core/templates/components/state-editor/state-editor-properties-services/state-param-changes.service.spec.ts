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
 * @fileoverview Unit test for the State Param Changes service.
 */

import { TestBed } from '@angular/core/testing';
import { StateParamChangesService } from 'components/state-editor/state-editor-properties-services/state-param-changes.service.ts';

describe('State Param Changes service', () => {
  let spcs: StateParamChangesService = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StateParamChangesService]
    });

    spcs = TestBed.get(StateParamChangesService);
  });


  it('should call service constructor', () =>{
    expect(spcs.setterMethodKey).toBe('saveStateParamChanges');
  });
});
