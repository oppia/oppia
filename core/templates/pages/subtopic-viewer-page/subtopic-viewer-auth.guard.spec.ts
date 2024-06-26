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
 * @fileoverview Tests for SubtopicCiewerAuthGuard
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';

import {SubtopicViewerAuthGuard} from './subtopic-viewer-auth.guard';

describe('SubtopicViewerAuthGuard', () => {
  let guard: SubtopicViewerAuthGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    }).compileComponents();

    guard = TestBed.inject(SubtopicViewerAuthGuard);
  });

  it('should allow users to access the subtopic viewer page', async () => {
    expect(await guard.canActivate()).toBeTrue();
  });
});
