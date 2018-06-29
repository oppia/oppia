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
 * @fileoverview Tests for SubtopicObjectFactory.
 */

describe('Subtopic object factory', function() {
  var SubtopicObjectFactory = null;
  var _sampleSubtopic = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    SubtopicObjectFactory = $injector.get('SubtopicObjectFactory');

    var sampleSubtopicBackendObject = {
      id: 1,
      title: 'Title',
      skill_ids: ['skill_1', 'skill_2'],
      skill_descriptions: ['Description 1', 'Description 2']
    };
    _sampleSubtopic = SubtopicObjectFactory.create(sampleSubtopicBackendObject);
  }));

  it('should be able to create a subtopic object with given title and id',
    function() {
      var subtopic = SubtopicObjectFactory.createFromTitle(2, 'Title2');
      expect(subtopic.getId()).toBe(2);
      expect(subtopic.getTitle()).toBe('Title2');
      expect(subtopic.getSkillIds()).toEqual([]);
      expect(subtopic.getSkillDescriptions()).toEqual([]);
    });

  it('should not add duplicate elements to skill ids list', function() {
    expect(_sampleSubtopic.addSkill('skill_1', 'Description 1')).toEqual(false);
  });

  it('should correctly remove a skill id', function() {
    _sampleSubtopic.removeSkill('skill_1');
    expect(_sampleSubtopic.getSkillIds()).toEqual(['skill_2']);
    expect(_sampleSubtopic.getSkillDescriptions()).toEqual(['Description 2']);
  });
});
