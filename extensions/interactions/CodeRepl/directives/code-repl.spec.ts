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
 * @fileoverview Unit tests for the CodeRepl interaction.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { CodeNormalizerService } from 'services/code-normalizer.service';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('CodeRepl interaction', function() {
  describe('CodeRepl tests', function() {
    var $httpBackend, $templateCache;
    var elt, scope;

    beforeEach(angular.mock.module('directiveTemplates'));
    beforeEach(
      angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('CodeNormalizerService', new CodeNormalizerService());
    }));
    beforeEach(angular.mock.module('oppia', function($provide) {
      var ugs = new UpgradedServices();
      for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
        $provide.value(key, value);
      }
    }));

    beforeEach(angular.mock.inject(function(
        $compile, $rootScope, _$templateCache_) {
      $templateCache = _$templateCache_;
      var templatesHtml = $templateCache.get(
        '/extensions/interactions/CodeRepl/directives/' +
        'code-repl-interaction.directive.html');
      $compile(templatesHtml)($rootScope);
      $rootScope.$digest();
    }));

    beforeEach(angular.mock.inject(function(
        $compile, _$httpBackend_, $rootScope) {
      $httpBackend = _$httpBackend_;

      var TAG_NAME = 'oppia-interactive-code-repl';
      scope = $rootScope.$new();
      elt = angular.element('<' + TAG_NAME + '></' + TAG_NAME + '>');
      $compile(elt)(scope);
      scope.$digest();
    }));

    afterEach(function() {
      scope.$apply();
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('loads the code template', function() {
      expect(elt.html()).toContain('code-repl-input-box');
      expect(elt.html()).toContain('$ctrl.runCode($ctrl.code)');
    });
  });
});
