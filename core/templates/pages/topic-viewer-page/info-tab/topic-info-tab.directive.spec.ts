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
 * @fileoverview Unit tests for the controller of the 'Topic Info Tab'.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('App.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/topic-viewer-page/info-tab/topic-info-tab.directive.ts');

describe('Topic info tab controller', function() {
  describe('Topic info tab', function() {
    var ctrlScope, rootScope, outerScope, windowWidth;

    beforeEach(angular.mock.module('directiveTemplates'));
    beforeEach(function() {
      angular.mock.module('oppia');
    });
    beforeEach(angular.mock.module('oppia', function($provide) {
      var ugs = new UpgradedServices();
      for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
        $provide.value(key, value);
      }
    }));

    beforeEach(function() {
      var mockWindowDimensionsService = {
        getWidth: function() {
          return windowWidth;
        }
      };
      angular.mock.module(function($provide) {
        $provide.value(
          'WindowDimensionsService', [mockWindowDimensionsService][0]);
      });
    });

    beforeEach(angular.mock.inject(function(
        $compile, $filter, $injector, $rootScope, $templateCache) {
      outerScope = $rootScope.$new();
      var elem = angular.element(
        '<topic-info-tab></topic-info-tab>');
      var compiledElem = $compile(elem)(outerScope);
      outerScope.$digest();
      ctrlScope = compiledElem[0].getLocalControllerScope();
    }));

    it('should correctly get wide screen width', function() {
      windowWidth = 1920;
      expect(ctrlScope.checkSmallScreenWidth()).toEqual(false);
    });

    it('should correctly get narrow screen width', function() {
      windowWidth = 1000;
      expect(ctrlScope.checkSmallScreenWidth()).toEqual(true);
    });
  });
});
