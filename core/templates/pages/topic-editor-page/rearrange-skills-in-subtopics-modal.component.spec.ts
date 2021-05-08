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
 * @fileoverview Unit tests for RearrangeSkillsInSubtopicsModalController.
 */

import { DragDropModule } from '@angular/cdk/drag-drop';
import { EventEmitter, Injectable, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { Subtopic } from 'domain/topic/subtopic.model';
import { TopicUpdateService } from 'domain/topic/topic-update.service';
import { Topic, TopicObjectFactory } from 'domain/topic/TopicObjectFactory';

import { RearrangeSkillsInSubtopicsModalComponent } from './rearrange-skills-in-subtopics-modal.component';

describe('Rearrange Skills In Subtopic Modal Controller', () => {
  let fixture: ComponentFixture<RearrangeSkillsInSubtopicsModalComponent>;
  let component: RearrangeSkillsInSubtopicsModalComponent;
  var topic = null;
  var topicEditorStateService: TopicEditorStateService;
  var topicUpdateService;
  var topicObjectFactory;
  var topicInitializedEventEmitter = null;
  var topicReinitializedEventEmitter = null;

  class TopicEditorStateService {
    private tiEventEmitter = new EventEmitter();
    private triEventEmitter = new EventEmitter();
    topic: Topic;
    get onTopicInitialized() {
      return this.tiEventEmitter;
    }
    get onTopicReinitialized() {
      return this.triEventEmitter;
    }
    getTopic() {
      return this.topic;
    }
  }

  class MockTopicEditorStateService {
    private tiEventEmitter = new EventEmitter();
    private triEventEmitter = new EventEmitter();
    topic: Topic;
    get onTopicInitialized() {
      return this.tiEventEmitter;
    }
    get onTopicReinitialized() {
      return this.triEventEmitter;
    }
    getTopic() {
      return this.topic;
    }
  }

  @Injectable()
  class SubtopicValidationService {
    constructor(private tess: TopicEditorStateService) {}
    checkValidSubtopicName(title) {
      var subtopicTitles = [];
      var topic = this.tess.getTopic();
      topic.getSubtopics().forEach(
        function(subtopic) {
          subtopicTitles.push(subtopic.getTitle());
        });
      return subtopicTitles.indexOf(title) === -1;
    }
  }

  class MockNgbActiveModal {
    close<T>(value: T): T {
      return value;
    }
    dismiss<T>(value: T | 'cancel' = 'cancel'): T | 'cancel' {
      return value;
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DragDropModule],
      declarations: [RearrangeSkillsInSubtopicsModalComponent],
      providers: [
        {
          provide: TopicEditorStateService,
          useClass: MockTopicEditorStateService
        },
        {
          provide: NgbActiveModal,
          useClass: MockNgbActiveModal
        },
        SubtopicValidationService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(RearrangeSkillsInSubtopicsModalComponent);
    component = fixture.componentInstance;
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
    topicObjectFactory = TestBed.inject(TopicObjectFactory);
    topicUpdateService = TestBed.inject(TopicUpdateService);
    // $uibModalInstance = TestBed.inject('$uibModal');
    var subtopic = Subtopic.createFromTitle(1, 'subtopic1');
    topic = topicObjectFactory.createInterstitialTopic();
    topic._subtopics = [subtopic];
    topicEditorStateService.topic = topic;
    component.topicEditorStateService = topicEditorStateService;
    component.subtopicValidationService = TestBed.inject(
      SubtopicValidationService);
  }));

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize the variables', () => {
    component.ngOnInit();
    expect(component.topic).toEqual(topic);
  });

  it('should get skill editor url', () => {
    expect(component.getSkillEditorUrl('1')).toBe('/skill_editor/1');
  });

  it('should record skill summary to move and subtopic Id', () => {
    var skillSummary = ShortSkillSummary.create(
      '1', 'Skill description');
    component.onMoveSkillStart(1, skillSummary);
    expect(component.skillSummaryToMove).toEqual(skillSummary);
    expect(component.oldSubtopicId).toEqual(1);
  });

  it('should call TopicUpdateService when skill is moved', waitForAsync(() => {
    var moveSkillSpy = spyOn(topicUpdateService, 'moveSkillToSubtopic');
    component.onMoveSkillEnd(1);
    component.onMouseDownOnCdkDrag();
    expect(moveSkillSpy).toHaveBeenCalled();
  }));

  it('should call TopicUpdateService when skill is removed from subtopic',
    () => {
      var removeSkillSpy = spyOn(topicUpdateService, 'removeSkillFromSubtopic');
      component.onMoveSkillEnd(null);
      expect(removeSkillSpy).toHaveBeenCalled();
    });

  it('should not call TopicUpdateService when skill is moved to same subtopic',
    waitForAsync(() => {
      var removeSkillSpy = spyOn(topicUpdateService, 'removeSkillFromSubtopic');
      component.oldSubtopicId = null;
      component.onMoveSkillEnd(null);
      expect(removeSkillSpy).not.toHaveBeenCalled();
    }));

  it('should not call TopicUpdateService if subtopic name validation fails',
    () => {
      component.editableName = 'subtopic1';
      var subtopicTitleSpy = spyOn(topicUpdateService, 'setSubtopicTitle');
      component.updateSubtopicTitle(1);
      expect(subtopicTitleSpy).not.toHaveBeenCalled();
    });

  it('should call TopicUpdateService to update subtopic title', () => {
    var subtopicTitleSpy = spyOn(topicUpdateService, 'setSubtopicTitle');
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
