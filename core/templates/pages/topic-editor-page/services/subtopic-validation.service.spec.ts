// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SubtopicValidationService.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { Subtopic } from 'domain/topic/subtopic.model';
import { Topic } from 'domain/topic/topic-object.model';
import { SubtopicValidationService } from './subtopic-validation.service';
import { TopicEditorStateService } from './topic-editor-state.service';

describe('Subtopic validation service', () => {
  let subtopicValidationService: SubtopicValidationService;
  let topicEditorStateService: TopicEditorStateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        TopicEditorStateService,
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    subtopicValidationService = TestBed.inject(SubtopicValidationService);
    topicEditorStateService = TestBed.inject(TopicEditorStateService);

    let topic = new Topic(
      'id', 'Topic name loading', 'Abbrev. name loading',
      'Url Fragment loading', 'Topic description loading', 'en',
      [], [], [], 1, 1, [], 'str', '', {}, false, '', '', []
    );
    let subtopic1 = Subtopic.createFromTitle(1, 'Subtopic1');
    subtopic1.setUrlFragment('subtopic-one');
    let subtopic2 = Subtopic.createFromTitle(1, 'Subtopic2');
    subtopic2.setUrlFragment('subtopic-two');
    let subtopic3 = Subtopic.createFromTitle(1, 'Subtopic3');
    subtopic3.setUrlFragment('subtopic-three');
    topic.getSubtopics = () => {
      return [subtopic1, subtopic2, subtopic3];
    };
    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);
  });

  it('should validate subtopic name correctly', () => {
    expect(subtopicValidationService.checkValidSubtopicName(
      'Random name')).toEqual(true);
    expect(subtopicValidationService.checkValidSubtopicName(
      'Subtopic1')).toEqual(false);
    expect(subtopicValidationService.checkValidSubtopicName(
      'Subtopic2')).toEqual(false);
    expect(subtopicValidationService.checkValidSubtopicName(
      'Subtopic3')).toEqual(false);
    expect(subtopicValidationService.checkValidSubtopicName(
      'Subtopic4')).toEqual(true);
  });

  it('should validate if subtopic with url fragment exists', () => {
    expect(subtopicValidationService.doesSubtopicWithUrlFragmentExist(
      'random-name')).toEqual(false);
    expect(subtopicValidationService.doesSubtopicWithUrlFragmentExist(
      'subtopic-one')).toEqual(true);
    expect(subtopicValidationService.doesSubtopicWithUrlFragmentExist(
      'subtopic-two')).toEqual(true);
    expect(subtopicValidationService.doesSubtopicWithUrlFragmentExist(
      'subtopic-three')).toEqual(true);
    expect(subtopicValidationService.doesSubtopicWithUrlFragmentExist(
      'subtopic-four')).toEqual(false);
  });

  it('should validate url fragement', () => {
    expect(subtopicValidationService.isUrlFragmentValid('CAPITAL_INVALID'))
      .toBeFalse();
    expect(subtopicValidationService.isUrlFragmentValid('valid-fragement'))
      .toBeTrue();
  });
});
