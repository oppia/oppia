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
 * @fileoverview Backend Api Service for notifications dashboard page.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export interface Notification {
  type: string,
  'activity_id': string,
  'activity_title': string,
  'author_id': string,
  subject: string
}

export interface NotificationsDashboardBackendDict {
  'is_admin': boolean,
  'is_moderator': boolean,
  'is_super_admin': boolean,
  'is_topic_manager': boolean,
  'job_queued_msec': number,
  'last_seen_msec': number,
  'recent_notifications': Notification[]
  'user_email': string,
  'username': string
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsDashboardPageBackendApiService {
  constructor(
    private httpClient: HttpClient
  ) {}

  async getNotificationDataAsync(): Promise<
    NotificationsDashboardBackendDict> {
    return this.httpClient.get<NotificationsDashboardBackendDict>
    ('/notificationsdashboardhandler/data').toPromise();
  }
}

angular.module('oppia').factory('NotificationsDashboardPageBackendApiService',
  downgradeInjectable(NotificationsDashboardPageBackendApiService));
