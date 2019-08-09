// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the number attempts service.
 */

import { NumberAttemptsService } from
  'pages/exploration-player-page/services/number-attempts.service';

describe('Number attempts service', () => {
  let numberAttemptsService: NumberAttemptsService;
  beforeEach(() => {
    numberAttemptsService = new NumberAttemptsService();
  });

  it('should increment number of attempts correctly', () => {
    numberAttemptsService.reset();
    expect(numberAttemptsService.getNumberAttempts()).toEqual(0);
    numberAttemptsService.submitAttempt();
    expect(numberAttemptsService.getNumberAttempts()).toEqual(1);
  });

  it('should properly reset the number of attempts to zero', () => {
    numberAttemptsService.submitAttempt();
    numberAttemptsService.reset();
    expect(numberAttemptsService.getNumberAttempts()).toEqual(0);
  });
});
