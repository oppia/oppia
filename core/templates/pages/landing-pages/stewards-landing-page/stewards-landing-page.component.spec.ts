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
 * @fileoverview Unit tests for stewardsLandingPage.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, async, TestBed, tick, fakeAsync } from
  '@angular/core/testing';

import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { StewardsLandingPageComponent } from
  'pages/landing-pages/stewards-landing-page/stewards-landing-page.component';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';

import { of, Observable } from 'rxjs';

class MockUrlService {
  getPathname(): string {
    return '/parents';
  }
}

class MockWindowRef {
  _window = {
    location: {
      _pathname: '',
      _href: '',
      get href() {
        return this._href;
      },
      set href(val) {
        this._href = val;
      },
      get pathname() {
        return this._pathname;
      },
      set pathname(val) {
        this._pathname = val;
      }
    },
    _innerWidth: 0,
    get innerWidth() {
      return this._innerWidth;
    },
    set innerWidth(val) {
      this._innerWidth = val;
    }
  };
  get nativeWindow() {
    return this._window;
  }
}


class MockWindowDimensionsService {
  constructor(
    private windowRef: MockWindowRef
  ) {}
  getWidth(): number {
    return this.windowRef.nativeWindow.innerWidth;
  }
  getResizeEvent(): Observable<Event> {
    return of(new Event('resize'));
  }
  isWindowNarrow(): boolean {
    let NORMAL_NAVBAR_CUTOFF_WIDTH_PX = 768;
    return this.getWidth() <= NORMAL_NAVBAR_CUTOFF_WIDTH_PX;
  }
}


let component: StewardsLandingPageComponent;
let fixture: ComponentFixture<StewardsLandingPageComponent>;

