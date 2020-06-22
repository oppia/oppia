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
 * @fileoverview Unit tests for topicLandingPage.
 */

import { WindowRef } from 'services/contextual/window-ref.service';

require(
  'pages/landing-pages/topic-landing-page/topic-landing-page.component.ts');

describe('Topic Landing Page', function() {
  var ctrl = null;
  var $timeout = null, $window = null;
  var SiteAnalyticsService = null;
  var windowRef = new WindowRef();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('WindowRef', windowRef);
    $provide.value('PageTitleService', {
      setPageTitle: function() {}
    });
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $timeout = $injector.get('$timeout');
    $window = $injector.get('$window');
    SiteAnalyticsService = $injector.get('SiteAnalyticsService');

    ctrl = $componentController('topicLandingPage');
  }));

  it('should get information from topic identified at pathname', function() {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        pathname: '/math/ratios'
      }
    });
    ctrl.$onInit();

    expect(ctrl.subject).toBe('math');
    expect(ctrl.topicTitle).toBe('Ratios');
    expect(ctrl.lessons).toEqual([
      'What is a Ratio?',
      'Equivalent Ratios',
      'Ratios & Proportional Reasoning',
      'Writing Ratios in Simplest Form'
    ]);
    expect(ctrl.bookImageUrl).toBe('/assets/images/splash/books.svg');
    expect(ctrl.image1).toEqual({
      src_png: '/assets/images/landing/math/ratios/ratios_James.png',
      src_webp: '/assets/images/landing/math/ratios/ratios_James.webp',
      alt: 'A boy showing 2 is to 3 ratio on a card.'
    });
    expect(ctrl.image2).toEqual({
      src_png: '/assets/images/landing/math/ratios/ratios_question.png',
      src_webp: '/assets/images/landing/math/ratios/ratios_question.webp',
      alt: 'A smoothie shop and a card having question "What does a' +
      ' ratio tell us?" with options.'
    });
  });

  it('should get video url', function() {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        pathname: '/math/ratios'
      }
    });
    ctrl.$onInit();

    expect(ctrl.getVideoUrl()).toBe(
      '/assets/videos/landing/math/ratios/ratios_video.mp4');
  });

  it('should not get video url if it does not exist', function() {
    expect(function() {
      ctrl.getVideoUrl();
    }).toThrowError(
      'There is no video data available for this landing page.');
  });

  it('should click get started button', function() {
    var nativeWindowSpy = spyOnProperty(windowRef, 'nativeWindow');
    nativeWindowSpy.and.returnValue({
      location: {
        pathname: '/math/ratios'
      }
    });
    var analyticsSpy = spyOn(
      SiteAnalyticsService, 'registerOpenCollectionFromLandingPageEvent')
      .and.callThrough();
    // Get collection id from ratios.
    ctrl.$onInit();

    nativeWindowSpy.and.returnValue({
      location: ''
    });
    ctrl.onClickGetStartedButton();

    var ratiosCollectionId = '53gXGLIR044l';
    expect(analyticsSpy).toHaveBeenCalledWith(ratiosCollectionId);
    $timeout.flush(150);

    expect(windowRef.nativeWindow.location).toBe(
      '/collection/' + ratiosCollectionId);
  });

  it('should click learn more button', function() {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: ''
    });
    ctrl.onClickLearnMoreButton();
    $timeout.flush(150);

    expect(windowRef.nativeWindow.location).toBe('/');
  });

  it('should click exploration lessons button', function() {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: ''
    });
    ctrl.onClickExploreLessonsButton();
    $timeout.flush(150);

    expect(windowRef.nativeWindow.location).toBe('/community-library');
  });

  it('should have a tagline in the page title', function() {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        pathname: '/math/fractions'
      }
    });
    ctrl.$onInit();
    $timeout(() => {
      expect($window.document.title).toBe('Fractions | ' +
        'Add, Subtract, Multiply and Divide | Oppia');
    }, 150, false);
  });
});
