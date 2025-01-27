// Copyright 2025 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit test for Language banner service.
 */

import {TestBed} from '@angular/core/testing';
import {LanguageBannerService} from './language-banner.service';
import {CookieService} from 'ngx-cookie';
import {AppConstants} from 'app.constants';

describe('LanguageBannerService', () => {
  let service: LanguageBannerService;
  let cookieService: jasmine.SpyObj<CookieService>;

  const COOKIE_NAME_COOKIES_ACKNOWLEDGED = 'OPPIA_COOKIES_ACKNOWLEDGED';
  const NUM_TIMES_REMAINING_TO_SHOW_LANGUAGE_BANNER =
    'NUM_TIMES_REMAINING_TO_SHOW_LANGUAGE_BANNER';

  beforeEach(() => {
    const cookieServiceSpy = jasmine.createSpyObj('CookieService', [
      'get',
      'put',
      'remove',
    ]);

    TestBed.configureTestingModule({
      providers: [
        LanguageBannerService,
        {provide: CookieService, useValue: cookieServiceSpy},
      ],
    });

    service = TestBed.inject(LanguageBannerService);
    cookieService = TestBed.inject(
      CookieService
    ) as jasmine.SpyObj<CookieService>;
  });

  it('should return false if cookies are not acknowledged', () => {
    cookieService.get.and.returnValue(null);

    const result = service.hasAcceptedCookies();

    expect(result).toBeFalse();
    expect(cookieService.get).toHaveBeenCalledWith(
      COOKIE_NAME_COOKIES_ACKNOWLEDGED
    );
  });

  it('should return false if cookie timestamp is outdated', () => {
    cookieService.get.and.returnValue(
      AppConstants.COOKIE_POLICY_LAST_UPDATED_MSECS - 10000
    );

    const result = service.hasAcceptedCookies();

    expect(result).toBeFalse();
  });

  it('should return true if cookies are acknowledged and up-to-date', () => {
    cookieService.get.and.returnValue(
      AppConstants.COOKIE_POLICY_LAST_UPDATED_MSECS + 10000
    );

    const result = service.hasAcceptedCookies();

    expect(result).toBeTrue();
  });

  it('should reset banner count when removing language banner', () => {
    spyOn(service, 'hasAcceptedCookies').and.returnValue(true);
    spyOn(service, 'getNumRemainingTimesToShowLanguageBanner').and.returnValue(
      4
    );
    spyOn(service, 'setNumTimesRemainingToShowLanguageBanner');

    service.markLanguageBannerAsDismissed();

    expect(
      service.setNumTimesRemainingToShowLanguageBanner
    ).toHaveBeenCalledWith(0);
  });

  it('should set the language banner cookie number', () => {
    service.setNumTimesRemainingToShowLanguageBanner(4);

    expect(cookieService.put).toHaveBeenCalledWith(
      NUM_TIMES_REMAINING_TO_SHOW_LANGUAGE_BANNER,
      '4'
    );
  });

  it('should return the correct number from the language banner cookie', () => {
    cookieService.get.and.returnValue('3');

    const result = service.getNumRemainingTimesToShowLanguageBanner();

    expect(result).toBe(3);
  });

  it('should return 5 if the cookie value is invalid', () => {
    cookieService.get.and.returnValue('invalid');

    const result = service.getNumRemainingTimesToShowLanguageBanner();

    expect(result).toBe(5);
  });
});
