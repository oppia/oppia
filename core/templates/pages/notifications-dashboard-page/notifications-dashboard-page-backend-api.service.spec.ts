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
 * @fileoverview Unit tests for Backend Api Service for notifications dashboard
 *  page.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed, waitForAsync } from '@angular/core/testing';
import { NotificationsDashboardBackendDict, NotificationsDashboardPageBackendApiService } from './notifications-dashboard-page-backend-api.service';

describe('Notifications dashboard backend api service', () => {
  let notificationsDashboardPageBackendApiService:
  NotificationsDashboardPageBackendApiService;
  let httpTestingController: HttpTestingController;
  let expectedResponseData: NotificationsDashboardBackendDict = {
    is_admin: true,
    is_moderator: true,
    is_super_admin: true,
    is_topic_manager: false,
    job_queued_msec: 2000,
    last_seen_msec: 2000,
    recent_notifications: [],
    user_email: 'test_email',
    username: 'test'
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    notificationsDashboardPageBackendApiService = TestBed
      .inject(NotificationsDashboardPageBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should return promise with data', fakeAsync(() => {
    notificationsDashboardPageBackendApiService.getNotificationDataAsync()
      .then((responseData) => {
        expect(responseData).toEqual(responseData);
      });
    let req = httpTestingController
      .expectOne('/notificationsdashboardhandler/data');
    expect(req.request.method).toEqual('GET');
    req.flush(expectedResponseData);
    flushMicrotasks();
  }));
});
