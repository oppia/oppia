// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Interaction Details Cache Service.
 */
describe('Interaction Details Cache Service', function() {
  describe('InteractionDetailsCache', function() {
    beforeEach(function() {
      module('oppia');
    });


    var customizationArgs = {
      testCustomization : {
        value: 'testValue'
      }
    };

    var customization = {
      customization : customizationArgs
    };

    var scope, idcs;
    beforeEach(inject(function($rootScope, $injector) {
      scope = $rootScope.$new();
      idcs = $injector.get('InteractionDetailsCacheService');
    }));

    it('sets a value in the cache', function() {
      idcs.set('InteractionId', customizationArgs);
      expect(idcs.contains('InteractionId')).toBe(true);
    });

    it('returns null when value isnt available in the cache', function() {
      expect(idcs.get('NonPresentInteractionId')).toEqual(null);
    });

    it('gets a value from the cache', function() {
      idcs.set('InteractionId', customizationArgs);
      expect(idcs.get('InteractionId')).toEqual(customization);
    });

    it('successfully checks if the value is available in cache', function() {
      idcs.set('InteractionId', customizationArgs);
      expect(idcs.contains('InteractionId')).toBe(true);
      expect(idcs.contains('NonPresentInteractionId')).toBe(false);
      expect(idcs.contains('')).toBe(false);
      expect(idcs.contains(1)).toBe(false);
    });

    it('removes details from the cache', function() {
      idcs.set('InteractionId', customizationArgs);
      expect(idcs.contains('InteractionId')).toBe(true);
      idcs.removeDetails('InteractionId');
      expect(idcs.contains('InteractionId')).toBe(false);
    });

    it('resets the cache', function() {
      idcs.set('InteractionId', customizationArgs);
      expect(idcs.contains('InteractionId')).toBe(true);
      idcs.reset();
      expect(idcs.contains('InteractionId')).toBe(false);
    });
  });
});
