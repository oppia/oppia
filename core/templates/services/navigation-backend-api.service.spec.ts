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
 * @fileoverview Unit tests for Navigation Backend Api Service
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { NavigationBackendApiService } from './navigation-backend-api.service';
import { Title } from '@angular/platform-browser';

describe('Navigation Backend Api Service', () => {
  let navigationBackendApiService: NavigationBackendApiService;
  let httpTestingController: HttpTestingController;
  let titleService: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NavigationBackendApiService]
    });

    navigationBackendApiService = (
      TestBed.inject(NavigationBackendApiService));
    httpTestingController = TestBed.inject(HttpTestingController);
    titleService = TestBed.inject(Title);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should show number of Unseen Notifications', fakeAsync(() => {
    let response = {
      num_unseen_notifications: 10
    };
    navigationBackendApiService.showUnseenNotifications();
    titleService.setTitle('home');
    expect(titleService.getTitle()).toEqual('home');
    navigationBackendApiService.numUnseenNotifications = 10;
    expect(navigationBackendApiService.numUnseenNotifications).toEqual(10);
    let req = httpTestingController.expectOne(
      '/notificationshandler');
    expect(req.request.method).toEqual('GET');
    req.flush(response);
    flushMicrotasks();

    expect(titleService.getTitle()).toBe('(10) home');
  }));
});
