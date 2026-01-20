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
 * @fileoverview Unit tests for the footer donate volunteer component.
 */

import {
  ComponentFixture,
  TestBed,
  waitForAsync,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA, Pipe, PipeTransform} from '@angular/core';

import {FooterDonateVolunteerComponent} from './footer-donate-volunteer.component';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {NavbarAndFooterGATrackingPages} from 'app.constants';

@Pipe({name: 'translate'})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

class MockWindowRef {
  nativeWindow = {
    location: {
      href: '',
    },
    gtag: () => {},
    open: jasmine.createSpy('open'),
  };
}

class MockSiteAnalyticsService {
  registerClickFooterButtonEvent(page: string): void {}
}

describe('FooterDonateVolunteerComponent', () => {
  let component: FooterDonateVolunteerComponent;
  let fixture: ComponentFixture<FooterDonateVolunteerComponent>;
  let siteAnalyticsService: SiteAnalyticsService;
  let mockWindowRef: MockWindowRef;

  beforeEach(waitForAsync(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [FooterDonateVolunteerComponent, MockTranslatePipe],
      providers: [
        {provide: WindowRef, useValue: mockWindowRef},
        {provide: SiteAnalyticsService, useClass: MockSiteAnalyticsService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterDonateVolunteerComponent);
    component = fixture.componentInstance;
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should register click listeners and handle donate click correctly', fakeAsync(() => {
    const analyticsSpy = spyOn(
      siteAnalyticsService,
      'registerClickFooterButtonEvent'
    );

    const donateLink = document.createElement('a');
    donateLink.setAttribute('href', '/donate');
    donateLink.textContent = 'Donate';

    spyOn(fixture.nativeElement, 'querySelector').and.callFake(
      (selector: string) => {
        if (selector === 'a[href="/donate"]') {
          return donateLink;
        }
        return null;
      }
    );

    component.ngAfterViewInit();
    tick();

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    donateLink.dispatchEvent(clickEvent);

    expect(analyticsSpy).toHaveBeenCalledWith(
      NavbarAndFooterGATrackingPages.DONATE
    );
    expect(mockWindowRef.nativeWindow.location.href).toBe('/donate');
  }));

  it('should register click listeners and handle volunteer click correctly', fakeAsync(() => {
    const analyticsSpy = spyOn(
      siteAnalyticsService,
      'registerClickFooterButtonEvent'
    );

    const volunteerLink = document.createElement('a');
    volunteerLink.setAttribute('href', '/volunteer');
    volunteerLink.textContent = 'Volunteer';

    spyOn(fixture.nativeElement, 'querySelector').and.callFake(
      (selector: string) => {
        if (selector === 'a[href="/volunteer"]') {
          return volunteerLink;
        }
        return null;
      }
    );

    component.ngAfterViewInit();
    tick();

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    volunteerLink.dispatchEvent(clickEvent);

    expect(analyticsSpy).toHaveBeenCalledWith(
      NavbarAndFooterGATrackingPages.VOLUNTEER
    );
    expect(mockWindowRef.nativeWindow.location.href).toBe('/volunteer');
  }));

  it('should navigate to donate page when method is called directly', () => {
    const analyticsSpy = spyOn(
      siteAnalyticsService,
      'registerClickFooterButtonEvent'
    );
    component.navigateToDonatePage();
    expect(analyticsSpy).toHaveBeenCalledWith(
      NavbarAndFooterGATrackingPages.DONATE
    );
    expect(mockWindowRef.nativeWindow.location.href).toBe('/donate');
  });

  it('should navigate to volunteer page when method is called directly', () => {
    const analyticsSpy = spyOn(
      siteAnalyticsService,
      'registerClickFooterButtonEvent'
    );
    component.navigateToVolunteerPage();
    expect(analyticsSpy).toHaveBeenCalledWith(
      NavbarAndFooterGATrackingPages.VOLUNTEER
    );
    expect(mockWindowRef.nativeWindow.location.href).toBe('/volunteer');
  });

  it('should not throw error if links are missing in DOM', fakeAsync(() => {
    spyOn(fixture.nativeElement, 'querySelector').and.returnValue(null);

    expect(() => {
      component.ngAfterViewInit();
      tick();
    }).not.toThrowError();
  }));
});
