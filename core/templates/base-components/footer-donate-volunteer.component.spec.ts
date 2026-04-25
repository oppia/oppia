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
 * @fileoverview Unit tests for footer donate volunteer components.
 */

import {
  ComponentFixture,
  TestBed,
  waitForAsync,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {FooterDonateVolunteerComponent} from './footer-donate-volunteer.component';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {NavbarAndFooterGATrackingPages} from 'app.constants';
import {Renderer2, ElementRef} from '@angular/core';

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/learn/math',
      href: '',
    },
    gtag: () => {},
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
      declarations: [MockTranslatePipe, FooterDonateVolunteerComponent],
      providers: [
        {
          provide: WindowRef,
          useValue: mockWindowRef,
        },
        {
          provide: SiteAnalyticsService,
          useClass: MockSiteAnalyticsService,
        },
        {
          provide: Renderer2,
          useValue: {listen: () => () => {}},
        },
        {
          provide: ElementRef,
          useValue: {nativeElement: document.createElement('div')},
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterDonateVolunteerComponent);
    component = fixture.componentInstance;
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call setupClickListeners after view initialization', fakeAsync(() => {
    spyOn(component, 'setupClickListeners').and.callThrough();

    component.ngAfterViewInit();
    tick();

    expect(component.setupClickListeners).toHaveBeenCalled();
  }));

  it('should navigate to donate page and register analytics event', () => {
    spyOn(siteAnalyticsService, 'registerClickFooterButtonEvent');
    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    component.navigateToDonatePage();

    expect(
      siteAnalyticsService.registerClickFooterButtonEvent
    ).toHaveBeenCalledWith(NavbarAndFooterGATrackingPages.DONATE);

    expect(mockWindowRef.nativeWindow.location.href).toBe('/donate');
  });

  it('should navigate to volunteer page and register analytics event', () => {
    spyOn(siteAnalyticsService, 'registerClickFooterButtonEvent');

    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    component.navigateToVolunteerPage();

    expect(
      siteAnalyticsService.registerClickFooterButtonEvent
    ).toHaveBeenCalledWith(NavbarAndFooterGATrackingPages.VOLUNTEER);

    expect(mockWindowRef.nativeWindow.location.href).toBe('/volunteer');
  });

  it('should prevent default navigation for Donate link', fakeAsync(() => {
    const donateLink = document.createElement('a');
    donateLink.setAttribute('href', '/donate');
    component.el.nativeElement.appendChild(donateLink);
    component.ngAfterViewInit();
    tick();
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });

    const preventDefaultSpy = spyOn(event, 'preventDefault').and.callThrough();

    donateLink.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  }));

  it('should prevent default navigation for Volunteer link', fakeAsync(() => {
    const volunteerLink = document.createElement('a');
    volunteerLink.setAttribute('href', '/volunteer');
    component.el.nativeElement.appendChild(volunteerLink);
    component.ngAfterViewInit();
    tick();
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });

    const preventDefaultSpy = spyOn(event, 'preventDefault').and.callThrough();

    volunteerLink.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  }));

  it('should set up click listeners for Donate and Volunteer links', fakeAsync(() => {
    const donateLink = document.createElement('a');
    donateLink.setAttribute('href', '/donate');
    const volunteerLink = document.createElement('a');
    volunteerLink.setAttribute('href', '/volunteer');
    component.el.nativeElement.appendChild(donateLink);
    component.el.nativeElement.appendChild(volunteerLink);
    const rendererListenSpy = spyOn(
      component.renderer,
      'listen'
    ).and.callThrough();
    component.ngAfterViewInit();
    tick();

    expect(rendererListenSpy).toHaveBeenCalledWith(
      donateLink,
      'click',
      jasmine.any(Function)
    );
    expect(rendererListenSpy).toHaveBeenCalledWith(
      volunteerLink,
      'click',
      jasmine.any(Function)
    );

    expect(rendererListenSpy).toHaveBeenCalledTimes(2);
  }));
});
