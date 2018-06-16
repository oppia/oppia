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
 * @fileoverview Unit tests for the exploration rights service
 * of the exploration editor page.
 */

describe('Exploration rights service', function() {
  beforeEach(module('oppia'));

  describe('exploration rights service', function() {
    var ers = null;

    beforeEach(inject(function($injector) {
      ers = $injector.get('ExplorationRightsService');

      GLOBALS.ACTIVITY_STATUS_PRIVATE = 'private';
      GLOBALS.ACTIVITY_STATUS_PUBLIC = 'public';
    }));

    it('correctly initializes the service', function() {
      expect(ers.ownerNames).toBeUndefined();
      expect(ers.editorNames).toBeUndefined();
      expect(ers.translatorNames).toBeUndefined();
      expect(ers.viewerNames).toBeUndefined();
      expect(ers._status).toBeUndefined();
      expect(ers._clonedFrom).toBeUndefined();
      expect(ers._isCommunityOwned).toBeUndefined();
      expect(ers._viewableIfPrivate).toBeUndefined();

      ers.init(['abc'], [], [], [], 'private', 'e1234', true, true);

      expect(ers.ownerNames).toEqual(['abc']);
      expect(ers.editorNames).toEqual([]);
      expect(ers.translatorNames).toEqual([]);
      expect(ers.viewerNames).toEqual([]);
      expect(ers._status).toEqual('private');
      expect(ers._clonedFrom).toEqual('e1234');
      expect(ers._isCommunityOwned).toBe(true);
      expect(ers._viewableIfPrivate).toBe(true);
    });

    it('reports the correct cloning status', function() {
      ers.init(['abc'], [], [], [], 'public', '1234', true);
      expect(ers.isCloned()).toBe(true);
      expect(ers.clonedFrom()).toEqual('1234');

      ers.init(['abc'], [], [], [], 'public', null, true);
      expect(ers.isCloned()).toBe(false);
      expect(ers.clonedFrom()).toBeNull();
    });

    it('reports the correct community-owned status', function() {
      ers.init(['abc'], [], [], [], 'public', '1234', false);
      expect(ers.isCommunityOwned()).toBe(false);

      ers.init(['abc'], [], [], [], 'public', '1234', true);
      expect(ers.isCommunityOwned()).toBe(true);
    });

    it('reports the correct derived statuses', function() {
      ers.init(['abc'], [], [], [], 'private', 'e1234', true);
      expect(ers.isPrivate()).toBe(true);
      expect(ers.isPublic()).toBe(false);

      ers.init(['abc'], [], [], [], 'public', 'e1234', true);
      expect(ers.isPrivate()).toBe(false);
      expect(ers.isPublic()).toBe(true);
    });
  });
});
