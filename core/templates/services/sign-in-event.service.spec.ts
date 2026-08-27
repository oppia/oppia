// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SignInEventService.
 */

import {TestBed} from '@angular/core/testing';
import {SignInEventService} from 'services/sign-in-event.service';

describe('SignInEventService', () => {
  let signInEventService: SignInEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SignInEventService],
    });
    signInEventService = TestBed.inject(SignInEventService);
  });

  it('should be created', () => {
    expect(signInEventService).toBeTruthy();
  });

  it('should have an onUserSignIn EventEmitter', () => {
    expect(signInEventService.onUserSignIn).toBeTruthy();
  });

  it('should emit onUserSignIn event', () => {
    let eventEmitted = false;
    signInEventService.onUserSignIn.subscribe(() => {
      eventEmitted = true;
    });

    signInEventService.onUserSignIn.emit();

    expect(eventEmitted).toBe(true);
  });
});
