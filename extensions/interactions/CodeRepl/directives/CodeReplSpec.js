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

describe('CodeRepl interaction', function() {
  describe('CodeRepl tests', function() {
    var $httpBackend, $templateCache;
    var elt, scope;

    beforeEach(module('directiveTemplates'));
    beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    beforeEach(inject(function($compile, $rootScope, _$templateCache_) {
      $templateCache = _$templateCache_;
      var templatesHtml = $templateCache.get(
        '/extensions/interactions/CodeRepl/directives/' +
        'code_repl_interaction_directive.html');
      $compile(templatesHtml)($rootScope);
      $rootScope.$digest();
    }));

    beforeEach(inject(function($compile, _$httpBackend_, $rootScope) {
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
      expect(elt.html()).toContain('runCode(code)');
    });
  });
});
