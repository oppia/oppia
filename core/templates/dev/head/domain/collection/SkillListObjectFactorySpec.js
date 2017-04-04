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
 * @fileoverview Tests for SkillListObjectFactory.
 */

describe('Skill list object factory', function() {
  var SkillListObjectFactory = null;
  var _skillList = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    SkillListObjectFactory = $injector.get('SkillListObjectFactory');
    _skillList = SkillListObjectFactory.create([]);
  }));

  it('should be creatable from an empty skills array', function() {
    var skillList = SkillListObjectFactory.create([]);
    expect(skillList.isEmpty()).toBe(true);
    expect(skillList.getSkills()).toEqual([]);
  });

  it('should contain the skills it was created with', function() {
    var skills = ['skill0'];
    var skillList = SkillListObjectFactory.create(skills);
    expect(skillList.containsSkill('skill0')).toBe(true);
  });

  it('should be able to add and remove skills', function() {
    expect(_skillList.containsSkill('skill0')).toBe(false);
    expect(_skillList.addSkill('skill0')).toBe(true);
    expect(_skillList.containsSkill('skill0')).toBe(true);
    expect(_skillList.removeSkillByName('skill0')).toBe(true);
    expect(_skillList.containsSkill('skill0')).toBe(false);
  });

  it('should not be able to add duplicate skills', function() {
    expect(_skillList.addSkill('skill0')).toBe(true);
    expect(_skillList.addSkill('skill0')).toBe(false);
  });

  it('should not be able to remove non-existent skills by name', function() {
    expect(_skillList.containsSkill('skill0')).toBe(false);
    expect(_skillList.removeSkillByName('skill0')).toBe(false);
  });

  it('should be able to add a list of skills, ignoring duplicates', function() {
    expect(_skillList.isEmpty()).toBe(true);

    var skills1 = ['skill0', 'skill1'];
    expect(_skillList.addSkills(skills1)).toBeTruthy();
    expect(_skillList.getSkillCount()).toEqual(2);
    expect(_skillList.getSkills()).toEqual(['skill0', 'skill1']);

    // This one contains a duplicate within the array, and duplicates one skill
    // already in the list.
    var skills2 = ['skill0', 'skill2', 'skill3', 'skill2'];
    expect(_skillList.addSkills(skills2)).toBeFalsy();

    // Even though the complete add failed, all unique skills should still be
    // added.
    expect(_skillList.getSkillCount()).toEqual(4);
    expect(_skillList.getSkills()).toEqual([
      'skill0', 'skill1', 'skill2', 'skill3'
    ]);
  });

  it('should overwrite existing skills with setSkills()', function() {
    var skillList = SkillListObjectFactory.create(['first', 'second']);
    expect(skillList.getSkillCount()).toEqual(2);

    skillList.setSkills(['skill2', 'skill0', 'skill1']);
    expect(skillList.getSkillCount()).toEqual(3);
    expect(skillList.getSkills()).toEqual(['skill2', 'skill0', 'skill1']);
  });

  it('should be able to detect being a superset of another skill list',
      function() {
    var skillList1 = SkillListObjectFactory.create(['skill0', 'skill1']);
    var skillList2 = SkillListObjectFactory.create(['skill0']);

    expect(skillList1.isSupersetOfSkillList(skillList2)).toBe(true);
    expect(skillList2.isSupersetOfSkillList(skillList1)).toBe(false);

    // The empty list is a subset of all lists.
    var skillList3 = SkillListObjectFactory.create([]);
    expect(skillList1.isSupersetOfSkillList(skillList3)).toBe(true);
    expect(skillList2.isSupersetOfSkillList(skillList3)).toBe(true);
    expect(skillList3.isSupersetOfSkillList(skillList1)).toBe(false);
    expect(skillList3.isSupersetOfSkillList(skillList2)).toBe(false);

    // A list is the superset of itself, including the empty list.
    expect(skillList1.isSupersetOfSkillList(skillList1)).toBe(true);
    expect(skillList2.isSupersetOfSkillList(skillList2)).toBe(true);
    expect(skillList3.isSupersetOfSkillList(skillList3)).toBe(true);

    // A list can be made the superset of another.
    var skillList4 = SkillListObjectFactory.create([]);
    skillList4.addSkillsFromSkillList(skillList1);
    expect(skillList1.isSupersetOfSkillList(skillList4)).toBe(true);
    expect(skillList4.isSupersetOfSkillList(skillList1)).toBe(true);
    skillList4.removeSkillByIndex(0);
    expect(skillList1.isSupersetOfSkillList(skillList4)).toBe(true);
    expect(skillList4.isSupersetOfSkillList(skillList1)).toBe(false);
  });

  it('should be able to clear skills', function() {
    var skillList = SkillListObjectFactory.create(['first', 'second']);
    expect(skillList.getSkillCount()).toEqual(2);
    expect(skillList.isEmpty()).toBe(false);

    skillList.clearSkills();
    expect(skillList.isEmpty()).toBe(true);
  });

  it('should be able to retrieve a skill by its index', function() {
    var skillList = SkillListObjectFactory.create(['skill0', 'skill1']);
    expect(skillList.getSkillByIndex(1)).toEqual('skill1');
  });

  it('should fail to retrieve a skill with an invalid index', function() {
    var skillList = SkillListObjectFactory.create(['skill0', 'skill1']);
    expect(skillList.getSkillByIndex(-1)).toBeNull();
    expect(skillList.getSkillByIndex(2)).toBeNull();
  });

  it('should be able to retrieve the index of an existing skill', function() {
    var skillList = SkillListObjectFactory.create(['skill0', 'skill1']);
    expect(skillList.indexOfSkill('skill1')).toEqual(1);
  });

  it('should fail to retrieve the index of a non-existing skill', function() {
    var skillList = SkillListObjectFactory.create(['skill0', 'skill1']);
    expect(skillList.indexOfSkill('non-existent')).toEqual(-1);
  });

  it('should be able to remove skills by their index', function() {
    var skillList = SkillListObjectFactory.create(['skill0', 'skill1']);
    expect(skillList.removeSkillByIndex(1)).toBe(true);
    expect(skillList.getSkills()).toEqual(['skill0']);
  });

  it('should fail to remove skills with an invalid index', function() {
    var skillList = SkillListObjectFactory.create(['skill0', 'skill1']);
    expect(skillList.removeSkillByIndex(-1)).toBe(false);
    expect(skillList.removeSkillByIndex(2)).toBe(false);
    expect(skillList.getSkills()).toEqual(['skill0', 'skill1']);
  });

  it('should return skills in the order they were added', function() {
    _skillList.addSkill('skill2');
    _skillList.addSkill('skill0');
    _skillList.addSkill('skill1');
    expect(_skillList.getSkills()).toEqual(['skill2', 'skill0', 'skill1']);

    _skillList.removeSkillByName('skill0');
    expect(_skillList.getSkills()).toEqual(['skill2', 'skill1']);
  });

  it('should ignore changes to its returned list of skills', function() {
    var skillList = SkillListObjectFactory.create(['skill0', 'skill1']);
    expect(skillList.getSkills()).toEqual(['skill0', 'skill1']);

    var skills = skillList.getSkills();
    skills.splice(0, 1);
    expect(skillList.getSkills()).not.toEqual(skills);
    expect(skillList.getSkills()).toEqual(['skill0', 'skill1']);
  });

  it('should accept changes to its bindable list of skills', function() {
    var skillList = SkillListObjectFactory.create(['skill0', 'skill1']);
    expect(skillList.getSkills()).toEqual(['skill0', 'skill1']);

    var skills = skillList.getBindableSkills();
    skills.splice(0, 1);
    expect(skillList.getBindableSkills()).toEqual(skills);
    expect(skillList.getBindableSkills()).toEqual(['skill1']);
  });

  it('should be able to concatenate with another skill list', function() {
    var skillList1 = SkillListObjectFactory.create(['skill0', 'skill1']);
    var skillList2 = SkillListObjectFactory.create(['skill3', 'skill1']);

    // Concatenation order matters.
    skillList1.addSkillsFromSkillList(skillList2);
    expect(skillList1.getSkills()).toEqual(['skill0', 'skill1', 'skill3']);

    skillList1.setSkills(['skill0', 'skill1']);
    skillList2.addSkillsFromSkillList(skillList1);
    expect(skillList2.getSkills()).toEqual(['skill3', 'skill1', 'skill0']);
  });

  it('should be able to concatenate with itself', function() {
    _skillList.setSkills(['skill1', 'skill0']);

    expect(_skillList.getSkills()).toEqual(['skill1', 'skill0']);
    _skillList.addSkillsFromSkillList(_skillList);
    expect(_skillList.getSkills()).toEqual(['skill1', 'skill0']);
  });

  it('should be sortable', function() {
    _skillList.addSkill('skill2');
    _skillList.addSkill('skill0');
    _skillList.addSkill('skill1');
    expect(_skillList.getSkills()).toEqual(['skill2', 'skill0', 'skill1']);

    _skillList.sortSkills();
    expect(_skillList.getSkills()).toEqual(['skill0', 'skill1', 'skill2']);
  });
});
