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
 * @fileoverview Unit tests for the player correctness feedback enabled service.
 */

import { TestBed } from '@angular/core/testing';

import { PlayerCorrectnessFeedbackEnabledService } from
  './player-correctness-feedback-enabled.service';

describe('Player correctness feedback enabled service', () => {
  let pcfes: PlayerCorrectnessFeedbackEnabledService = null;

  beforeEach(() => {
    pcfes = TestBed.get(PlayerCorrectnessFeedbackEnabledService);
  });

  it('should set correctness feedback value to true', () => {
    // Initially the value is false.
    expect(pcfes.isEnabled()).toBe(false);
    pcfes.init(true);
    expect(pcfes.isEnabled()).toBe(true);
  });

  it('should set correctness feedback value to false when set to true', () => {
    // Initially the value is false.
    // So, it is set to true first.
    pcfes.init(true);
    expect(pcfes.isEnabled()).toBe(true);
    pcfes.init(false);
    expect(pcfes.isEnabled()).toBe(false);
  });
});
