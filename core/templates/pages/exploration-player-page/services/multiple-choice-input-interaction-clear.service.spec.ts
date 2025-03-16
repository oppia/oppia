// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Item selection clear service.
 */

import {TestBed} from '@angular/core/testing';
import {MultipleChoiceInputSelectionClearService} from './multiple-choice-input-interaction-clear.service';

describe('ItemSelectionClearService', () => {
  let service: MultipleChoiceInputSelectionClearService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MultipleChoiceInputSelectionClearService],
    });
    service = TestBed.inject(MultipleChoiceInputSelectionClearService);
  });

  it('should initialize with a default value of false', done => {
    service.clearSelection$.subscribe(value => {
      expect(value).toBeFalse();
      done();
    });
  });

  it('should emit true when triggerClearSelection is called', done => {
    service.clearSelection$.subscribe(value => {
      if (value) {
        expect(value).toBeTrue();
        done();
      }
    });

    service.triggerClearSelection();
  });
});
