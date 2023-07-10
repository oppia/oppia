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

import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/compiler';
import { EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { Subtopic } from 'domain/topic/subtopic.model';
import { TopicUpdateService } from 'domain/topic/topic-update.service';
import { Topic, TopicBackendDict } from 'domain/topic/topic-object.model';
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

interface ContainerModel<T> {
  id: string;
  data: T[];
  index: number;
}

class DragAndDropEventClass<T> {
  createInContainerEvent(
      containerId: string, data: T[], fromIndex: number, toIndex: number
  ): CdkDragDrop<T[], T[]> {
    const event = this.createEvent(fromIndex, toIndex);
    const container = { id: containerId, data: data };
    event.container = container as CdkDropList<T[]>;
    event.previousContainer = event.container;
    event.item = { data: data[fromIndex] } as CdkDrag<T>;
    return event;
  }

  createCrossContainerEvent(
      from: ContainerModel<T>, to: ContainerModel<T>
  ): CdkDragDrop<T[], T[]> {
    const event = this.createEvent(from.index, to.index);
    event.container = this.createContainer(to);
    event.previousContainer = this.createContainer(from);
    event.item = { data: from.data[from.index] } as CdkDrag<T>;
    return event;
  }

  private createEvent(
      previousIndex: number, currentIndex: number
  ): CdkDragDrop<T[], T[]> {
    return {
      previousIndex: previousIndex,
      currentIndex: currentIndex,
      isPointerOverContainer: true,
      distance: { x: 0, y: 0 }
    } as CdkDragDrop<T[], T[]>;
  }

  private createContainer(
      model: ContainerModel<T>
  ): CdkDropList<T[]> {
    const container = { id: model.id, data: model.data };
    return container as CdkDropList<T[]>;
  }
}

describe('Rearrange Skills In Subtopic Modal Component', () => {
  let component: RearrangeSkillsInSubtopicsModalComponent;
  let fixture: ComponentFixture<RearrangeSkillsInSubtopicsModalComponent>;
  let topicEditorStateService: TopicEditorStateService;
  let topicUpdateService: TopicUpdateService;
  let topicInitializedEventEmitter = new EventEmitter();
  let topicReinitializedEventEmitter = new EventEmitter();
  let topic: Topic;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        RearrangeSkillsInSubtopicsModalComponent
      ],
      providers: [
        TopicEditorStateService,
        TopicUpdateService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    let sampleTopicBackendObject = {
      topicDict: {
        id: 'sample_topic_id',
        name: 'Topic name',
        description: 'Topic description',
        version: 1,
        uncategorized_skill_ids: ['skill_1'],
        canonical_story_references: [{
          story_id: 'story_1',
          story_is_published: true
        }, {
          story_id: 'story_2',
          story_is_published: true
        }, {
          story_id: 'story_3',
          story_is_published: true
        }],
        additional_story_references: [{
          story_id: 'story_2',
          story_is_published: true
        }],
        subtopics: [{
          id: 1,
          title: 'Title',
          skill_ids: ['skill_2']
        }],
        next_subtopic_id: 2,
        language_code: 'en',
        skill_ids_for_diagnostic_test: []
      },
      skillIdToDescriptionDict: {
        skill_1: 'Description 1',
        skill_2: 'Description 2'
      }
    };

    fixture = TestBed.createComponent(
      RearrangeSkillsInSubtopicsModalComponent
    );
    component = fixture.componentInstance;
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
    topicUpdateService = TestBed.inject(TopicUpdateService);
    let subtopic = Subtopic.createFromTitle(1, 'subtopic1');
    topic = Topic.create(
      sampleTopicBackendObject.topicDict as TopicBackendDict,
      sampleTopicBackendObject.skillIdToDescriptionDict);
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

  it('should not call TopicUpdateService when skill is moved to same subtopic',
    () => {
      const dragAndDropEventClass = (
        new DragAndDropEventClass<ShortSkillSummary>());
      const containerData = [
      {} as ShortSkillSummary
      ];
      const dragDropEvent = dragAndDropEventClass.createInContainerEvent(
        'selectedItems', containerData, 1, 0);
      let removeSkillSpy = spyOn(topicUpdateService, 'removeSkillFromSubtopic');
      component.onMoveSkillEnd(dragDropEvent, null);
      expect(removeSkillSpy).not.toHaveBeenCalled();
    });

  it('should call TopicUpdateService when skill is moved', () => {
    const event = {
      previousIndex: 1,
      currentIndex: 2,
      previousContainer: {
        data: ['1', '2']
      },
      container: {
        data: ['3']
      },
      item: {}
    } as unknown as CdkDragDrop<ShortSkillSummary[]>;
    let moveSkillSpy = spyOn(topicUpdateService, 'moveSkillToSubtopic');
    component.onMoveSkillEnd(event, 1);
    expect(moveSkillSpy).toHaveBeenCalled();
  });

  it('should call TopicUpdateService when skill is removed from subtopic',
    () => {
      const event = {
        previousIndex: 1,
        currentIndex: 1,
        previousContainer: {
          data: ['1', '2']
        },
        container: {
          data: ['1']
        },
        item: {}
      } as unknown as CdkDragDrop<ShortSkillSummary[]>;
      let removeSkillSpy = spyOn(topicUpdateService, 'removeSkillFromSubtopic');
      component.oldSubtopicId = 1;
      component.onMoveSkillEnd(event, null);
      expect(removeSkillSpy).toHaveBeenCalled();
    });

  it('should call TopicUpdateService when new Subtopic Id is null',
    () => {
      const event = {
        previousIndex: 1,
        currentIndex: 1,
        previousContainer: {
          data: ['1']
        },
        container: {
          data: ['1']
        },
        item: {}
      } as unknown as CdkDragDrop<ShortSkillSummary[]>;

      let removeSkillSpy = spyOn(topicUpdateService, 'removeSkillFromSubtopic');
      component.oldSubtopicId = null;
      component.onMoveSkillEnd(event, null);
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
      let skillSummary = {
        getDescription: () => {
          return null;
        }
      };
      component.isSkillDeleted(skillSummary as ShortSkillSummary);
    });
});
