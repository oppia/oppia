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
import { WindowRef } from 'services/contextual/window-ref.service';

require('pages/teach-page/teach-page.component.ts');

describe('Teach Page', function() {
  var $scope = null, ctrl = null;
  var $timeout = null;
  var SiteAnalyticsService = null;
  var windowRef = new WindowRef();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('WindowRef', windowRef);
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $timeout = $injector.get('$timeout');
    SiteAnalyticsService = $injector.get('SiteAnalyticsService');

    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    ctrl = $componentController('teachPage', {
      $rootScope: $scope
    });
  }));

  afterEach(function() {
    // onhashchange and location.hash are reassigned because it shares
    // same memory reference to all test blocks and the controller itself
    // because $provide.value of WindowRef refers to windowRef as well.
    // Once location.hash or onhashchange is setted in the controller,
    // the value will be only available in the test block itself, not affecting
    // others test block.
    windowRef.nativeWindow.onhashchange = null;
    windowRef.nativeWindow.location.hash = '';
  });

  it('should click on teach tab', function(done) {
    ctrl.$onInit();
    expect(ctrl.activeTabName).toBe('teach');

    ctrl.onTabClick('teach');

    // setTimeout is being used here in order to wait onhashchange event to
    // finish. setTimeout is executed only after call stack is empty.
    // Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop
    setTimeout(function() {
      expect(windowRef.nativeWindow.location.hash).toBe('#teach');
      expect(ctrl.activeTabName).toBe('teach');
      done();
    });
  });

  it('should click on participation tab', function(done) {
    ctrl.$onInit();
    expect(ctrl.activeTabName).toBe('teach');

    ctrl.onTabClick('participation');

    // setTimeout is being used here in order to wait onhashchange event to
    // finish. setTimeout is executed only after call stack is empty.
    // Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop
    setTimeout(function() {
      expect(windowRef.nativeWindow.location.hash).toBe('#participation');
      expect(ctrl.activeTabName).toBe('participation');
      done();
    });
  });

  it('should activate teach tab on init', function() {
    windowRef.nativeWindow.location.hash = '#teach';

    ctrl.$onInit();

    expect(windowRef.nativeWindow.location.hash).toBe('#teach');
    expect(ctrl.activeTabName).toBe('teach');
  });

  it('should activate participation tab on init', function() {
    windowRef.nativeWindow.location.hash = '#participation';

    ctrl.$onInit();

    expect(windowRef.nativeWindow.location.hash).toBe('#participation');
    expect(ctrl.activeTabName).toBe('participation');
  });

  it('should get static image url', function() {
    expect(ctrl.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image');
  });

  it('should apply to teach with oppia', function() {
    var applyToTeachWithOppiaEventSpy = spyOn(
      SiteAnalyticsService, 'registerApplyToTeachWithOppiaEvent')
      .and.callThrough();

    ctrl.$onInit();
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: ''
    });
    ctrl.onApplyToTeachWithOppia('/login');
    $timeout.flush(150);

    expect(windowRef.nativeWindow.location).toBe(
      'https://goo.gl/forms/0p3Axuw5tLjTfiri1');
    expect(applyToTeachWithOppiaEventSpy).toHaveBeenCalled();
  });
});
