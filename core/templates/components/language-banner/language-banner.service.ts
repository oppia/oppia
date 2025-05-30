// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to handle cookies for language banner.
 */

import {Injectable} from '@angular/core';
import {CookieService} from 'ngx-cookie';
import {AppConstants} from 'app.constants';

@Injectable({
  providedIn: 'root',
})
export class LanguageBannerService {
  COOKIE_NAME_COOKIES_ACKNOWLEDGED = 'OPPIA_COOKIES_ACKNOWLEDGED';
  NUM_TIMES_REMAINING_TO_SHOW_LANGUAGE_BANNER =
    'NUM_TIMES_REMAINING_TO_SHOW_LANGUAGE_BANNER';

  constructor(private cookieService: CookieService) {}

  hasAcceptedCookies(): boolean {
    let cookieSetDateMsecs = this.cookieService.get(
      this.COOKIE_NAME_COOKIES_ACKNOWLEDGED
    );
    if (
      !cookieSetDateMsecs ||
      Number(cookieSetDateMsecs) < AppConstants.COOKIE_POLICY_LAST_UPDATED_MSECS
    ) {
      return false;
    }
    return true;
  }

  markLanguageBannerAsDismissed(): void {
    if (
      this.hasAcceptedCookies() &&
      !(this.getNumRemainingTimesToShowLanguageBanner() === 0)
    ) {
      this.setNumTimesRemainingToShowLanguageBanner(0);
    }
  }

  setNumTimesRemainingToShowLanguageBanner(n: number): void {
    this.cookieService.put(
      this.NUM_TIMES_REMAINING_TO_SHOW_LANGUAGE_BANNER,
      String(n)
    );
  }

  getNumRemainingTimesToShowLanguageBanner(): number {
    let remainingShowcases = Number(
      this.cookieService.get(this.NUM_TIMES_REMAINING_TO_SHOW_LANGUAGE_BANNER)
    );
    return isNaN(remainingShowcases) ? 5 : remainingShowcases;
  }
}
