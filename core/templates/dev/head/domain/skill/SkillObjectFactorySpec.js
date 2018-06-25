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
* @fileoverview Unit tests for SkillObjectFactory.
*/

describe('Skill object factory', function() {
  beforeEach(module('oppia'));

  describe('SkillObjectFactory', function() {
    var SkillObjectFactory = null;
    var MisconceptionObjectFactory = null;
    var ConceptCardObjectFactory = null;
    var misconceptionDict1 = null;
    var misconceptionDict2 = null;
    var skillContentsDict = null;
    var skillDict = null;

    beforeEach(inject(function($injector) {
      SkillObjectFactory = $injector.get('SkillObjectFactory');
      MisconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');
      ConceptCardObjectFactory = $injector.get('ConceptCardObjectFactory');

      misconceptionDict1 = {
        id: '2',
        name: 'test name',
        notes: 'test notes',
        feedback: 'test feedback'
      };

      misconceptionDict2 = {
        id: '4',
        name: 'test name',
        notes: 'test notes',
        feedback: 'test feedback'
      };

      skillContentsDict = {
        explanation: 'test explanation',
        worked_examples: ['test worked_example 1', 'test worked example 2']
      };

      skillDict = {
        id: '1',
        description: 'test description',
        misconceptions: [misconceptionDict1, misconceptionDict2],
        skill_contents: skillContentsDict,
        language_code: 'en',
        version: 3
      };
    }));

    it('should create a new skill from a backend dictionary', function() {
      var skill = SkillObjectFactory.createFromBackendDict(skillDict);
      expect(skill.getId()).toEqual('1');
      expect(skill.getDescription()).toEqual('test description');
      expect(skill.getMisconceptions()).toEqual(
        [MisconceptionObjectFactory.createFromBackendDict(
          misconceptionDict1),
         MisconceptionObjectFactory.createFromBackendDict(
          misconceptionDict2)]);
      expect(skill.getConceptCard()).toEqual(
        ConceptCardObjectFactory.createFromBackendDict(skillContentsDict));
      expect(skill.getLanguageCode()).toEqual('en');
      expect(skill.getVersion()).toEqual(3);
    });

    it('should delete a misconception given its id', function() {
      var skill = SkillObjectFactory.createFromBackendDict(skillDict);
      skill.deleteMisconception('2');
      expect(skill.getMisconceptions()).toEqual(
        [MisconceptionObjectFactory.createFromBackendDict(
          misconceptionDict2)]);
    });

    it('should get the correct next misconception id', function() {
      var skill = SkillObjectFactory.createFromBackendDict(skillDict);
      expect(skill.getNextMisconceptionId()).toEqual('5');
      skill.deleteMisconception('4');
      expect(skill.getNextMisconceptionId()).toEqual('3');
    });

    it('should convert to a backend dictionary', function() {
      var skill = SkillObjectFactory.createFromBackendDict(skillDict);
      expect(skill.toBackendDict()).toEqual(skillDict);
    });
  });
});
