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
 * @fileoverview Unit tests for notificationsDashboardPage.
 */

import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { WindowRef } from 'services/contextual/window-ref.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { LoaderService } from 'services/loader.service';
import { NotificationsDashboardBackendDict, NotificationsDashboardPageBackendApiService } from './notifications-dashboard-page-backend-api.service';
import { NotificationsDashboardPageComponent } from './notifications-dashboard-page.component';

describe('Notifications Dasboard Page Component', () => {
  let fixture: ComponentFixture<NotificationsDashboardPageComponent>;
  let componentInstance: NotificationsDashboardPageComponent;
  let loaderService: LoaderService;
  let responseData: NotificationsDashboardBackendDict = {
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
  let mockWindowRef: MockWindowRef;
  let dateTimeFormatService: DateTimeFormatService;

  class MockNotificationsDashboardBackendApiService {
    async getNotificationDataAsync() {
      return {
        then: (
            successCallback: (
              response: NotificationsDashboardBackendDict) => void
        ) => {
          successCallback(responseData);
        }
      };
    }
  }

  class MockWindowRef {
    nativeWindow = {
      location: {
        href: ''
      }
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatCardModule
      ],
      declarations: [
        NotificationsDashboardPageComponent
      ],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        LoaderService,
        DateTimeFormatService,
        {
          provide: NotificationsDashboardPageBackendApiService,
          useClass: MockNotificationsDashboardBackendApiService
        }
      ]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationsDashboardPageComponent);
    componentInstance = fixture.componentInstance;
    loaderService = (TestBed.inject(LoaderService) as unknown) as
      jasmine.SpyObj<LoaderService>;
    mockWindowRef = (TestBed.inject(WindowRef) as unknown) as
      jasmine.SpyObj<MockWindowRef>;
    dateTimeFormatService = (TestBed.inject(
      DateTimeFormatService) as unknown) as
      jasmine.SpyObj<DateTimeFormatService>;
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', fakeAsync(() => {
    spyOn(loaderService, 'hideLoadingScreen');
    componentInstance.ngOnInit();
    flushMicrotasks();
    expect(componentInstance.recentNotifications)
      .toEqual(responseData.recent_notifications);
    expect(componentInstance.jobQueuedMsec)
      .toEqual(responseData.job_queued_msec);
    expect(componentInstance.lastSeenMsec)
      .toEqual(responseData.last_seen_msec);
    expect(componentInstance.currentUsername)
      .toEqual(responseData.username);
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
  }));

  it('should get item url', () => {
    let activityId: string = 'test_id';
    let notificationType: string = 'test_type';
    expect(componentInstance.getItemUrl(activityId, notificationType)).toEqual(
      '/create/' + activityId);
    expect(componentInstance.getItemUrl(activityId, 'feedback_thread')).toEqual(
      '/create/' + activityId + '#/feedback');
  });

  it('should navigate to profile', () => {
    let username: string = 'test';
    componentInstance.navigateToProfile(new Event('click'), username);
    expect(mockWindowRef.nativeWindow.location.href)
      .toEqual('/profile/' + username);
  });

  it('should get locale abbreviated date time string', () => {
    let testStr: string = 'test';
    spyOn(dateTimeFormatService, 'getLocaleAbbreviatedDatetimeString')
      .and.returnValue(testStr);
    expect(componentInstance.getLocaleAbbreviatedDatetimeString(123))
      .toEqual(testStr);
  });
});
