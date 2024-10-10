// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for the Translation tab active content id service.
 */

import {EventEmitter} from '@angular/core';

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {TranslationTabActiveContentIdService} from 'pages/exploration-editor-page/translation-tab/services/translation-tab-active-content-id.service';
import {ExplorationStatesService} from '../../services/exploration-states.service';

describe('Translation tab active content id service', () => {
  let ttacis: TranslationTabActiveContentIdService;
  let explorationStatesService: ExplorationStatesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [],
    }).compileComponents();

    ttacis = TestBed.inject(TranslationTabActiveContentIdService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
  });

  it('should correctly set and get active content id', () => {
    expect(ttacis.getActiveContentId()).toBeNull();
    spyOn(
      explorationStatesService,
      'getAllContentIdsByStateName'
    ).and.returnValue(['content']);

    ttacis.setActiveContent('content', 'html');
    expect(ttacis.getActiveContentId()).toBe('content');
  });

  it('should throw error on setting invalid content id', () => {
    expect(() => {
      spyOn(
        explorationStatesService,
        'getAllContentIdsByStateName'
      ).and.returnValue(['content']);
      ttacis.setActiveContent('feedback_2', 'html');
    }).toThrowError('Invalid active content id: feedback_2');
  });

  it('should return data format correctly', () => {
    expect(ttacis.getActiveDataFormat()).toBeNull();
    spyOn(
      explorationStatesService,
      'getAllContentIdsByStateName'
    ).and.returnValue(['content']);
    ttacis.setActiveContent('content', 'html');
    expect(ttacis.getActiveDataFormat()).toBe('html');
  });

  it('should emit data format', () => {
    let mockquestionSessionEventEmitter = new EventEmitter();
    expect(ttacis.onActiveContentIdChanged).toEqual(
      mockquestionSessionEventEmitter
    );
  });
});
