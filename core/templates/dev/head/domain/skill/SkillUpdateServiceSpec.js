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
* @fileoverview Unit tests for SkillUpdateService.
*/

describe('Skill update service', function() {
  var SkillUpdateService,
    SkillObjectFactory,
    MisconceptionObjectFactory,
    UndoRedoService;
  var skillDict;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    SkillUpdateService = $injector.get('SkillUpdateService');
    SkillObjectFactory = $injector.get('SkillObjectFactory');
    SubtitledHtmlObjectFactory = $injector.get('SubtitledHtmlObjectFactory');
    MisconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');
    UndoRedoService = $injector.get('UndoRedoService');

    var misconceptionDict1 = {
      id: '2',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback'
    };

    var misconceptionDict2 = {
      id: '4',
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
      version: 3
    };
  }));

  it('should set/unset the skill description', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.setSkillDescription(skill, 'new description');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_property',
      property_name: 'description',
      old_value: 'test description',
      new_value: 'new description'
    }]);
    expect(skill.getDescription()).toEqual('new description');
    UndoRedoService.undoChange(skill);
    expect(skill.getDescription()).toEqual('test description');
  });

  it('should set/unset the concept card explanation', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.setConceptCardExplanation(
      skill, SubtitledHtmlObjectFactory.createDefault(
        'new explanation', 'explanation'));
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_contents_property',
      property_name: 'explanation',
      old_value: {
        html: 'test explanation',
        content_id: 'explanation'
      },
      new_value: {
        html: 'new explanation',
        content_id: 'explanation'
      }
    }]);
    expect(skill.getConceptCard().getExplanation()).toEqual(
      SubtitledHtmlObjectFactory.createDefault(
        'new explanation', 'explanation'));
    UndoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getExplanation()).toEqual(
      SubtitledHtmlObjectFactory.createDefault(
        'test explanation', 'explanation'));
  });

  it('should add a misconception', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    var aNewMisconceptionDict = {
      id: '7',
      name: 'test name 3',
      notes: 'test notes 3',
      feedback: 'test feedback 3'
    };
    var aNewMisconception =
      MisconceptionObjectFactory.createFromBackendDict(aNewMisconceptionDict);
    SkillUpdateService.addMisconception(skill, aNewMisconception);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'add_skill_misconception',
      new_misconception_dict: aNewMisconceptionDict
    }]);
    expect(skill.getMisconceptions().length).toEqual(3);
    UndoRedoService.undoChange(skill);
    expect(skill.getMisconceptions().length).toEqual(2);
  });

  it('should delete a misconception', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.deleteMisconception(skill, '2');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'delete_skill_misconception',
      id: '2'
    }]);
    expect(skill.getMisconceptions().length).toEqual(1);
    UndoRedoService.undoChange(skill);
    expect(skill.getMisconceptions().length).toEqual(2);
  });

  it('should update the name of a misconception', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.updateMisconceptionName(
      skill, '2', skill.findMisconceptionById('2').getName(), 'new name');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_misconceptions_property',
      property_name: 'name',
      old_value: 'test name',
      new_value: 'new name',
      id: '2'
    }]);
    expect(skill.findMisconceptionById('2').getName()).toEqual('new name');
    UndoRedoService.undoChange(skill);
    expect(skill.findMisconceptionById('2').getName()).toEqual('test name');
  });

  it('should update the notes of a misconception', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.updateMisconceptionNotes(
      skill, '2', skill.findMisconceptionById('2').getNotes(), 'new notes');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_misconceptions_property',
      property_name: 'notes',
      old_value: 'test notes',
      new_value: 'new notes',
      id: '2'
    }]);
    expect(skill.findMisconceptionById('2').getNotes()).toEqual('new notes');
    UndoRedoService.undoChange(skill);
    expect(skill.findMisconceptionById('2').getNotes()).toEqual('test notes');
  });

  it('should update the feedback of a misconception', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.updateMisconceptionFeedback(
      skill,
      '2',
      skill.findMisconceptionById('2').getFeedback(),
      'new feedback');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_misconceptions_property',
      property_name: 'feedback',
      old_value: 'test feedback',
      new_value: 'new feedback',
      id: '2'
    }]);
    expect(skill.findMisconceptionById('2').getFeedback())
      .toEqual('new feedback');
    UndoRedoService.undoChange(skill);
    expect(skill.findMisconceptionById('2').getFeedback())
      .toEqual('test feedback');
  });

  it('should add a worked example', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.addWorkedExample(skill,
      SubtitledHtmlObjectFactory.createDefault(
        'a new worked example', 'worked_example_3'));
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_contents_property',
      property_name: 'worked_examples',
      old_value: [
        {
          html: 'test worked example 1',
          content_id: 'worked_example_1',
        },
        {
          html: 'test worked example 2',
          content_id: 'worked_example_2'
        }],
      new_value: [
        {
          html: 'test worked example 1',
          content_id: 'worked_example_1',
        },
        {
          html: 'test worked example 2',
          content_id: 'worked_example_2'
        },
        {
          html: 'a new worked example',
          content_id: 'worked_example_3'
        }]
    }]);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 1', 'worked_example_1'),
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 2', 'worked_example_2'),
      SubtitledHtmlObjectFactory.createDefault(
        'a new worked example', 'worked_example_3')]);
    UndoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 1', 'worked_example_1'),
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 2', 'worked_example_2')]);
  });

  it('shoud delete a worked example', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.deleteWorkedExample(skill, 0);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_contents_property',
      property_name: 'worked_examples',
      old_value: [
        {
          html: 'test worked example 1',
          content_id: 'worked_example_1',
        },
        {
          html: 'test worked example 2',
          content_id: 'worked_example_2'
        }
      ],
      new_value: [
        {
          html: 'test worked example 2',
          content_id: 'worked_example_2'
        }
      ]
    }]);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 2', 'worked_example_2')]);
    UndoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 1', 'worked_example_1'),
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 2', 'worked_example_2')]);
  });

  it('should update a worked example', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.updateWorkedExample(skill, 0, 'new content');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_contents_property',
      property_name: 'worked_examples',
      old_value: [
        {
          html: 'test worked example 1',
          content_id: 'worked_example_1',
        },
        {
          html: 'test worked example 2',
          content_id: 'worked_example_2'
        }],
      new_value: [
        {
          html: 'new content',
          content_id: 'worked_example_1',
        },
        {
          html: 'test worked example 2',
          content_id: 'worked_example_2'
        }]
    }]);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      SubtitledHtmlObjectFactory.createDefault(
        'new content', 'worked_example_1'),
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 2', 'worked_example_2')]);
    UndoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 1', 'worked_example_1'),
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 2', 'worked_example_2')]);
  });
});
