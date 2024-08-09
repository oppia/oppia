// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for thanks for subscribing modal component.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {FooterDonateVolunteerComponent} from './footer-donate-volunteer.component';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {NavbarAndFooterGATrackingPages} from 'app.constants';

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/learn/math',
      href: '',
    },
    gtag: () => {},
  };
}

describe('Thanks for subscribing modal component', function () {
  let component: FooterDonateVolunteerComponent;
  let fixture: ComponentFixture<FooterDonateVolunteerComponent>;
  let siteAnalyticsService: SiteAnalyticsService;
  let mockWindowRef: MockWindowRef;

  beforeEach(waitForAsync(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [MockTranslatePipe, FooterDonateVolunteerComponent],
      providers: [
        {
          provide: WindowRef,
          useValue: mockWindowRef,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterDonateVolunteerComponent);
    component = fixture.componentInstance;
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
  });

  it('should register Volunteer footer link click event', () => {
    spyOn(siteAnalyticsService, 'registerClickFooterButtonEvent');
    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    component.navigateToVolunteerPage();

    expect(
      siteAnalyticsService.registerClickFooterButtonEvent
    ).toHaveBeenCalledWith(NavbarAndFooterGATrackingPages.VOLUNTEER);

    expect(mockWindowRef.nativeWindow.location.href).toBe('/volunteer');
  });
});
