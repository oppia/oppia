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
 * @fileoverview Unit tests for the collection editor tab directive.
 */

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Collection Editor Tab', () => {
  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
  let directive = null;
  let CollectionEditorStateService = null;
  let CollectionLinearizerService = null;

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    CollectionEditorStateService = $injector.get(
      'CollectionEditorStateService');
    CollectionLinearizerService = $injector.get(
      'CollectionLinearizerService');
    $scope = $rootScope.$new();

    directive = $injector.get('collectionEditorTabDirective')[0];
    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope
    });
  }));

  it('should get collections on initialization', () => {
    spyOn(CollectionEditorStateService, 'getCollection').and.returnValue({
      collection: {
        a: 'b'
      }
    });

    ctrl.$onInit();

    expect(ctrl.collection).toEqual({
      collection: {
        a: 'b'
      }
    });
  });

  it('should check if collection has loaded or not', () => {
    spyOn(CollectionEditorStateService, 'hasLoadedCollection').and.returnValue(
      false
    );

    expect(ctrl.hasLoadedCollection()).toBe(false);
  });

  it('should get linearly sorted nodes', () => {
    spyOn(CollectionLinearizerService, 'getCollectionNodesInPlayableOrder')
      .and.returnValue({
        collection: {
          1: '',
          2: ''
        }
      });

    expect(ctrl.getLinearlySortedNodes()).toEqual({
      collection: {
        1: '',
        2: ''
      }
    });
  });
});
