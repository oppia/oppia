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
 * @fileoverview Unit Tests for delete account backend api service.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { WindowRef } from 'services/contextual/window-ref.service';
import { DeleteAccountBackendApiService } from './delete-account-backend-api.service';

class MockWindowRef {
  nativeWindow = {
    location: {
      href: 'pending-account-deletion'
    },
    gtag: () => {}
  };
}

describe('Delete Account Service', () => {
  let deleteAccountBackendApiService: DeleteAccountBackendApiService;
  let http: HttpTestingController;
  let httpTestingController: HttpTestingController;
  let windowRef: WindowRef;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
      ]
    });
  });

  beforeEach(() => {
    deleteAccountBackendApiService =
     TestBed.inject(DeleteAccountBackendApiService);
    windowRef = TestBed.inject(WindowRef);
    http = TestBed.inject(HttpTestingController);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should delete account when closing the modal', fakeAsync(() => {
    deleteAccountBackendApiService.deleteAccount();

    let req = http.expectOne('/delete-account-handler');
    expect(req.request.method).toEqual('DELETE');
    req.flush(null);

    flushMicrotasks();
    tick(150);

    expect(windowRef.nativeWindow.location.href).toBe(
      '/logout?redirect_url=/pending-account-deletion');
  }));
});
