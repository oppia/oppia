// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Rearrange Skills In Subtopics Modal.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { Subtopic } from 'domain/topic/subtopic.model';
import { TopicUpdateService } from 'domain/topic/topic-update.service';
import { TopicObjectFactory } from 'domain/topic/TopicObjectFactory';
import { TopicEditorStateService } from '../services/topic-editor-state.service';
import { RearrangeSkillsInSubtopicsModalComponent } from './rearrange-skills-in-subtopics-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Rearrange Skills In Subtopic Modal Component', () => {
  let component: RearrangeSkillsInSubtopicsModalComponent;
  let fixture: ComponentFixture<RearrangeSkillsInSubtopicsModalComponent>;
  let topicEditorStateService: TopicEditorStateService;
  let topicUpdateService: TopicUpdateService;
  let topicObjectFactory: TopicObjectFactory;
  let topicInitializedEventEmitter = new EventEmitter();
  let topicReinitializedEventEmitter = new EventEmitter();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        RearrangeSkillsInSubtopicsModalComponent
      ],
      providers: [
        TopicEditorStateService,
        TopicUpdateService,
        TopicObjectFactory,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      RearrangeSkillsInSubtopicsModalComponent
    );
    component = fixture.componentInstance;
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
    topicObjectFactory = TestBed.inject(TopicObjectFactory);
    topicUpdateService = TestBed.inject(TopicUpdateService);
    let subtopic = Subtopic.createFromTitle(1, 'subtopic1');
    let topic = topicObjectFactory.createInterstitialTopic();
    topic._subtopics = [subtopic];
    spyOn(topicEditorStateService, 'getTopic').and.returnValue(topic);
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize the letiables', () => {
    component.ngOnInit();
    expect(component.topic).toEqual(topic);
  });

  it('should get skill editor url', () => {
    expect(component.getSkillEditorUrl('1')).toBe('/skill_editor/1');
  });

  it('should record skill summary to move and subtopic Id', () => {
    let skillSummary = ShortSkillSummary.create(
      '1', 'Skill description');
    component.onMoveSkillStart(1, skillSummary);
    expect(component.skillSummaryToMove).toEqual(skillSummary);
    expect(component.oldSubtopicId).toEqual(1);
  });

  it('should call TopicUpdateService when skill is moved', () => {
    let moveSkillSpy = spyOn(topicUpdateService, 'moveSkillToSubtopic');
    component.onMoveSkillEnd(1);
    expect(moveSkillSpy).toHaveBeenCalled();
  });

  it('should call TopicUpdateService when skill is removed from subtopic',
    () => {
      let removeSkillSpy = spyOn(topicUpdateService, 'removeSkillFromSubtopic');
      component.onMoveSkillEnd(null);
      expect(removeSkillSpy).toHaveBeenCalled();
    });

  it('should not call TopicUpdateService when skill is moved to same subtopic',
    () => {
      let removeSkillSpy = spyOn(topicUpdateService, 'removeSkillFromSubtopic');
      component.oldSubtopicId;
      component.onMoveSkillEnd(null);
      expect(removeSkillSpy).not.toHaveBeenCalled();
    });

  it('should not call TopicUpdateService if subtopic name validation fails',
    () => {
      component.editableName = 'subtopic1';
      let subtopicTitleSpy = spyOn(topicUpdateService, 'setSubtopicTitle');
      component.updateSubtopicTitle(1);
      expect(subtopicTitleSpy).not.toHaveBeenCalled();
    });

  it('should call TopicUpdateService to update subtopic title', () => {
    let subtopicTitleSpy = spyOn(topicUpdateService, 'setSubtopicTitle');
    component.updateSubtopicTitle(1);
    expect(subtopicTitleSpy).toHaveBeenCalled();
  });

  it('should call set and reset the selected subtopic index', () => {
    component.editNameOfSubtopicWithId(1);
    expect(component.selectedSubtopicId).toEqual(1);
    component.editNameOfSubtopicWithId(10);
    expect(component.selectedSubtopicId).toEqual(10);
    component.editNameOfSubtopicWithId(0);
    expect(component.editableName).toEqual('');
    expect(component.selectedSubtopicId).toEqual(0);
  });

  it('should call initEditor on calls from topic being initialized',
    () => {
      topicInitializedEventEmitter = new EventEmitter();
      topicReinitializedEventEmitter = new EventEmitter();

      spyOnProperty(topicEditorStateService, 'onTopicInitialized').and.callFake(
        () => {
          return topicInitializedEventEmitter;
        });
      spyOnProperty(
        topicEditorStateService, 'onTopicReinitialized').and.callFake(
        () => {
          return topicReinitializedEventEmitter;
        });
      spyOn(component, 'initEditor').and.callThrough();
      component.ngOnInit();
      expect(component.initEditor).toHaveBeenCalledTimes(1);
      topicInitializedEventEmitter.emit();
      expect(component.initEditor).toHaveBeenCalledTimes(2);
      topicReinitializedEventEmitter.emit();
      expect(component.initEditor).toHaveBeenCalledTimes(3);
    });
});