describe('Stewards Landing Page', () => {
  let siteAnalyticsService: SiteAnalyticsService = null;
  let windowRef: MockWindowRef;
  let windowDimensions: MockWindowDimensionsService;

  beforeEach(async(() => {
    windowRef = new MockWindowRef();
    windowDimensions = new MockWindowDimensionsService(windowRef);
    TestBed.configureTestingModule({
      declarations: [StewardsLandingPageComponent],
      providers: [
        SiteAnalyticsService,
        UrlInterpolationService,
        { provide: UrlService, useClass: MockUrlService },
        { provide: WindowRef, useValue: windowRef },
        { provide: WindowDimensionsService, useValue: windowDimensions }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    siteAnalyticsService = TestBed.get(SiteAnalyticsService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StewardsLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should change to parents tab', () => {
    component.ngOnInit();

    const activeTabName = 'Parents';
    component.setActiveTabName(activeTabName);

    expect(component.activeTabName).toBe(activeTabName);
    expect(component.buttonDefinitions).toEqual([{
      text: 'Browse Lessons',
      href: '/community-library'
    }, {
      text: 'Subscribe to our Newsletter',
      href: 'https://eepurl.com/g5v9Df'
    }]);
    expect(component.isActiveTab(activeTabName)).toBe(true);
    expect(component.isActiveTab('Teachers')).toBe(false);
    expect(component.isActiveTab('NGOs')).toBe(false);
    expect(component.isActiveTab('Volunteers')).toBe(false);

    expect(component.getActiveTabNameInSingularForm()).toBe('Parent');
  });

  it('should change to teachers tab', () => {
    component.ngOnInit();

    const activeTabName = 'Teachers';
    component.setActiveTabName(activeTabName);

    expect(component.activeTabName).toBe(activeTabName);
    expect(component.buttonDefinitions).toEqual([{
      text: 'Browse Lessons',
      href: '/community-library'
    }, {
      text: 'Subscribe to our Newsletter',
      href: 'https://eepurl.com/g5v9Df'
    }]);
    expect(component.isActiveTab(activeTabName)).toBe(true);
    expect(component.isActiveTab('Parents')).toBe(false);
    expect(component.isActiveTab('NGOs')).toBe(false);
    expect(component.isActiveTab('Volunteers')).toBe(false);

    expect(component.getActiveTabNameInSingularForm()).toBe('Teacher');
  });

  it('should change to nonprofits tab', () => {
    component.ngOnInit();

    const activeTabName = 'NGOs';
    component.setActiveTabName(activeTabName);

    expect(component.activeTabName).toBe(activeTabName);
    expect(component.buttonDefinitions).toEqual([{
      text: 'Get Involved',
      href: (
        'https://www.oppiafoundation.org/partnerships#get-in-touch')
    }, {
      text: 'Browse Lessons',
      href: '/community-library'
    }]);
    expect(component.isActiveTab(activeTabName)).toBe(true);
    expect(component.isActiveTab('Teachers')).toBe(false);
    expect(component.isActiveTab('Parents')).toBe(false);
    expect(component.isActiveTab('Volunteers')).toBe(false);

    expect(component.getActiveTabNameInSingularForm()).toBe('Nonprofit');
  });

  it('should change to volunteers tab', () => {
    component.ngOnInit();

    const activeTabName = 'Volunteers';
    component.setActiveTabName(activeTabName);

    expect(component.activeTabName).toBe(activeTabName);
    expect(component.buttonDefinitions).toEqual([{
      text: 'Browse Volunteer Opportunities',
      href: 'https://www.oppiafoundation.org/volunteer'
    }]);
    expect(component.isActiveTab(activeTabName)).toBe(true);
    expect(component.isActiveTab('Teachers')).toBe(false);
    expect(component.isActiveTab('Parents')).toBe(false);
    expect(component.isActiveTab('NGOs')).toBe(false);

    expect(component.getActiveTabNameInSingularForm()).toBe('Volunteer');
  });

  it('should not change button definitions when tab is invalid', () => {
    component.ngOnInit();

    const activeTabName = 'Invalid';
    expect(() => {
      component.setActiveTabName(activeTabName);
    }).toThrowError('Invalid tab name: ' + activeTabName);
    expect(component.activeTabName).toBe(activeTabName);
    expect(component.isActiveTab(activeTabName)).toBe(true);
    expect(component.isActiveTab('Parents')).toBe(false);
    expect(component.isActiveTab('Teachers')).toBe(false);
    expect(component.isActiveTab('NGOs')).toBe(false);
    expect(component.isActiveTab('Volunteers')).toBe(false);

    expect(() => {
      component.getActiveTabNameInSingularForm();
    }).toThrowError('Invalid active tab name: ' + activeTabName);
  });

  it('should click on active button', fakeAsync(() => {
    component.ngOnInit();
    const stewardsLandingPageEventSpy = spyOn(
      siteAnalyticsService, 'registerStewardsLandingPageEvent').and
      .callThrough();

    windowRef.nativeWindow.location.href = '';

    const activeTabName = 'Parents';
    const buttonDefinition = {
      text: 'Browse Lessons',
      href: '/community-library'
    };
    component.setActiveTabName(activeTabName);
    component.onClickButton(buttonDefinition);
    tick(150);
    fixture.detectChanges();

    expect(stewardsLandingPageEventSpy).toHaveBeenCalledWith(
      activeTabName, buttonDefinition.text);
    expect(component.isActiveTab(activeTabName)).toBe(true);
    expect(windowRef.nativeWindow.location.href).toBe(buttonDefinition.href);
  }));

  it('should get static image url', () => {
    expect(component.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image');
  });

  it('should get static subject image url', () => {
    expect(component.getStaticSubjectImageUrl('subject-file-name')).toBe(
      '/assets/images/subjects/subject-file-name.svg');
  });

  it('should set up active tab when init is called', () => {
    windowRef.nativeWindow.location.pathname = '/parents';
    windowRef.nativeWindow.innerWidth = 100;
    component.ngOnInit();

    expect(component.activeTabName).toBe('Parents');
    expect(component.isActiveTab('Parents')).toBe(true);
    expect(component.getActiveTabNameInSingularForm()).toBe('Parent');
    expect(component.buttonDefinitions).toEqual([{
      text: 'Browse Lessons',
      href: '/community-library'
    }, {
      text: 'Subscribe to our Newsletter',
      href: 'https://eepurl.com/g5v9Df'
    }]);
    expect(component.windowIsNarrow).toBe(true);
  });

  it('should check evalutes window is narrow on resize event', () => {
    windowRef.nativeWindow.location.pathname = '';
    windowRef.nativeWindow.innerWidth = 998;
    component.ngOnInit();
    expect(component.windowIsNarrow).toBe(false);
  });

  it('should evalutes window is not narrow on resize event', () => {
    windowRef.nativeWindow.location.pathname = '';
    windowRef.nativeWindow.innerWidth = 768;
    component.ngOnInit();
    expect(component.windowIsNarrow).toBe(true);
  });
});
