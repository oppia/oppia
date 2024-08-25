// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the teach page.
 */
import {EventEmitter, NO_ERRORS_SCHEMA, Renderer2} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {TeachPageComponent} from './teach-page.component';
import {LoaderService} from 'services/loader.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {UserInfo} from 'domain/user/user-info.model';
import {UserService} from 'services/user.service';
import {of} from 'rxjs';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {AppConstants} from '../../app.constants';
class MockWindowRef {
  _window = {
    location: {
      _href: '',
      get href() {
        return this._href;
      },
      set href(val) {
        this._href = val;
      },
      replace: (val: string) => {},
    },
    sessionStorage: {
      last_uploaded_audio_lang: 'en',
      removeItem: (name: string) => {},
    },
    gtag: () => {},
  };

  get nativeWindow() {
    return this._window;
  }
}

class MockI18nLanguageCodeService {
  codeChangeEventEmiiter = new EventEmitter<string>();
  getCurrentI18nLanguageCode() {
    return 'en';
  }

  isCurrentLanguageRTL() {
    return false;
  }

  get onI18nLanguageCodeChange() {
    return this.codeChangeEventEmiiter;
  }
}

describe('Teach Page', () => {
  let siteAnalyticsService: SiteAnalyticsService;
  let loaderService: LoaderService;
  let userService: UserService;
  let windowDimensionsService: WindowDimensionsService;
  let windowRef: MockWindowRef;
  let resizeEvent = new Event('resize');
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let renderer: Renderer2;

  beforeEach(async () => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [TeachPageComponent, MockTranslatePipe],
      providers: [
        {
          provide: I18nLanguageCodeService,
          useClass: MockI18nLanguageCodeService,
        },
        {
          provide: WindowRef,
          useValue: windowRef,
        },
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => of(resizeEvent),
            getWidth: () => 0,
          },
        },
        SiteAnalyticsService,
        UrlInterpolationService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });
  beforeEach(angular.mock.module('oppia'));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    loaderService = TestBed.get(LoaderService);
    userService = TestBed.get(UserService);
    windowDimensionsService = TestBed.get(WindowDimensionsService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
  });

  let component: TeachPageComponent;
  beforeEach(() => {
    let teachPageComponent = TestBed.createComponent(TeachPageComponent);
    component = teachPageComponent.componentInstance;
    component.creatorsCarouselContainer = {
      nativeElement: {
        clientWidth: 500,
        scrollLeft: 0,
        scrollWidth: 1000,
        addEventListener: (event: string, callback: () => void) => {},
        removeEventListener: (event: string, callback: () => void) => {},
      },
    };
    renderer = teachPageComponent.componentRef.injector.get(Renderer2);
  });

  it('should successfully instantiate the component from beforeEach block', () => {
    expect(component).toBeDefined();
  });

  it('should get static image url', () => {
    expect(component.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image'
    );
  });

  it('should set component properties when ngOnInit() is called', () => {
    spyOn(
      siteAnalyticsService,
      'registerFirstTimePageViewEvent'
    ).and.callThrough();
    component.ngOnInit();
    expect(component.displayedTestimonialId).toBe(0);
    spyOn(windowDimensionsService, 'isWindowNarrow').and.callThrough;
    expect(windowDimensionsService.isWindowNarrow()).toHaveBeenCalled;
    expect(component.isWindowNarrow).toBe(true);
    expect(
      siteAnalyticsService.registerFirstTimePageViewEvent
    ).toHaveBeenCalledWith(
      AppConstants.LAST_PAGE_VIEW_TIME_LOCAL_STORAGE_KEYS_FOR_GA.TEACH
    );
  });

  it('should toggle creators carousel arrows disablitiy after page is loaded', () => {
    component.ngOnInit();
    component.ngAfterViewInit();
    spyOn(component, 'toggleCreatorsCarouselArrowsDisablityStatusDesktop');
    spyOn(component, 'toggleCreatorsCarouselArrowsDisablityStatusMobile');
    component.setScreenType();
    expect(
      component.toggleCreatorsCarouselArrowsDisablityStatusDesktop
    ).toHaveBeenCalled();
    expect(
      component.toggleCreatorsCarouselArrowsDisablityStatusMobile
    ).toHaveBeenCalled();
  });

  it('should check if loader screen is working', () =>
    fakeAsync(() => {
      component.ngOnInit();
      spyOn(loaderService, 'showLoadingScreen').and.callThrough();
      expect(loaderService.showLoadingScreen).toHaveBeenCalledWith('Loading');
    }));

  it('should check if user is logged in or not', fakeAsync(() => {
    const UserInfoObject = {
      roles: ['EXPLORATION_EDITOR'],
      is_moderator: false,
      is_curriculum_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      email: 'test@test.com',
      user_is_logged_in: true,
    };
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(UserInfo.createFromBackendDict(UserInfoObject))
    );
    component.ngOnInit();
    flushMicrotasks();
    expect(component.userIsLoggedIn).toBe(true);
  }));

  it('should record analytics when Start Learning is clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerClickStartLearningButtonEvent'
    ).and.callThrough();
    component.onClickStartLearningButton();
    expect(
      siteAnalyticsService.registerClickStartLearningButtonEvent
    ).toHaveBeenCalled();
  });

  it('should record analytics when Visit Classroom is clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerClickVisitClassroomButtonEvent'
    ).and.callThrough();
    component.onClickVisitClassroomButton();
    expect(
      siteAnalyticsService.registerClickVisitClassroomButtonEvent
    ).toHaveBeenCalled();
  });

  it('should redirect to library page when Browse Library is clicked', () => {
    component.onClickBrowseLibraryButton();
    expect(windowRef.nativeWindow.location.href).toBe('/community-library');
  });

  it('should record analytics when Browse Library is clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerClickBrowseLibraryButtonEvent'
    ).and.callThrough();
    component.onClickBrowseLibraryButton();
    expect(
      siteAnalyticsService.registerClickBrowseLibraryButtonEvent
    ).toHaveBeenCalled();
  });

  it('should redirect to teach page when Guide For Parents is clicked', () => {
    component.onClickGuideParentsButton();
    expect(windowRef.nativeWindow.location.href).toBe('/teach');
  });

  it('should record analytics when Guide For Parents is clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerClickGuideParentsButtonEvent'
    ).and.callThrough();
    component.onClickGuideParentsButton();
    expect(
      siteAnalyticsService.registerClickGuideParentsButtonEvent
    ).toHaveBeenCalled();
  });

  it('should redirect to teach page when Tips For Parents is clicked', () => {
    component.onClickTipforParentsButton();
    expect(windowRef.nativeWindow.location.href).toBe('/teach');
  });

  it('should record analytics when Tips For Parents is clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerClickTipforParentsButtonEvent'
    ).and.callThrough();
    component.onClickTipforParentsButton();
    expect(
      siteAnalyticsService.registerClickTipforParentsButtonEvent
    ).toHaveBeenCalled();
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

  it('should regiester GA event when Download Android App is clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerClickGetAndroidAppButtonEvent'
    ).and.callThrough();
    component.onClickGetAndroidAppButton();
    expect(
      siteAnalyticsService.registerClickGetAndroidAppButtonEvent
    ).toHaveBeenCalled();
  });

  it('should direct users to the android page on click', function () {
    expect(windowRef.nativeWindow.location.href).not.toEqual('/android');

    component.onClickAccessAndroidButton();

    expect(windowRef.nativeWindow.location.href).toEqual('/android');
  });

  it('should set screen type to mobile when window width is less than or equal to 553', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(360);
    component.setScreenType();
    expect(component.screenType).toEqual('mobile');
  });

  it('should set screen type to tablet when window width is between 553 and 768', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(765);
    component.setScreenType();
    expect(component.screenType).toEqual('tablet');
  });

  it('should set screen type to desktop when window width is greater than 768', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(1280);
    component.setScreenType();
    expect(component.screenType).toEqual('desktop');
  });

  it('should not change arrows disabled status when screen type is desktop', () => {
    component.screenType = 'desktop';
    const initialLeftArrowStatus =
      component.creatorsCarouselLeftArrowIsDisabled;
    const initialRightArrowStatus =
      component.creatorsCarouselRightArrowIsDisabled;
    component.toggleCreatorsCarouselArrowsDisablityStatusMobile();
    expect(component.creatorsCarouselLeftArrowIsDisabled).toEqual(
      initialLeftArrowStatus
    );
    expect(component.creatorsCarouselRightArrowIsDisabled).toEqual(
      initialRightArrowStatus
    );
  });

  it(
    'should Creators Carousel arrows disablity Status correctly, ' +
      'when active slide index is 0 & screen is not desktop',
    () => {
      component.screenType = 'mobile';
      component.activeCreatorsSlideIndex = 0;
      component.toggleCreatorsCarouselArrowsDisablityStatusMobile();
      expect(component.creatorsCarouselLeftArrowIsDisabled).toBeTrue();
      expect(component.creatorsCarouselRightArrowIsDisabled).toBeFalse();
    }
  );

  it(
    'should Creators Carousel arrows disablity Status correctly, ' +
      'when active slide index is last & screen is not desktop',
    () => {
      component.screenType = 'mobile';
      component.activeCreatorsSlideIndex =
        component.creatorsIndicesObject.mobile.length - 1;
      component.toggleCreatorsCarouselArrowsDisablityStatusMobile();
      expect(component.creatorsCarouselLeftArrowIsDisabled).toBeFalse();
      expect(component.creatorsCarouselRightArrowIsDisabled).toBeTrue();
    }
  );

  it('should disable left arrow when scroll position is at start and screen is desktop', () => {
    component.screenType = 'desktop';
    component.toggleCreatorsCarouselArrowsDisablityStatusDesktop();
    expect(component.creatorsCarouselLeftArrowIsDisabled).toBeTrue();
  });

  it('should disable right arrow when scroll position is at end and screen is desktop', () => {
    component.screenType = 'desktop';
    component.creatorsCarouselContainer.nativeElement.scrollLeft = 500;
    component.toggleCreatorsCarouselArrowsDisablityStatusDesktop();
    expect(component.creatorsCarouselRightArrowIsDisabled).toBeTrue();
  });

  it('should not change arrows disabled status when screen type is not desktop', () => {
    component.screenType = 'mobile';
    const initialLeftArrowStatus =
      component.creatorsCarouselLeftArrowIsDisabled;
    const initialRightArrowStatus =
      component.creatorsCarouselRightArrowIsDisabled;
    component.toggleCreatorsCarouselArrowsDisablityStatusDesktop();
    expect(component.creatorsCarouselLeftArrowIsDisabled).toEqual(
      initialLeftArrowStatus
    );
    expect(component.creatorsCarouselRightArrowIsDisabled).toEqual(
      initialRightArrowStatus
    );
  });

  it('should set scrollLeft to 0 for desktop', () => {
    component.ngOnInit();
    component.ngAfterViewInit();
    component.screenType = 'desktop';
    spyOn(renderer, 'setProperty');
    component.showPreviousCreators();
    expect(renderer.setProperty).toHaveBeenCalledWith(
      jasmine.any(Object),
      'scrollLeft',
      0
    );
    expect(component.toggleCreatorsCarouselArrowsDisablityStatusDesktop)
      .toHaveBeenCalled;
  });

  it('should decrement activeCreatorsSlideIndex when screenType is not desktop and index is not 0', () => {
    component.ngOnInit();
    component.ngAfterViewInit();
    component.screenType = 'mobile';
    component.activeCreatorsSlideIndex = 1;
    component.showPreviousCreators();
    expect(component.activeCreatorsSlideIndex).toBe(0);
    expect(component.setActiveCreatorsIndices).toHaveBeenCalled;
    expect(component.toggleCreatorsCarouselArrowsDisablityStatusMobile)
      .toHaveBeenCalled;
  });

  it('should not decrement activeCreatorsSlideIndex when screenType is not desktop and index is 0', () => {
    component.ngOnInit();
    component.ngAfterViewInit();
    component.screenType = 'mobile';
    component.activeCreatorsSlideIndex = 0;
    component.showPreviousCreators();
    expect(component.activeCreatorsSlideIndex).toBe(0);
    expect(component.setActiveCreatorsIndices).not.toHaveBeenCalled;
    expect(component.toggleCreatorsCarouselArrowsDisablityStatusMobile).not
      .toHaveBeenCalled;
  });

  it('should set scrollLeft to scroll width for desktop for non RTL screen', () => {
    component.ngOnInit();
    component.ngAfterViewInit();
    component.screenType = 'desktop';
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      false
    );
    spyOn(renderer, 'setProperty');
    component.showNextCreators();
    expect(renderer.setProperty).toHaveBeenCalledWith(
      jasmine.any(Object),
      'scrollLeft',
      component.creatorsCarouselContainer.nativeElement.scrollWidth
    );
    expect(component.toggleCreatorsCarouselArrowsDisablityStatusDesktop)
      .toHaveBeenCalled;
  });

  it('should set scrollLeft to (-ve) of scroll width for desktop for RTL screen', () => {
    component.ngOnInit();
    component.ngAfterViewInit();
    component.screenType = 'desktop';
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );
    spyOn(renderer, 'setProperty');
    component.showNextCreators();
    expect(renderer.setProperty).toHaveBeenCalledWith(
      jasmine.any(Object),
      'scrollLeft',
      -component.creatorsCarouselContainer.nativeElement.scrollWidth
    );
    expect(component.toggleCreatorsCarouselArrowsDisablityStatusDesktop)
      .toHaveBeenCalled;
  });

  it('should increment activeCreatorsSlideIndex when screenType is not desktop and index is less than length', () => {
    component.ngOnInit();
    component.ngAfterViewInit();
    component.screenType = 'mobile';
    component.activeCreatorsSlideIndex = 0;
    component.showNextCreators();
    expect(component.activeCreatorsSlideIndex).toBe(1);
    expect(component.setActiveCreatorsIndices).toHaveBeenCalled;
    expect(component.toggleCreatorsCarouselArrowsDisablityStatusMobile)
      .toHaveBeenCalled;
  });

  it('should not decrement activeCreatorsSlideIndex when screenType is not desktop and index is 0', () => {
    component.ngOnInit();
    component.ngAfterViewInit();
    component.screenType = 'mobile';
    const lastIndex = component.creatorsIndicesObject.mobile.length - 1;
    component.activeCreatorsSlideIndex = lastIndex;
    component.showNextCreators();
    expect(component.activeCreatorsSlideIndex).toBe(lastIndex);
    expect(component.setActiveCreatorsIndices).not.toHaveBeenCalled;
    expect(component.toggleCreatorsCarouselArrowsDisablityStatusMobile).not
      .toHaveBeenCalled;
  });

  it('should set activeCreatorsIndices for mobile screen type', () => {
    component.screenType = 'tablet';
    component.activeCreatorsSlideIndex = 0;
    component.setActiveCreatorsIndices();
    expect(component.activeCreatorsIndices).toEqual([0, 1, 2]);
  });

  it('should set activeCreatorsIndices for desktop screen type', () => {
    component.screenType = 'mobile';
    component.activeCreatorsSlideIndex = 1;
    component.setActiveCreatorsIndices();
    expect(component.activeCreatorsIndices).toEqual([2, 3]);
  });

  it('should move the correct testimonials carousel to the previous slide', () => {
    component.testimonialsCarousel = jasmine.createSpyObj('NgbCarousel', [
      'prev',
    ]);

    component.moveTestimonialCarouselToPreviousSlide();
    expect(component.testimonialsCarousel.prev).toHaveBeenCalled();
  });

  it('should move the correct testimonials carousel to the next slide', () => {
    component.testimonialsCarousel = jasmine.createSpyObj('NgbCarousel', [
      'next',
    ]);

    component.moveTestimonialCarouselToNextSlide();
    expect(component.testimonialsCarousel.next).toHaveBeenCalled();
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

  it('should unsubscribe on component destruction', () => {
    component.directiveSubscriptions.add(
      windowDimensionsService.getResizeEvent().subscribe(() => {
        component.setScreenType();
      })
    );

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.closed).toBe(true);
  });
});
