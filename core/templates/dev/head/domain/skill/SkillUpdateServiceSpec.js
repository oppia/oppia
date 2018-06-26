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

    var skillContentsDict = {
      explanation: 'test explanation',
      worked_examples: ['test worked example 1', 'test worked example 2']
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
      skill, 'new explanation');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_contents_property',
      property_name: 'explanation',
      old_value: 'test explanation',
      new_value: 'new explanation'
    }]);
    expect(skill.getConceptCard().getExplanation()).toEqual('new explanation');
    UndoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getExplanation()).toEqual('test explanation');
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
      new_value: aNewMisconceptionDict
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
    SkillUpdateService.addWorkedExample(skill, 'a new worked example');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_contents_property',
      property_name: 'worked_examples',
      old_value: [
        'test worked example 1',
        'test worked example 2'],
      new_value: [
        'test worked example 1',
        'test worked example 2',
        'a new worked example']
    }]);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      'test worked example 1',
      'test worked example 2',
      'a new worked example']);
    UndoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      'test worked example 1',
      'test worked example 2']);
  });

  it('shoud delete a worked example', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.deleteWorkedExample(skill, 0);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_contents_property',
      property_name: 'worked_examples',
      old_value: [
        'test worked example 1',
        'test worked example 2'],
      new_value: [
        'test worked example 2']
    }]);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      'test worked example 2']);
    UndoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      'test worked example 1',
      'test worked example 2']);
  });

  it('should update a worked example', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.updateWorkedExample(skill, 0, 'new content');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_contents_property',
      property_name: 'worked_examples',
      old_value: [
        'test worked example 1',
        'test worked example 2'],
      new_value: [
        'new content',
        'test worked example 2']
    }]);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      'new content',
      'test worked example 2']);
    UndoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      'test worked example 1',
      'test worked example 2']);
  });
});
