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
 * @fileoverview Unit tests for the about page.
 */

import {TestBed} from '@angular/core/testing';

import {AboutPageComponent} from './about-page.component';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {MatIconModule} from '@angular/material/icon';
import {
  NgbAccordionModule,
  NgbModal,
  NgbModule,
} from '@ng-bootstrap/ng-bootstrap';
import {FullExpandAccordionComponent} from './accordion/full-expand-accordion.component';
import {PrimaryButtonComponent} from '../../components/button-directives/primary-button.component';
import {BarChartComponent} from './charts/bar-chart.component';
import {NO_ERRORS_SCHEMA, EventEmitter} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {DonationBoxModalComponent} from '../donate-page/donation-box/donation-box-modal.component';
import {ThanksForDonatingModalComponent} from '../donate-page/thanks-for-donating-modal.component';
import {of} from 'rxjs';
import {AppConstants} from '../../app.constants';

class MockWindowRef {
  nativeWindow = {
    location: {
      href: '',
      search: '',
    },
    sessionStorage: {
      last_uploaded_audio_lang: 'en',
      removeItem: (name: string) => {},
    },
    gtag: () => {},
  };
}

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
}

describe('About Page', () => {
  let windowRef: MockWindowRef;
  let component: AboutPageComponent;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let translateService: TranslateService;
  let windowDimensionsService: WindowDimensionsService;
  let siteAnalyticsService: SiteAnalyticsService;
  let ngbModal: NgbModal;
  let resizeEvent = new Event('resize');

  beforeEach(async () => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [NgbAccordionModule, NgbModule, MatIconModule],
      declarations: [
        AboutPageComponent,
        MockTranslatePipe,
        FullExpandAccordionComponent,
        PrimaryButtonComponent,
        BarChartComponent,
      ],
      providers: [
        SiteAnalyticsService,
        UrlInterpolationService,
        {
          provide: WindowRef,
          useValue: windowRef,
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
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
    const aboutPageComponent = TestBed.createComponent(AboutPageComponent);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    component = aboutPageComponent.componentInstance;
  });
  beforeEach(() => {
    translateService = TestBed.inject(TranslateService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    ngbModal = TestBed.inject(NgbModal);
    spyOn(ngbModal, 'open');
  });

  it('should successfully instantiate the component', () => {
    expect(component).toBeDefined();
  });

  it('should subscribe to translateService, windowDimensionsService on init', () => {
    spyOn(translateService.onLangChange, 'subscribe');
    const getResizeEventSpy = spyOn(
      windowDimensionsService,
      'getResizeEvent'
    ).and.returnValue({subscribe: jasmine.createSpy()});

    component.ngOnInit();

    expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
    expect(getResizeEventSpy().subscribe).toHaveBeenCalled();
  });

  it('should initialize with correct screen type and partnerships form link', () => {
    spyOn(component, 'setScreenType');
    spyOn(component, 'setPartnershipsFormLink');
    component.ngOnInit();
    expect(component.setScreenType).toHaveBeenCalled();
    expect(component.setPartnershipsFormLink).toHaveBeenCalled();
  });

  it('should set screen type to mobile when window width is less than or equal to 580', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(580);
    component.setScreenType();
    expect(component.screenType).toEqual('mobile');
  });

  it('should set screen type to tablet when window width is between 581 and 976', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(975);
    component.setScreenType();
    expect(component.screenType).toEqual('tablet');
  });

  it('should set screen type to desktop when window width is greater than 975', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(976);
    component.setScreenType();
    expect(component.screenType).toEqual('desktop');
  });

  it('should obtain new form link whenever the selected language changes', () => {
    component.ngOnInit();
    spyOn(component, 'setPartnershipsFormLink');
    translateService.onLangChange.emit();

    expect(component.setPartnershipsFormLink).toHaveBeenCalled();
  });

  it('should set the correct form link for English language', () => {
    translateService.currentLang = 'en';
    component.setPartnershipsFormLink();

    expect(component.partnershipsFormLink).toBe(
      AppConstants.PARTNERSHIPS_FORM_LINK
    );
  });

  it('should set the correct form link for Portuguese language', () => {
    translateService.currentLang = 'pt-br';
    const formLink =
      AppConstants.PARTNERSHIPS_FORM_TRANSLATED_LINK.PREFIX +
      'pt' +
      AppConstants.PARTNERSHIPS_FORM_TRANSLATED_LINK.SUFFIX;
    component.setPartnershipsFormLink();

    expect(component.partnershipsFormLink).toBe(formLink);
  });

  it('should set the correct form link for general languages', () => {
    translateService.currentLang = 'fr';
    const formLink =
      AppConstants.PARTNERSHIPS_FORM_TRANSLATED_LINK.PREFIX +
      'fr' +
      AppConstants.PARTNERSHIPS_FORM_TRANSLATED_LINK.SUFFIX;
    component.setPartnershipsFormLink();

    expect(component.partnershipsFormLink).toBe(formLink);
  });

  it(
    'should set english link for languages not supported by' + ' google forms',
    () => {
      translateService.currentLang = 'pcm';
      component.setPartnershipsFormLink();

      expect(component.partnershipsFormLink).toBe(
        AppConstants.PARTNERSHIPS_FORM_LINK
      );
    }
  );

  it('should ensure all items in featuresData array have panelIsCollapsed property as true', () => {
    expect(
      component.featuresData.every(item => item.panelIsCollapsed === true)
    ).toBeTrue();
  });

  it('should toggle the panels at given index', () => {
    component.expandPanel(1);
    expect(component.featuresData[1].panelIsCollapsed).toBeFalse();
    component.closePanel(1);
    expect(component.featuresData[1].panelIsCollapsed).toBeTrue();
  });

  it('should return correct static image url when calling getStaticImageUrl', () => {
    expect(component.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image'
    );
  });

  it('should return the correct image set', () => {
    const imageName = '/about/testImageName';
    const imageExt = 'png';

    const expectedImageSet =
      '/assets/images/about/testImageName1x.png 1x, ' +
      '/assets/images/about/testImageName15x.png 1.5x, ' +
      '/assets/images/about/testImageName2x.png 2x';

    const result = component.getImageSet(imageName, imageExt, [1, 1.5, 2]);

    expect(result).toBe(expectedImageSet);
  });

  it('should show thank you modal on query parameters change', () => {
    windowRef.nativeWindow.location.search = '';
    component.ngOnInit();
    expect(ngbModal.open).not.toHaveBeenCalled();

    windowRef.nativeWindow.location.search = '?random';
    component.ngOnInit();
    expect(ngbModal.open).not.toHaveBeenCalled();

    windowRef.nativeWindow.location.search = '?thanks';
    component.ngOnInit();
    expect(ngbModal.open).toHaveBeenCalledWith(
      ThanksForDonatingModalComponent,
      {
        backdrop: 'static',
        size: 'xl',
      }
    );
  });

  it('should open donation box modal', () => {
    component.openDonationBoxModal();

    expect(ngbModal.open).toHaveBeenCalledWith(DonationBoxModalComponent, {
      backdrop: 'static',
      size: 'xl',
      windowClass: 'donation-box-modal',
    });
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

  it('should move the correct volunteer carousel to the previous slide', () => {
    component.volunteerCarouselMobile = jasmine.createSpyObj('NgbCarousel', [
      'prev',
    ]);
    component.volunteerCarousel = jasmine.createSpyObj('NgbCarousel', ['prev']);

    component.screenType = 'mobile';
    component.moveCarouselToPreviousSlide();
    expect(component.volunteerCarouselMobile.prev).toHaveBeenCalled();

    component.screenType = 'desktop';
    component.moveCarouselToPreviousSlide();
    expect(component.volunteerCarousel.prev).toHaveBeenCalled();
  });

  it('should move the correct volunteer carousel to the next slide', () => {
    component.volunteerCarouselMobile = jasmine.createSpyObj('NgbCarousel', [
      'next',
    ]);
    component.volunteerCarousel = jasmine.createSpyObj('NgbCarousel', ['next']);

    component.screenType = 'mobile';
    component.moveCarouselToNextSlide();
    expect(component.volunteerCarouselMobile.next).toHaveBeenCalled();

    component.screenType = 'desktop';
    component.moveCarouselToNextSlide();
    expect(component.volunteerCarousel.next).toHaveBeenCalled();
  });

  it('should record analytics when Explore Lessons is clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerClickExploreLessonsButtonEvent'
    ).and.callThrough();
    component.onClickExploreLessonsButton();
    expect(
      siteAnalyticsService.registerClickExploreLessonsButtonEvent
    ).toHaveBeenCalled();
  });

  it('should register GA event when Download Android App is clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerClickGetAndroidAppButtonEvent'
    ).and.callThrough();
    component.onClickGetAndroidAppButton();
    expect(
      siteAnalyticsService.registerClickGetAndroidAppButtonEvent
    ).toHaveBeenCalled();
  });

  it('should register GA event when Donate CTA button is clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerClickDonateCTAButtonEvent'
    ).and.callThrough();
    component.onClickDonateCTAButton();
    expect(
      siteAnalyticsService.registerClickDonateCTAButtonEvent
    ).toHaveBeenCalled();
  });

  it('should register GA event when Volunteer CTA button is clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerClickVolunteerCTAButtonEvent'
    ).and.callThrough();
    component.onClickVolunteerCTAButton();
    expect(
      siteAnalyticsService.registerClickVolunteerCTAButtonEvent
    ).toHaveBeenCalledWith('CTA button at the bottom of the About page');
  });

  it('should register GA event when Partner CTA button is clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerClickPartnerCTAButtonEvent'
    ).and.callThrough();
    component.onClickPartnerCTAButton();
    expect(
      siteAnalyticsService.registerClickPartnerCTAButtonEvent
    ).toHaveBeenCalledWith('CTA button at the bottom of the About page');
  });

  it('should register GA event when Volunteer Learn More button is clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerClickLearnMoreVolunteerButtonEvent'
    ).and.callThrough();
    component.onClickVolunteerLearnMoreButton();
    expect(
      siteAnalyticsService.registerClickLearnMoreVolunteerButtonEvent
    ).toHaveBeenCalled();
  });

  it('should register GA event when Partner Learn More button is clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerClickLearnMorePartnerButtonEvent'
    ).and.callThrough();
    component.onClickPartnerLearnMoreButton();
    expect(
      siteAnalyticsService.registerClickLearnMorePartnerButtonEvent
    ).toHaveBeenCalled();
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
      AppConstants.LAST_PAGE_VIEW_TIME_LOCAL_STORAGE_KEYS_FOR_GA.ABOUT
    );
  });

  it('should unsubscribe on component destruction', () => {
    component.directiveSubscriptions.add(
      translateService.onLangChange.subscribe(() => {
        component.setScreenType();
      })
    );

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.closed).toBe(true);
  });
});
