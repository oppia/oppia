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
        id: 2,
        name: 'test name',
        notes: 'test notes',
        feedback: 'test feedback'
      };

      misconceptionDict2 = {
        id: 4,
        name: 'test name',
        notes: 'test notes',
        feedback: 'test feedback'
      };

      skillContentsDict = {
        explanation: {
          html: 'test explanation',
          content_id: 'explanation',
        },
        worked_examples: [
          {
            html: 'test worked example 1',
            content_id: 'worked_example_1',
          },
          {
            html: 'test worked example 2',
            content_id: 'worked_example_2'
          }
        ],
        content_ids_to_audio_translations: {
          explanation: {},
          worked_example_1: {},
          worked_example_2: {}
        }
      };

      skillDict = {
        id: '1',
        description: 'test description',
        misconceptions: [misconceptionDict1, misconceptionDict2],
        skill_contents: skillContentsDict,
        language_code: 'en',
        version: 3,
        next_misconception_id: 6,
        superseding_skill_id: '2',
        all_questions_merged: false
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
      expect(skill.getSupersedingSkillId()).toEqual('2');
      expect(skill.getAllQuestionsMerged()).toEqual(false);
    });

    it('should delete a misconception given its id', function() {
      var skill = SkillObjectFactory.createFromBackendDict(skillDict);
      skill.deleteMisconception(2);
      expect(skill.getMisconceptions()).toEqual(
        [MisconceptionObjectFactory.createFromBackendDict(
          misconceptionDict2)]);
    });

    it('should get the correct next misconception id', function() {
      var skill = SkillObjectFactory.createFromBackendDict(skillDict);
      expect(skill.getNextMisconceptionId()).toEqual(6);
      skill.deleteMisconception(4);
      expect(skill.getNextMisconceptionId()).toEqual(6);

      var misconceptionToAdd1 = MisconceptionObjectFactory
        .createFromBackendDict({
          id: skill.getNextMisconceptionId(),
          name: 'test name',
          notes: 'test notes',
          feedback: 'test feedback',
        });

      skill.appendMisconception(misconceptionToAdd1);
      expect(skill.getNextMisconceptionId()).toEqual(7);
      skill.deleteMisconception(6);
      expect(skill.getNextMisconceptionId()).toEqual(7);
    });

    it('should convert to a backend dictionary', function() {
      var skill = SkillObjectFactory.createFromBackendDict(skillDict);
      expect(skill.toBackendDict()).toEqual(skillDict);
    });

    it('should be able to create an interstitial skill', function() {
      var skill = SkillObjectFactory.createInterstitialSkill();
      expect(skill.getId()).toEqual(null);
      expect(skill.getDescription()).toEqual('Skill description loading');
      expect(skill.getMisconceptions()).toEqual([]);
      expect(skill.getConceptCard()).toEqual(
        ConceptCardObjectFactory.createInterstitialConceptCard());
      expect(skill.getLanguageCode()).toEqual('en');
      expect(skill.getVersion()).toEqual(1);
      expect(skill.getSupersedingSkillId()).toEqual(null);
      expect(skill.getAllQuestionsMerged()).toEqual(false);
    });
  });
});
