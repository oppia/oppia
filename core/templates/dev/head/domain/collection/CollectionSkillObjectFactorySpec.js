// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for CollectionNodeObjectFactory.
 */

describe('Collection skill object factory', function() {
  var CollectionSkillObjectFactory = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    CollectionSkillObjectFactory = $injector.get(
      'CollectionSkillObjectFactory');
  }));

  var _createEmptyCollectionSkill = function(
      skillId, skillName, questionIds) {
    return CollectionSkillObjectFactory.create(skillId, {
      name: skillName,
      question_ids: questionIds ? questionIds : []
    });
  };

  it('should contain initial question ids', function() {
    var collectionSkill = _createEmptyCollectionSkill(
      's0', 'skill 1', ['question1', 'question2']);
    expect(collectionSkill.getId()).toEqual('s0');
    expect(collectionSkill.getName()).toEqual('skill 1');
    expect(collectionSkill.getQuestionIds()).toEqual([
      'question1', 'question2'
    ]);
  });

  it('should be able to create a new collection skill by ID and name',
    function() {
      var collectionSkill = CollectionSkillObjectFactory.createFromIdAndName(
        'skill1', 'skill name');
      expect(collectionSkill.getId()).toEqual('skill1');
      expect(collectionSkill.getName()).toEqual('skill name');
      expect(collectionSkill.getQuestionIds()).toEqual([]);
    }
  );
});
