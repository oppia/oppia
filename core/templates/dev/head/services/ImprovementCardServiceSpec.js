// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the ImprovementCardService.
 */

describe('ImprovementCardService', function() {
  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    this.ImprovementCardService = $injector.get('ImprovementCardService');
    this.PlaythroughImprovementCardObjectFactory =
      $injector.get('PlaythroughImprovementCardObjectFactory');
  }));

  describe('getRegisteredCardObjectFactories', function() {
    it('contains all known improvement card object factories', function() {
      var expectedFactories = [
        this.PlaythroughImprovementCardObjectFactory,
      ];
      var actualFactories =
        this.ImprovementCardService.getRegisteredCardObjectFactories();

      expect(actualFactories.length).toEqual(expectedFactories.length);
      expectedFactories.forEach(function(expectedFactory) {
        expect(actualFactories).toContain(expectedFactory);
      });
    });
  });

  describe('fetchCards', function() {
    it('returns empty list when all factories return nothing', function() {
      // TODO(brianrodri): Add boilerplate to force empty values.

      var onSuccess = jasmine.createSpy('onSuccess');
      var onFailure = jasmine.createSpy('onFailure');
      this.ImprovementCardService.fetchCards().then(onSuccess, onFailure);

      expect(onFailure).not.toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith([]);
    });
  });
});
