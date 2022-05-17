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
 * @fileoverview Tests for Subtopic model.
 */

import { TestBed } from '@angular/core/testing';

import { Subtopic } from 'domain/topic/subtopic.model';

describe('Subtopic model', () => {
  let _sampleSubtopic: Subtopic;
  let skillIds = ['skill_1', 'skill_2'];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Subtopic]
    });

    let sampleSubtopicBackendObject = {
      id: 1,
      thumbnail_filename: 'image.png',
      thumbnail_bg_color: '#a33f40',
      title: 'Title',
      skill_ids: skillIds,
      url_fragment: 'title'
    };
    let sampleSkillIdToDesriptionMap = {
      skill_1: 'Description 1',
      skill_2: 'Description 2'
    };
    _sampleSubtopic = Subtopic.create(
      sampleSubtopicBackendObject, sampleSkillIdToDesriptionMap);
  });

  it('should not find issues with a valid subtopic', () => {
    expect(_sampleSubtopic.validate()).toEqual([]);
  });

  it('should be able to increment and decrement the id', () => {
    expect(_sampleSubtopic.incrementId()).toEqual(2);
    expect(_sampleSubtopic.decrementId()).toEqual(1);
  });

  it('should return correct url fragment', () => {
    expect(_sampleSubtopic.getUrlFragment()).toEqual('title');

    _sampleSubtopic.setUrlFragment('test');
    expect(_sampleSubtopic.getUrlFragment()).toEqual('test');
  });

  it('should return the skill ids', () => {
    expect(_sampleSubtopic.getSkillIds()).toEqual(skillIds);
  });

  it('should correctly prepublish validate a story', () => {
    expect(_sampleSubtopic.prepublishValidate()).toEqual([]);
    _sampleSubtopic.setThumbnailFilename('');
    expect(_sampleSubtopic.prepublishValidate()).toEqual([
      'Subtopic Title should have a thumbnail.']);
  });

  it('should validate the url fragment', () => {
    _sampleSubtopic.setUrlFragment('title1');

    expect(
      _sampleSubtopic.validate()
    ).toEqual(['Subtopic url fragment is invalid.']);
  });

  it('should validate the subtopic title', () => {
    _sampleSubtopic.setTitle('');

    expect(
      _sampleSubtopic.validate()
    ).toEqual(['Subtopic title should not be empty']);
  });

  it('should check for duplicate skill in subtopic', () => {
    // We have to create a new subtopic because duplicate skills cannot be
    // added by addSkill() method.
    let dummySkillIds = ['skill_1', 'skill_2', 'skill_1'];
    let sampleSubtopicBackendObject = {
      id: 1,
      thumbnail_filename: 'image.png',
      thumbnail_bg_color: '#a33f40',
      title: 'Title',
      skill_ids: dummySkillIds,
      url_fragment: 'title'
    };
    let sampleSkillIdToDesriptionMap = {
      skill_1: 'Description 1',
      skill_2: 'Description 2',
      // @ts-ignore
      skill_1: 'Description 3' // eslint-disable-line no-dupe-keys
    };
    let dummySampleSubtopic = Subtopic.create(
      sampleSubtopicBackendObject, sampleSkillIdToDesriptionMap);

    expect(
      dummySampleSubtopic.validate()
    ).toEqual([
      'The skill with id skill_1 is duplicated in subtopic with id 1',
      'The skill with id skill_1 is duplicated in subtopic with id 1'
    ]);
  });

  it('should be able to create a subtopic object with given title and id',
    () => {
      let subtopic = Subtopic.createFromTitle(2, 'Title2');
      expect(subtopic.getId()).toBe(2);
      expect(subtopic.getTitle()).toBe('Title2');
      expect(subtopic.getSkillSummaries()).toEqual([]);
    });

  it('should be able to add new skill', () => {
    _sampleSubtopic.addSkill('skill_3', 'Description 3');
    expect(_sampleSubtopic.getSkillSummaries().length).toEqual(3);
    expect(_sampleSubtopic.getSkillSummaries()[0].getId()).toEqual('skill_1');
    expect(
      _sampleSubtopic.getSkillSummaries()[0].getDescription()
    ).toEqual('Description 1');
    expect(_sampleSubtopic.getSkillSummaries()[1].getId()).toEqual('skill_2');
    expect(
      _sampleSubtopic.getSkillSummaries()[1].getDescription()
    ).toEqual('Description 2');
    expect(_sampleSubtopic.getSkillSummaries()[2].getId()).toEqual('skill_3');
    expect(
      _sampleSubtopic.getSkillSummaries()[2].getDescription()
    ).toEqual('Description 3');
  });

  it('should not add duplicate elements to skill ids list', () => {
    expect(_sampleSubtopic.addSkill('skill_1', 'Description 1')).toEqual(false);
  });

  it('should correctly remove a skill id', () => {
    _sampleSubtopic.removeSkill('skill_1');
    expect(_sampleSubtopic.getSkillSummaries().length).toEqual(1);
    expect(_sampleSubtopic.getSkillSummaries()[0].getId()).toEqual('skill_2');
    expect(
      _sampleSubtopic.getSkillSummaries()[0].getDescription()
    ).toEqual('Description 2');
  });

  it('should check if skill is present before removing', () => {
    expect(() => {
      _sampleSubtopic.removeSkill('skill_3');
    }).toThrowError('The given skill doesn\'t exist in the subtopic');
  });

  it('should return correct thumbnail filename', () => {
    expect(_sampleSubtopic.getThumbnailFilename()).toEqual('image.png');

    _sampleSubtopic.setThumbnailFilename('test.png');
    expect(_sampleSubtopic.getThumbnailFilename()).toEqual('test.png');
  });

  it('should return correct thumbnail background color', () => {
    expect(_sampleSubtopic.getThumbnailBgColor()).toEqual('#a33f40');

    _sampleSubtopic.setThumbnailBgColor('#3f3fa3');
    expect(_sampleSubtopic.getThumbnailBgColor()).toEqual('#3f3fa3');
  });
});
