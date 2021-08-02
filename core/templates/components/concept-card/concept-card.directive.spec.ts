// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for Concept Card Directive.
 */

import { destroyPlatform } from '@angular/core';
import { async } from '@angular/core/testing';
import { setupAndGetUpgradedComponentAsync } from '../../../templates/tests/unit-test-utils.ajs';
import { ConceptCardComponent } from './concept-card.directive';
require('./concept-card.directive.ts');

describe('ConceptCardDirective', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
  let $q = null;

  let loadConceptCardsAsync: jasmine.Spy;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    loadConceptCardsAsync = jasmine.createSpy('loadConceptCardsAsyncSpy');
    const mockConceptBackendApiService = {
      loadConceptCardsAsync
    };
    $provide.value(
      'ConceptCardBackendApiService', mockConceptBackendApiService);
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $q = $injector.get('$q');
    $scope = $rootScope.$new();

    ctrl = $componentController('conceptCard', {
      $scope: $scope
    });
  }));

  it('should load concept cards', () => {
    ctrl.index = 0;
    loadConceptCardsAsync.and.resolveTo([{
      getWorkedExamples: () => {
        return ['1'];
      }
    }]);

    ctrl.$onInit();
    ctrl.conceptCards = [{
      getWorkedExamples: () => {
        return ['1'];
      }
    }];
    $scope.$apply();

    expect(ctrl.currentConceptCard.getWorkedExamples()).toEqual(['1']);
    expect(ctrl.numberOfWorkedExamplesShown).toBe(1);
  });

  it('should show error message when adding concept card to' +
    ' a deleted skill', () => {
    loadConceptCardsAsync.and.returnValue($q.reject(''));
    spyOn($scope, '$watch').and.stub();

    ctrl.$onInit();
    $scope.$apply();

    expect(ctrl.skillDeletedMessage).toBe(
      'Oops, it looks like this skill has been deleted.');
  });

  it('should show more worked examples when user clicks on \'+ Worked ' +
    'Examples\'', () => {
    ctrl.explanationIsShown = true;
    ctrl.numberOfWorkedExamplesShown = 2;

    ctrl.showMoreWorkedExamples();

    expect(ctrl.explanationIsShown).toBe(false);
    expect(ctrl.numberOfWorkedExamplesShown).toBe(3);
  });

  it('should check if worked example is the last one', () => {
    ctrl.currentConceptCard = {
      getWorkedExamples: () => {
        return ['1'];
      }
    };
    ctrl.numberOfWorkedExamplesShown = 1;

    expect(ctrl.isLastWorkedExample()).toBe(true);

    ctrl.numberOfWorkedExamplesShown = 2;

    expect(ctrl.isLastWorkedExample()).toBe(false);
  });
});

describe('Upgraded component', () => {
  beforeEach(() => destroyPlatform());
  afterEach(() => destroyPlatform());

  it('should create the upgraded component', async(() => {
    setupAndGetUpgradedComponentAsync(
      'concept-card',
      'conceptCard',
      [ConceptCardComponent]
    ).then(
      async(textContext) => expect(textContext).toBe('Hello Oppia!'));
  }));
});
