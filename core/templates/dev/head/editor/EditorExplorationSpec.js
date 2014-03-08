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
 * @fileoverview Unit tests for the controller of the 'contribute' gallery page.
 *
 * @author sll@google.com (Sean Lip)
 */

describe('Editor context service', function() {
  beforeEach(module('oppia'));

  describe('editor context service', function() {
    var ecs = null;

    beforeEach(inject(function($injector) {
      ecs = $injector.get('editorContextService');
    }));

    it('should correctly determine whether we are in a state context', function() {
      expect(ecs.isInStateContext()).toBe(false);
      ecs.setActiveStateName('A State');
      expect(ecs.isInStateContext()).toBe(true);
    });

    it('should correctly clear the active state name', function() {
      ecs.setActiveStateName('A State');
      expect(ecs.isInStateContext()).toBe(true);
      ecs.clearActiveStateName();
      expect(ecs.isInStateContext()).toBe(false);
      expect(ecs.getActiveStateName()).toBeNull();
    });

    it('should correctly set and get state names', function() {
      ecs.setActiveStateName('A State');
      expect(ecs.getActiveStateName()).toBe('A State');
    });

    it('should not allow invalid state names to be set', function() {
      ecs.setActiveStateName('');
      expect(ecs.isInStateContext()).toBe(false);
      expect(ecs.getActiveStateName()).toBeNull();

      ecs.setActiveStateName(null);
      expect(ecs.isInStateContext()).toBe(false);
      expect(ecs.getActiveStateName()).toBeNull();
    });
  });
});
