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

    this.expectedFactories = [
      this.PlaythroughImprovementCardObjectFactory,
    ];
  }));

  describe('.getImprovementCardObjectFactoryRegistry', function() {
    it('contains all known improvement card object factories', function() {
      var actualFactories =
        this.ImprovementCardService.getImprovementCardObjectFactoryRegistry();

      // The registry should not be modifiable.
      expect(Object.isFrozen(actualFactories)).toBe(true);

      // Ordering isn't important, so allow the checks to be flexible.
      expect(actualFactories.length).toEqual(this.expectedFactories.length);
      this.expectedFactories.forEach(function(expectedFactory) {
        expect(actualFactories).toContain(expectedFactory);
      });
    });
  });

  describe('.fetchCards', function() {
    // Each individual factory should test their own fetchCards function.

    describe('from factories which all return empty cards', function() {
      beforeEach(function() {
        this.expectedFactories.forEach(function(factory) {
          spyOn(factory, 'fetchCards').and.callFake(function() {
            return Promise.resolve([]);
          });
        });
      });

      it('returns an empty list', function(done) {
        var onSuccess = function(cards) {
          expect(cards).toEqual([]);
          done();
        };
        var onFailure = function(error) {
          done.fail(error);
        };

        this.ImprovementCardService.fetchCards().then(onSuccess, onFailure);
      });
    });
  });
});
