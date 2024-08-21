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
 * @fileoverview Unit tests for volunteer page.
 */

import {NO_ERRORS_SCHEMA, EventEmitter} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';
import {NgbCarouselConfig} from '@ng-bootstrap/ng-bootstrap';

import {VolunteerPageComponent} from './volunteer-page.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {PageTitleService} from 'services/page-title.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {AppConstants} from '../../app.constants';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {of} from 'rxjs';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

describe('Volunteer page', () => {
  let translateService: TranslateService;
  let pageTitleService: PageTitleService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let windowDimensionsService: WindowDimensionsService;
  let siteAnalyticsService: SiteAnalyticsService;
  let resizeEvent = new Event('resize');

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [VolunteerPageComponent, MockTranslatePipe],
      providers: [
        UrlInterpolationService,
        NgbCarouselConfig,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        PageTitleService,
        {
          provide: WindowDimensionsService,
          useValue: {
            getResizeEvent: () => of(resizeEvent),
            getWidth: () => 0,
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  let component: VolunteerPageComponent;

  beforeEach(() => {
    const volunteerPageComponent = TestBed.createComponent(
      VolunteerPageComponent
    );
    component = volunteerPageComponent.componentInstance;
    translateService = TestBed.inject(TranslateService);
    pageTitleService = TestBed.inject(PageTitleService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
  });

  it('should successfully instantiate the component from beforeEach block', () => {
    expect(component).toBeDefined();
  });

  it('should set component properties when ngOnInit() is called', () => {
    spyOn(translateService.onLangChange, 'subscribe');
    component.ngOnInit();

    expect(component.bannerImgPath).toBe('/volunteer/banner.webp');
    expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
  });

  it('should get static image url', () => {
    expect(component.getStaticImageUrl('/test')).toEqual('/assets/images/test');
  });

  it(
    'should obtain translated page title whenever the selected' +
      'language changes',
    () => {
      component.ngOnInit();
      spyOn(component, 'setPageTitle');
      translateService.onLangChange.emit();

      expect(component.setPageTitle).toHaveBeenCalled();
    }
  );

  it('should set new page title', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageTitleService, 'setDocumentTitle');
    component.setPageTitle();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_VOLUNTEER_PAGE_TITLE'
    );
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'I18N_VOLUNTEER_PAGE_TITLE'
    );
  });

  it('should get webp extended file name', () => {
    expect(component.getWebpExtendedName('a.jpg')).toEqual('a.webp');
    expect(component.getWebpExtendedName('a.png')).toEqual('a.webp');
    expect(component.getWebpExtendedName('a.webp')).toEqual('a.webp');
    expect(component.getWebpExtendedName('a.b.jpg')).toEqual('a.b.webp');
  });

  it('should increment activeTabGroupIndex', () => {
    component.activeTabGroupIndex = 0;
    component.tabGroups = {
      desktop: [[0, 1, 2, 3, 4]],
      tablet: [
        [0, 1, 2],
        [3, 4],
      ],
      mobile: [[0, 1], [2, 3], [4]],
      smallMobile: [[0], [1], [2], [3], [4]],
    };
    component.screenType = 'mobile';

    component.incrementTabGroupIndex();

    expect(component.activeTabGroupIndex).toBe(1);
  });

  it('should not increment activeTabGroupIndex past the end', () => {
    component.activeTabGroupIndex = 2;
    component.tabGroups = {
      desktop: [[0, 1, 2, 3, 4]],
      tablet: [
        [0, 1, 2],
        [3, 4],
      ],
      mobile: [[0, 1], [2, 3], [4]],
      smallMobile: [[0], [1], [2], [3], [4]],
    };
    component.screenType = 'mobile';

    component.incrementTabGroupIndex();

    expect(component.activeTabGroupIndex).toBe(2);
  });

  it('should decrement activeTabGroupIndex', () => {
    component.activeTabGroupIndex = 1;
    component.tabGroups = {
      desktop: [[0, 1, 2, 3, 4]],
      tablet: [
        [0, 1, 2],
        [3, 4],
      ],
      mobile: [[0, 1], [2, 3], [4]],
      smallMobile: [[0], [1], [2], [3], [4]],
    };
    component.screenType = 'mobile';

    component.decrementTabGroupIndex();

    expect(component.activeTabGroupIndex).toBe(0);
  });

  it('should not decrement activeTabGroupIndex past the start', () => {
    component.activeTabGroupIndex = 0;
    component.tabGroups = {
      desktop: [[0, 1, 2, 3, 4]],
      tablet: [
        [0, 1, 2],
        [3, 4],
      ],
      mobile: [[0, 1], [2, 3], [4]],
      smallMobile: [[0], [1], [2], [3], [4]],
    };
    component.screenType = 'mobile';

    component.decrementTabGroupIndex();

    expect(component.activeTabGroupIndex).toBe(0);
  });

  it('should get the correct RTL status if the current language is RTL', () => {
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );
    expect(component.isLanguageRTL()).toBeTrue();
  });

  it('should get the correct RTL status if the current language is not RTL', () => {
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      false
    );
    expect(component.isLanguageRTL()).toBeFalse();
  });

  it('should set screen type to mobile when window width is less than 440', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(360);
    component.setScreenType();
    expect(component.screenType).toEqual('smallMobile');
  });

  it('should set screen type to mobile when window width is less than 641', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(640);
    component.setScreenType();
    expect(component.screenType).toEqual('mobile');
  });

  it('should set screen type to tablet when window width is between 362 and 768', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(760);
    component.setScreenType();
    expect(component.screenType).toEqual('tablet');
  });

  it('should set screen type to desktop when window width is greater than 768', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(800);
    component.setScreenType();
    expect(component.screenType).toEqual('desktop');
  });

  it('should register GA event when top Volunteer CTA button is clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerClickVolunteerCTAButtonEvent'
    ).and.callThrough();
    component.onClickVolunteerCTAButtonAtTop();
    expect(
      siteAnalyticsService.registerClickVolunteerCTAButtonEvent
    ).toHaveBeenCalledWith('CTA button at the top of the Volunteer page');
  });

  it('should register GA event when bottom Volunteer CTA button is clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerClickVolunteerCTAButtonEvent'
    ).and.callThrough();
    component.onClickVolunteerCTAButtonAtBottom();
    expect(
      siteAnalyticsService.registerClickVolunteerCTAButtonEvent
    ).toHaveBeenCalledWith('CTA button at the bottom of the Volunteer page');
  });

  it('should register GA event when About Page is loaded', () => {
    spyOn(
      siteAnalyticsService,
      'registerFirstTimePageViewEvent'
    ).and.callThrough();
    component.registerFirstTimePageViewEvent();
    expect(
      siteAnalyticsService.registerFirstTimePageViewEvent
    ).toHaveBeenCalledWith(
      AppConstants.LAST_PAGE_VIEW_TIME_LOCAL_STORAGE_KEYS_FOR_GA.VOLUNTEER
    );
  });

  it('should unsubscribe on component destruction', () => {
    component.directiveSubscriptions.add(
      translateService.onLangChange.subscribe(() => {
        component.setPageTitle();
      })
    );
    component.ngOnDestroy();

    expect(component.directiveSubscriptions.closed).toBe(true);
  });
});
