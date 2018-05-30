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

    var interactionCustomizationArgs = {
      choices : {
        value: 'SampleChoice'
      }
    };

    var interaction = {
      customization : interactionCustomizationArgs
    };

    var scope = null, idcs = null;
    beforeEach(inject(function($rootScope, $injector) {
      scope = $rootScope.$new();
      idcs = $injector.get('InteractionDetailsCacheService');
    }));

    it('should add interaction in the cache', function() {
      idcs.set('InteractionId', interactionCustomizationArgs);
      expect(idcs.contains('InteractionId')).toBe(true);
    });

    it('should return null if interaction isnt present in cache', function() {
      expect(idcs.get('NonPresentInteractionId')).toEqual(null);
    });

    it('should get interaction details from the cache', function() {
      idcs.set('InteractionId', interactionCustomizationArgs);
      expect(idcs.get('InteractionId')).toEqual(interaction);
    });

    it('should successfully check if interaction is in cache', function() {
      idcs.set('InteractionId', interactionCustomizationArgs);
      expect(idcs.contains('InteractionId')).toBe(true);
      expect(idcs.contains('NonPresentInteractionId')).toBe(false);
      expect(idcs.contains('')).toBe(false);
      expect(idcs.contains(1)).toBe(false);
    });

    it('should remove the interaction from the cache', function() {
      idcs.set('InteractionId', interactionCustomizationArgs);
      expect(idcs.contains('InteractionId')).toBe(true);
      idcs.removeDetails('InteractionId');
      expect(idcs.contains('InteractionId')).toBe(false);
    });

    it('should reset the cache', function() {
      idcs.set('InteractionId', interactionCustomizationArgs);
      expect(idcs.contains('InteractionId')).toBe(true);
      idcs.reset();
      expect(idcs.contains('InteractionId')).toBe(false);
    });
  });
});
