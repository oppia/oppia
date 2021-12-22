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
 * @fileoverview Unit tests for ExplorationCorrectnessFeedbackService
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ExplorationCorrectnessFeedbackService } from './/exploration-correctness-feedback.service';
import { ExplorationPropertyService } from './exploration-property.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Exploration Correctness Feedback Service', () => {
  let ecfs: ExplorationCorrectnessFeedbackService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ExplorationPropertyService
      ]
    });

    ecfs = TestBed.inject(ExplorationCorrectnessFeedbackService);
  });
  it('should my test', fakeAsync(() => {
    expect(ecfs._isValid("work")).toBe(true);
    expect(ecfs._isValid("")).toBe(false);
  }));
  // it('should toggle correctness feedback display', fakeAsync(() => {
  //   var isValidSpy = spyOn(
  //     ecfs, '_isValid').and.callThrough();

  //   // Function isEnabled() returns undefined in the first time.
  //   expect(ecfs.isEnabled()).toBeFalsy();

  //   ecfs.toggleCorrectnessFeedback();
  //   ecfs.isEnabled();
  //   tick();
  //   expect(ecfs.isEnabled()).toBe(true);

  //   ecfs.toggleCorrectnessFeedback();
  //   tick();
  //   expect(ecfs.isEnabled()).toBe(false);

  //   expect(isValidSpy).toHaveBeenCalledTimes(2);
  // }));
});
