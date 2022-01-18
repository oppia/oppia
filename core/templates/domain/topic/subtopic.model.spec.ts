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

describe('Subtopic object factory', () => {
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

  it('should be able to increment the id', () => {
    expect(_sampleSubtopic.incrementId()).toEqual(2);
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

  it('should validate the subtopic', () => {
    _sampleSubtopic.setTitle('');

    expect(
      _sampleSubtopic.validate()
    ).toEqual(['Subtopic title should not be empty']);
  });

  it('should be able to create a subtopic object with given title and id',
    () => {
      let subtopic = Subtopic.createFromTitle(2, 'Title2');
      expect(subtopic.getId()).toBe(2);
      expect(subtopic.getTitle()).toBe('Title2');
      expect(subtopic.getSkillSummaries()).toEqual([]);
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
});
