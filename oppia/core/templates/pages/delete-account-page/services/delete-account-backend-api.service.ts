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
 * @fileoverview Backend Api Service for Delete Account Page.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {WindowRef} from 'services/contextual/window-ref.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import analyticsConstants from 'analytics-constants';

@Injectable({
  providedIn: 'root',
})
export class DeleteAccountBackendApiService {
  constructor(
    private siteAnalyticsService: SiteAnalyticsService,
    private windowRef: WindowRef,
    private http: HttpClient
  ) {}

  deleteAccount(): void {
    this.http.delete('/delete-account-handler').subscribe(() => {
      this.siteAnalyticsService.registerAccountDeletion();
      setTimeout(
        () => {
          this.windowRef.nativeWindow.location.href =
            '/logout?redirect_url=/pending-account-deletion';
        },
        analyticsConstants.CAN_SEND_ANALYTICS_EVENTS ? 150 : 0
      );
    });
  }
}
