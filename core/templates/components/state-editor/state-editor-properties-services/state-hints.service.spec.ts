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
 * @fileoverview Unit test for the State Hints service.
 */

import {TestBed} from '@angular/core/testing';
import {Hint} from 'domain/exploration/hint-object.model';
import {StateHintsService} from 'components/state-editor/state-editor-properties-services/state-hints.service';

describe('State hints service', () => {
  let shs: StateHintsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StateHintsService],
    });

    shs = TestBed.get(StateHintsService);
  });

  it('should called the constructor', () => {
    expect(shs.displayed).toEqual([]);
    expect(shs.setterMethodKey).toBe('saveHints');
  });

  it('should called setActiveHintIndex after init', () => {
    spyOn(shs, 'setActiveHintIndex');
    const StateName = 'Introduction';
    const value = [
      {
        hint_content: {
          html: '<p>math</p>',
          content_id: 'hint_1',
        },
      },
    ].map(item => Hint.createFromBackendDict(item));
    shs.init(StateName, value);
    expect(shs.setActiveHintIndex).toHaveBeenCalled();
  });

  it('should set and get activeHintIndex correctly', () => {
    shs.setActiveHintIndex(1);
    expect(shs.getActiveHintIndex()).toBe(1);
    shs.setActiveHintIndex(2);
    expect(shs.getActiveHintIndex()).toBe(2);
    shs.setActiveHintIndex(3);
    expect(shs.getActiveHintIndex()).toBe(3);
    shs.setActiveHintIndex(4);
    expect(shs.getActiveHintIndex()).toBe(4);
    shs.setActiveHintIndex(5);
    expect(shs.getActiveHintIndex()).toBe(5);
  });
});
