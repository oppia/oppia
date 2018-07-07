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
* @fileoverview Unit tests for MisconceptionObjectFacfory.
*/

describe('Misconception object factory', function() {
  beforeEach(module('oppia'));

  describe('MisconceptionObjectFacfory', function() {
    var MisconceptionObjectFactory;
    var misconceptionDict;

    beforeEach(inject(function($injector) {
      MisconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');
      misconceptionDict = {
        id: '1',
        name: 'test name',
        notes: 'test notes',
        feedback: 'test feedback'
      };
    }));

    it('should create a new misconception', function() {
      var misconception =
        MisconceptionObjectFactory.createFromBackendDict(misconceptionDict);
      expect(misconception.getId()).toEqual('1');
      expect(misconception.getName()).toEqual('test name');
      expect(misconception.getNotes()).toEqual('test notes');
      expect(misconception.getFeedback()).toEqual('test feedback');
    });

    it('should convert to a backend dictionary', function() {
      var misconception =
        MisconceptionObjectFactory.createFromBackendDict(misconceptionDict);
      expect(misconception.toBackendDict()).toEqual(misconceptionDict);
    });
  });
});
