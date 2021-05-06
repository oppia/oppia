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
 * @fileoverview AngularHtmlBind Directive wrapper tests.
 */

import { destroyPlatform } from '@angular/core';
import { waitForAsync } from '@angular/core/testing';
import { setupAndGetUpgradedComponent } from 'tests/unit-test-utils';
import { AngularHtmlBindWrapperDirective } from './angular-html-bind-wrapper.directive';

describe('Angular Html Bind Wrapper Directive', () => {
  describe('Upgraded component', () => {
    beforeEach(() => destroyPlatform());
    afterEach(() => destroyPlatform());

    it('should create the upgraded component', waitForAsync(() => {
      setupAndGetUpgradedComponent(
        'angular-html-bind-wrapper',
        'angularHtmlBindWrapper',
        [AngularHtmlBindWrapperDirective]
      ).then(
        textContext => expect(textContext).toBe('Hello Oppia!')
      );
    }));
  });

  describe('AngularJS wrapper directive', () => {
    let $scope = null;
    let elem = null;

    let compiledElement = null;
    let applySpy;
    let $componentController;

    beforeEach(angular.mock.module('directiveTemplates'));
    beforeEach(angular.mock.module('oppia'));

    beforeEach(angular.mock.inject(function(
        _$componentController_, $compile, $injector) {
      const $rootScope = $injector.get('$rootScope');
      $componentController = _$componentController_;
      $scope = $rootScope.$new();
      $scope.htmlData = '<div></div>';

      elem = angular.element(
        '<angular-html-bind-wrapper html-data=htmlData>' +
        '</angular-html-bind-wrapper>');

      compiledElement = $compile(elem)($scope);
      $rootScope.$digest();
      applySpy = spyOn($rootScope, '$applyAsync').and.stub();
    }));

    it('should compile', function() {
      expect(compiledElement).not.toBeNull();
    });

    it('should call applyAsync on initialization', function() {
      const ctrl = $componentController('angularHtmlBindWrapper');
      ctrl.$onInit();
      expect(applySpy).toHaveBeenCalled();
    });
  });
});
