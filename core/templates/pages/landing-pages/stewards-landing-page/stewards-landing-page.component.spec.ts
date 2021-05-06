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

import { WindowRef } from 'services/contextual/window-ref.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { UrlService } from
  'services/contextual/url.service';
import { of } from 'rxjs';

require(
  'pages/landing-pages/stewards-landing-page/' +
  'stewards-landing-page.component.ts');

describe('Stewards Landing Page', function() {
  var $scope = null, ctrl = null;
  var $timeout = null;
  var SiteAnalyticsService = null;
  var windowRef = new WindowRef();
  var windowDimensions = new WindowDimensionsService(windowRef);

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('WindowRef', windowRef);
    $provide.value('WindowDimensionsService', windowDimensions);
    $provide.value('UrlService', new UrlService(windowRef));
    $provide.value('UrlService', {
      getPathname: function() {
        return '/parents';
      }
    });
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $timeout = $injector.get('$timeout');
    SiteAnalyticsService = $injector.get('SiteAnalyticsService');

    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    ctrl = $componentController('stewardsLandingPage', {
      $scope: $scope
    });
  }));

  afterEach(function() {
    ctrl.$onDestroy();
  });

  it('should change to parents tab', function() {
    ctrl.$onInit();

    var activeTabName = 'Parents';
    ctrl.setActiveTabName(activeTabName);

    expect(ctrl.activeTabName).toBe(activeTabName);
    expect(ctrl.buttonDefinitions).toEqual([{
      text: 'Browse Lessons',
      href: '/community-library'
    }, {
      text: 'Subscribe to our Newsletter',
      href: 'https://eepurl.com/g5v9Df'
    }]);
    expect(ctrl.isActiveTab(activeTabName)).toBe(true);
    expect(ctrl.isActiveTab('Teachers')).toBe(false);
    expect(ctrl.isActiveTab('NGOs')).toBe(false);
    expect(ctrl.isActiveTab('Volunteers')).toBe(false);

    expect(ctrl.getActiveTabNameInSingularForm()).toBe('Parent');
  });

  it('should change to teachers tab', function() {
    ctrl.$onInit();

    var activeTabName = 'Teachers';
    ctrl.setActiveTabName(activeTabName);

    expect(ctrl.activeTabName).toBe(activeTabName);
    expect(ctrl.buttonDefinitions).toEqual([{
      text: 'Browse Lessons',
      href: '/community-library'
    }, {
      text: 'Subscribe to our Newsletter',
      href: 'https://eepurl.com/g5v9Df'
    }]);
    expect(ctrl.isActiveTab(activeTabName)).toBe(true);
    expect(ctrl.isActiveTab('Parents')).toBe(false);
    expect(ctrl.isActiveTab('NGOs')).toBe(false);
    expect(ctrl.isActiveTab('Volunteers')).toBe(false);

    expect(ctrl.getActiveTabNameInSingularForm()).toBe('Teacher');
  });

  it('should change to nonprofits tab', function() {
    ctrl.$onInit();

    var activeTabName = 'NGOs';
    ctrl.setActiveTabName(activeTabName);

    expect(ctrl.activeTabName).toBe(activeTabName);
    expect(ctrl.buttonDefinitions).toEqual([{
      text: 'Get Involved',
      href: (
        'https://www.oppiafoundation.org/partnerships#get-in-touch')
    }, {
      text: 'Browse Lessons',
      href: '/community-library'
    }]);
    expect(ctrl.isActiveTab(activeTabName)).toBe(true);
    expect(ctrl.isActiveTab('Teachers')).toBe(false);
    expect(ctrl.isActiveTab('Parents')).toBe(false);
    expect(ctrl.isActiveTab('Volunteers')).toBe(false);

    expect(ctrl.getActiveTabNameInSingularForm()).toBe('Nonprofit');
  });

  it('should change to volunteers tab', function() {
    ctrl.$onInit();

    var activeTabName = 'Volunteers';
    ctrl.setActiveTabName(activeTabName);

    expect(ctrl.activeTabName).toBe(activeTabName);
    expect(ctrl.buttonDefinitions).toEqual([{
      text: 'Browse Volunteer Opportunities',
      href: 'https://www.oppiafoundation.org/volunteer'
    }]);
    expect(ctrl.isActiveTab(activeTabName)).toBe(true);
    expect(ctrl.isActiveTab('Teachers')).toBe(false);
    expect(ctrl.isActiveTab('Parents')).toBe(false);
    expect(ctrl.isActiveTab('NGOs')).toBe(false);

    expect(ctrl.getActiveTabNameInSingularForm()).toBe('Volunteer');
  });

  it('should not change button definitions when tab is invalid', function() {
    ctrl.$onInit();

    var activeTabName = 'Invalid';
    expect(function() {
      ctrl.setActiveTabName(activeTabName);
    }).toThrowError('Invalid tab name: ' + activeTabName);
    expect(ctrl.activeTabName).toBe(activeTabName);
    expect(ctrl.isActiveTab(activeTabName)).toBe(true);
    expect(ctrl.isActiveTab('Parents')).toBe(false);
    expect(ctrl.isActiveTab('Teachers')).toBe(false);
    expect(ctrl.isActiveTab('NGOs')).toBe(false);
    expect(ctrl.isActiveTab('Volunteers')).toBe(false);

    expect(function() {
      ctrl.getActiveTabNameInSingularForm();
    }).toThrowError('Invalid active tab name: ' + activeTabName);
  });

  it('should click on active button', function() {
    ctrl.$onInit();
    var stewardsLandingPageEventSpy = spyOn(
      SiteAnalyticsService, 'registerStewardsLandingPageEvent').and
      .callThrough();
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: ''
    });

    var activeTabName = 'Parents';
    var buttonDefinition = {
      text: 'Browse Lessons',
      href: '/community-library'
    };
    ctrl.setActiveTabName(activeTabName);
    ctrl.onClickButton(buttonDefinition);
    $timeout.flush(1000);

    expect(stewardsLandingPageEventSpy).toHaveBeenCalledWith(
      activeTabName, buttonDefinition.text);
    expect(ctrl.isActiveTab(activeTabName)).toBe(true);
    expect(windowRef.nativeWindow.location).toBe(buttonDefinition.href);
  });

  it('should get static image url', function() {
    expect(ctrl.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image');
  });

  it('should get static subject image url', function() {
    expect(ctrl.getStaticSubjectImageUrl('subject-file-name')).toBe(
      '/assets/images/subjects/subject-file-name.svg');
  });

  it('should set up active tab when init is called', function() {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        pathname: '/parents'
      },
      innerWidth: 100
    });
    spyOn(windowDimensions, 'getResizeEvent').and.returnValue(
      of(new Event('resize')));
    ctrl.$onInit();

    expect(ctrl.activeTabName).toBe('Parents');
    expect(ctrl.isActiveTab('Parents')).toBe(true);
    expect(ctrl.getActiveTabNameInSingularForm()).toBe('Parent');
    expect(ctrl.buttonDefinitions).toEqual([{
      text: 'Browse Lessons',
      href: '/community-library'
    }, {
      text: 'Subscribe to our Newsletter',
      href: 'https://eepurl.com/g5v9Df'
    }]);
    expect(ctrl.windowIsNarrow).toBe(true);
  });

  it('should check evalutes window is narrow on resize event', function() {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        pathname: ''
      },
      innerWidth: 998
    });
    spyOn(windowDimensions, 'getResizeEvent').and.returnValue(
      of(new Event('resize')));
    ctrl.$onInit();
    expect(ctrl.windowIsNarrow).toBe(false);
  });

  it('should evalutes window is not narrow on resize event', function() {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        pathname: ''
      },
      innerWidth: 768
    });
    spyOn(windowDimensions, 'getResizeEvent').and.returnValue(
      of(new Event('resize')));
    ctrl.$onInit();
    expect(ctrl.windowIsNarrow).toBe(true);
  });
});
