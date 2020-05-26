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

import { WindowRef } from 'services/contextual/window-ref.service';

describe('About Page', function() {
  var $scope = null;
  var ctrl = null;
  var windowRef = new WindowRef();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('WindowRef', windowRef);
  }));
  beforeEach(angular.mock.inject(function($injector) {
    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    var directive = $injector.get('welcomeGuidePage')[0];
    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope
    });
  }));

  afterEach(function() {
    // onhashchange and location.hash are reassigned because it shares
    // same memory reference to all test blocks and the controller itself
    // because $provide.value of WindowRef refers to windowRef as well.
    // Once location.hash or onhashchange is set in the controller,
    // the value will be only available in the test block itself, not affecting
    // others test block.
    windowRef.nativeWindow.onhashchange = null;
    windowRef.nativeWindow.location.hash = '';
  });

  it('should click on about tab', function(done) {
    ctrl.$onInit();
    expect(ctrl.activeTabName).toBe('about');

    ctrl.onTabClick('about');

    // setTimeout is being used here in order to wait onhashchange event to
    // finish. setTimeout is executed only after call stack is empty.
    // Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop
    setTimeout(function() {
      expect(windowRef.nativeWindow.location.hash).toBe('#welcomeguide');
      expect(ctrl.activeTabName).toBe('Welcome Guide');
      done();
    });
  });

  it('should get static image url', function() {
    expect(ctrl.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image');
  });
});

