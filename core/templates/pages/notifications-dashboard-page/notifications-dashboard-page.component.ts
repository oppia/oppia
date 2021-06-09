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
 * @fileoverview Component for the user's notifications dashboard.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { WindowRef } from 'services/contextual/window-ref.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { LoaderService } from 'services/loader.service';
import { NotificationsDashboardPageBackendApiService, Notification } from './notifications-dashboard-page-backend-api.service';

@Component({
  selector: 'oppia-notifications-dashboard-page',
  templateUrl: './notifications-dashboard-page.component.html'
})
export class NotificationsDashboardPageComponent {
  recentNotifications: Notification[] = [];
  jobQueuedMsec: number;
  lastSeenMsec: number;
  currentUsername: string;

  constructor(
    private notificationsDashboardPageBackendApiService:
    NotificationsDashboardPageBackendApiService,
    private dateTimeFormatService: DateTimeFormatService,
    private loaderService: LoaderService,
    private windowRef: WindowRef,
  ) {}

  getItemUrl(activityId: string, notificationType: string): string {
    return (
      '/create/' + activityId + (
        notificationType === 'feedback_thread' ? '#/feedback' : ''));
  }

  navigateToProfile($event: Event, username: string): void {
    $event.stopPropagation();
    this.windowRef.nativeWindow.location.href = '/profile/' + username;
  }

  getLocaleAbbreviatedDatetimeString(millisSinceEpoch: number): string {
    return this.dateTimeFormatService
      .getLocaleAbbreviatedDatetimeString(millisSinceEpoch);
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.notificationsDashboardPageBackendApiService.getNotificationDataAsync()
      .then((response) => {
        let data = response;
        this.recentNotifications = data.recent_notifications;
        this.jobQueuedMsec = data.job_queued_msec;
        this.lastSeenMsec = data.last_seen_msec || 0.0;
        this.currentUsername = data.username;
        this.loaderService.hideLoadingScreen();
      });
  }
}

angular.module('oppia').directive('oppiaNotificationsDashboardPage',
  downgradeComponent({ component: NotificationsDashboardPageComponent }));
