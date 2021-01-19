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
 * @fileoverview Unit tests for the Exploration data backend api service.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { ExplorationDataBackendApiService } from './exploration-data-backend-api.service';

describe('Exploration data backend api service', () => {
  let edbas: ExplorationDataBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    edbas = TestBed.inject(ExplorationDataBackendApiService);
    httpTestingController = TestBed.inject(
      HttpTestingController
    );
  });

  it('should send a post request to discardDraft', fakeAsync(() => {
    edbas.discardDraft(
      '/createhandler/autosave_draft/0').subscribe(
      (res) => expect(res).toBe(1)
    );
    const req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    expect(req.request.method).toBe('POST');
    req.flush(1);
    flushMicrotasks();
  }));

  it('should send a put update exploration', fakeAsync(() => {
    edbas.saveChangeList(
      '/createhandler/autosave_draft/0', [], '1').subscribe(
      (res) => expect(res).toBe(1)
    );
    const req = httpTestingController.expectOne(
      '/createhandler/autosave_draft/0');
    expect(req.request.method).toBe('PUT');
    req.flush(1);
    flushMicrotasks();
  }));
});
