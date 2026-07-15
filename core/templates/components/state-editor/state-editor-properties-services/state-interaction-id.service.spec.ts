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
 * @fileoverview Unit test for the state interaction id service.
 */

import {EventEmitter} from '@angular/core';
import {TestBed} from '@angular/core/testing';

import {
  StateInteractionIdService,
  // eslint-disable-next-line max-len
} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';

describe('State Interaction Id Service', () => {
  let stateInteractionIdService: StateInteractionIdService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StateInteractionIdService],
    });

    stateInteractionIdService = TestBed.get(StateInteractionIdService);
  });

  it('should fetch event emitter for change in interaction id', () => {
    let mockEventEmitter = new EventEmitter();
    expect(stateInteractionIdService.onInteractionIdChanged).toEqual(
      mockEventEmitter
    );
  });
});
