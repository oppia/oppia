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
import { Injectable, Pipe, EventEmitter } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { TranslateService } from 'services/translate.service';
import { TeachPageComponent } from './teach-page.component';
import { UserBackendApiService } from 'services/user-backend-api.service';
import { LoaderService } from 'services/loader.service.ts';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';

@Pipe({name: 'translate'})
class MockTranslatePipe {
  transform(value: string, params: Object | undefined):string {
    return value;
  }
}
class MockTranslateService {
  languageCode = 'es';
  use(newLanguageCode: string): string {
    this.languageCode = newLanguageCode;
    return this.languageCode;
  }
}
class MockI18nLanguageCodeService {
  codeChangeEventEmiiter = new EventEmitter<string>();
  getCurrentI18nLanguageCode() {
    return 'en';
  }

  get onI18nLanguageCodeChange() {
    return this.codeChangeEventEmiiter;
  }
}

describe('Teach Page', () => {
  const siteAnalyticsServiceStub = new SiteAnalyticsService(
    new WindowRef());
  const windowDimensionServiceStub = new WindowDimensionsService(new WindowRef())
  var userBackendApiService: UserBackendApiService;
  var loaderService:LoaderService;
  var subscriptions = [];
  var loadingMessage = '';
  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [TeachPageComponent, MockTranslatePipe],
      providers: [
        {
          provide: I18nLanguageCodeService,
          useClass: MockI18nLanguageCodeService
        },
        { provide: TranslateService, useClass: MockTranslateService },
        {provide: SiteAnalyticsService, useValue: siteAnalyticsServiceStub},
        UrlInterpolationService,
        {
          provide: WindowRef,
          useValue: {
            nativeWindow: {
              location: {
                href: ''
              }
            }
          }
        }
      ]
    }).compileComponents();
  });
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $timeout = $injector.get('$timeout');
    $q = $injector.get('$q'); 
  }));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  let component;

  beforeEach(() => {
    const teachPageComponent = TestBed.createComponent(TeachPageComponent);
    component = teachPageComponent.componentInstance;
    subscriptions.push(loaderService.onLoadingMessageChange.subscribe(
      (message: string) => loadingMessage = message
    ))
  });
  
  it('should successfully instantiate the component from beforeEach block',
    () => {
      expect(component).toBeDefined();
    });

  it('should get static image url', function() {
    expect(component.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image');
  });
  it('should set component properties when ngOnInit() is called', () => {
    component.ngOnInit();

    expect(component.windowIsNarrow()).toBe(true);
    expect(component.donateImgUrl).toBe(
      '/assets/images/general/opp_donate_text.svg');
  });
  it('should record analytics when Start Learning is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerClickStartLearningButtonEvent')
      .and.callThrough();
      component.onClickStartLearningButton();
      expect(siteAnalyticsServiceStub.registerClickStartLearningButtonEvent)
      .toHaveBeenCalledWith();
  });

  it('should record analytics when Visit Classroom is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerClickVisitClassroomButtonEvent')
      .and.callThrough();
      component.onClickVisitClassroomButton();
      expect(siteAnalyticsServiceStub.registerClickVisitClassroomButtonEvent)
      .toHaveBeenCalledWith();
  });


  it('should record analytics when Browse Library is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerClickBrowseLibraryButtonEvent')
      .and.callThrough();
    component.onClickBrowseLibraryButton();
    expect(siteAnalyticsServiceStub.registerClickBrowseLibraryButtonEvent).toHaveBeenCalledWith();
  });

  it('should record analytics when Guide For Parents is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerClickGuideParentsButtonEvent')
      .and.callThrough();
    component.onClickGuideParentsButton();
    expect(siteAnalyticsServiceStub.registerClickGuideParentsButtonEvent).toHaveBeenCalledWith();
  });

  it('should record analytics when Tips For Parents is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerClickTipforParentsButtonEvent')
      .and.callThrough();
    component.onClickTipforParentsButton();
    expect(siteAnalyticsServiceStub.registerClickTipforParentsButtonEvent).toHaveBeenCalledWith();
  });

  it('should record analytics when Explore Lessons is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerClickExploreLessonsButtonEvent')
      .and.callThrough();
    component.onClickExploreLessonsButton();
    expect(siteAnalyticsServiceStub.registerClickExploreLessonsButtonEvent).toHaveBeenCalledWith();
  });

  it('should check if window is narrow', function() {
    spyOn(
      windowDimensionServiceStub, 'isWindowNarrow').and.returnValues(false, true);
    expect(component.isWindowNarrow()).toBe(false);
    expect(component.isWindowNarrow()).toBe(true);
  });

  it('should increment and decrement testimonial IDs correctly', function() {
    component.ngOnInit();
    expect(component.displayedTestimonialId).toBe(0);
    component.incrementDisplayedTestimonialId();
    expect(component.displayedTestimonialId).toBe(1);
    component.incrementDisplayedTestimonialId();
    component.incrementDisplayedTestimonialId();
    component.incrementDisplayedTestimonialId();
    expect(component.displayedTestimonialId).toBe(0);

    component.decrementDisplayedTestimonialId();
    expect(component.displayedTestimonialId).toBe(3);
    component.decrementDisplayedTestimonialId();
    expect(component.displayedTestimonialId).toBe(2);
  });

  it('should get testimonials correctly', function() {
    component.ngOnInit();
    expect(component.getTestimonials().length).toBe(component.testimonialCount);
  });

  it('should evaluate if user is logged in', function() {
    spyOn(userBackendApiService, 'getUserInfoAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve({
        isLoggedIn: function() {
          return true;
        }
      });
      return deferred.promise;
    });

    component.ngOnInit();
    expect(component.userIsLoggedIn).toBe(null);
    expect(component.classroomUrl).toBe('/learn/math');
    expect(loadingMessage).toBe('Loading');

    // $scope.$digest();
    // expect(component.userIsLoggedIn).toBe(true);
    // expect(loadingMessage).toBe('');
  // });

  // it('should evaluate if user is not logged in', function() {
  //   spyOn(userBackendApiService, 'getUserInfoAsync').and.callFake(function() {
  //     var deferred = $q.defer();
  //     deferred.resolve({
  //       isLoggedIn: function() {
  //         return false;
  //       }
  //     });
  //     return deferred.promise;
  //   });

  //   $scope.$digest();
  //   expect(component.userIsLoggedIn).toBe(false);
  //   expect(loadingMessage).toBe('');
  // });
})
