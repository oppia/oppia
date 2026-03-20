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

import {CdkDrag, CdkDragDrop, CdkDropList} from '@angular/cdk/drag-drop';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/compiler';
import {EventEmitter} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';
import {Subtopic} from 'domain/topic/subtopic.model';
import {TopicUpdateService} from 'domain/topic/topic-update.service';
import {Topic, TopicBackendDict} from 'domain/topic/topic-object.model';
import {TopicEditorStateService} from '../services/topic-editor-state.service';
import {RearrangeSkillsInSubtopicsModalComponent} from './rearrange-skills-in-subtopics-modal.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {SubtopicValidationService} from '../services/subtopic-validation.service';

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
    containerId: string,
    data: T[],
    fromIndex: number,
    toIndex: number
  ): CdkDragDrop<T[], T[]> {
    const event = this.createEvent(fromIndex, toIndex);
    const container = {id: containerId, data: data};
    event.container = container as CdkDropList<T[]>;
    event.previousContainer = event.container;
    event.item = {data: data[fromIndex]} as CdkDrag<T>;
    return event;
  }

  createCrossContainerEvent(
    from: ContainerModel<T>,
    to: ContainerModel<T>
  ): CdkDragDrop<T[], T[]> {
    const event = this.createEvent(from.index, to.index);
    event.container = this.createContainer(to);
    event.previousContainer = this.createContainer(from);
    event.item = {data: from.data[from.index]} as CdkDrag<T>;
    return event;
  }

  private createEvent(
    previousIndex: number,
    currentIndex: number
  ): CdkDragDrop<T[], T[]> {
    return {
      previousIndex: previousIndex,
      currentIndex: currentIndex,
      isPointerOverContainer: true,
      distance: {x: 0, y: 0},
    } as CdkDragDrop<T[], T[]>;
  }

  private createContainer(model: ContainerModel<T>): CdkDropList<T[]> {
    const container = {id: model.id, data: model.data};
    return container as CdkDropList<T[]>;
  }
}

describe('Rearrange Skills In Subtopic Modal Component', () => {
  let component: RearrangeSkillsInSubtopicsModalComponent;
  let fixture: ComponentFixture<RearrangeSkillsInSubtopicsModalComponent>;
  let topicEditorStateService: TopicEditorStateService;
  let topicUpdateService: TopicUpdateService;
  let urlInterpolationService: UrlInterpolationService;
  let subtopicValidationService: SubtopicValidationService;
  let topicInitializedEventEmitter = new EventEmitter();
  let topicReinitializedEventEmitter = new EventEmitter();
  let topic: Topic;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [RearrangeSkillsInSubtopicsModalComponent],
      providers: [
        TopicEditorStateService,
        TopicUpdateService,
        UrlInterpolationService,
        SubtopicValidationService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    let sampleTopicBackendObject = {
      topicDict: {
        id: 'sample_topic_id',
        name: 'Topic name',
        abbreviated_name: 'topic',
        url_fragment: 'topic-name',
        description: 'Topic description',
        version: 1,
        uncategorized_skill_ids: ['skill_1'],
        canonical_story_references: [
          {
            story_id: 'story_1',
            story_is_published: true,
          },
          {
            story_id: 'story_2',
            story_is_published: true,
          },
          {
            story_id: 'story_3',
            story_is_published: true,
          },
        ],
        additional_story_references: [
          {
            story_id: 'story_2',
            story_is_published: true,
          },
        ],
        subtopics: [
          {
            id: 1,
            title: 'Title',
            skill_ids: ['skill_2'],
            thumbnail_filename: 'thumbnail.svg',
            thumbnail_bg_color: '#C6DCDA',
            url_fragment: 'title',
          },
        ],
        next_subtopic_id: 2,
        language_code: 'en',
        skill_ids_for_diagnostic_test: [],
        thumbnail_filename: 'thumbnail.svg',
        thumbnail_bg_color: '#C6DCDA',
        practice_tab_is_displayed: false,
        meta_tag_content: 'topic meta tag',
        page_title_fragment_for_web: 'topic page title',
      } as TopicBackendDict,
      skillIdToDescriptionDict: {
        skill_1: 'Description 1',
        skill_2: 'Description 2',
      },
    };

    fixture = TestBed.createComponent(RearrangeSkillsInSubtopicsModalComponent);
    component = fixture.componentInstance;
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
    topicUpdateService = TestBed.inject(TopicUpdateService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    subtopicValidationService = TestBed.inject(SubtopicValidationService);
    let subtopic = Subtopic.createFromTitle(1, 'subtopic1');
    topic = Topic.create(
      sampleTopicBackendObject.topicDict as TopicBackendDict,
      sampleTopicBackendObject.skillIdToDescriptionDict
    );
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
    let skillSummary = ShortSkillSummary.create('1', 'Skill description');
    component.onMoveSkillStart(1, skillSummary);
    expect(component.skillSummaryToMove).toEqual(skillSummary);
    expect(component.oldSubtopicId).toEqual(1);
  });

  it('should not call TopicUpdateService when skill is moved to same subtopic', () => {
    const dragAndDropEventClass =
      new DragAndDropEventClass<ShortSkillSummary>();
    const containerData = [{} as ShortSkillSummary];
    const dragDropEvent = dragAndDropEventClass.createInContainerEvent(
      'selectedItems',
      containerData,
      1,
      0
    );
    let removeSkillSpy = spyOn(topicUpdateService, 'removeSkillFromSubtopic');
    component.ngOnInit();
    component.onMoveSkillEnd(dragDropEvent, null);
    expect(removeSkillSpy).not.toHaveBeenCalled();
  });

  it('should call TopicUpdateService when skill is moved', () => {
    const previousData = [
      ShortSkillSummary.create('1', 'Skill 1'),
      ShortSkillSummary.create('2', 'Skill 2'),
    ];

    const containerData = [ShortSkillSummary.create('3', 'Skill 3')];

    const previousContainer = {
      id: 'prev',
      data: previousData,
    } as CdkDropList<ShortSkillSummary[]>;

    const container = {
      id: 'curr',
      data: containerData,
    } as CdkDropList<ShortSkillSummary[]>;

    const event: CdkDragDrop<ShortSkillSummary[]> = {
      previousIndex: 1,
      currentIndex: 0,
      previousContainer,
      container,
      item: {data: previousData[1]} as CdkDrag<ShortSkillSummary>,
      isPointerOverContainer: true,
      distance: {x: 0, y: 0},
    };

    let moveSkillSpy = spyOn(topicUpdateService, 'moveSkillToSubtopic');
    component.ngOnInit();
    let skillSummary = ShortSkillSummary.create('1', 'Skill description');
    component.onMoveSkillStart(2, skillSummary);
    component.onMoveSkillEnd(event, 1);
    expect(moveSkillSpy).toHaveBeenCalled();
  });

  it('should call TopicUpdateService when skill is removed from subtopic', () => {
    const previousData = [
      ShortSkillSummary.create('1', 'Skill 1'),
      ShortSkillSummary.create('2', 'Skill 2'),
    ];

    const containerData = [ShortSkillSummary.create('1', 'Skill 1')];

    const previousContainer = {
      id: 'prev',
      data: previousData,
    } as CdkDropList<ShortSkillSummary[]>;

    const container = {
      id: 'curr',
      data: containerData,
    } as CdkDropList<ShortSkillSummary[]>;

    const event: CdkDragDrop<ShortSkillSummary[]> = {
      previousIndex: 1,
      currentIndex: 0,
      previousContainer,
      container,
      item: {data: previousData[1]} as CdkDrag<ShortSkillSummary>,
      isPointerOverContainer: true,
      distance: {x: 0, y: 0},
    };

    let removeSkillSpy = spyOn(topicUpdateService, 'removeSkillFromSubtopic');
    component.ngOnInit();
    let skillSummary = ShortSkillSummary.create('1', 'Skill description');
    component.onMoveSkillStart(1, skillSummary);
    component.onMoveSkillEnd(event, null);
    expect(removeSkillSpy).toHaveBeenCalled();
  });

  it('should call TopicUpdateService when new Subtopic Id is null', () => {
    const previousData = [
      ShortSkillSummary.create('1', 'Skill 1'),
      ShortSkillSummary.create('2', 'Skill 2'),
    ];

    const containerData = [ShortSkillSummary.create('1', 'Skill 1')];

    const previousContainer = {
      id: 'prev',
      data: previousData,
    } as CdkDropList<ShortSkillSummary[]>;

    const container = {
      id: 'curr',
      data: containerData,
    } as CdkDropList<ShortSkillSummary[]>;

    const event: CdkDragDrop<ShortSkillSummary[]> = {
      previousIndex: 1,
      currentIndex: 0,
      previousContainer,
      container,
      item: {data: previousData[1]} as CdkDrag<ShortSkillSummary>,
      isPointerOverContainer: true,
      distance: {x: 0, y: 0},
    };

    let removeSkillSpy = spyOn(topicUpdateService, 'removeSkillFromSubtopic');
    component.ngOnInit();
    component.skillSummaryToMove = ShortSkillSummary.create('1', 'Skill 1');
    component.oldSubtopicId = null;
    component.onMoveSkillEnd(event, null);
    expect(removeSkillSpy).not.toHaveBeenCalled();
  });

  it('should not call TopicUpdateService if subtopic name validation fails', () => {
    component.ngOnInit();
    component.editableName = 'subtopic1';
    let subtopicTitleSpy = spyOn(topicUpdateService, 'setSubtopicTitle');
    component.updateSubtopicTitle(1);
    expect(subtopicTitleSpy).not.toHaveBeenCalled();
  });

  it('should call TopicUpdateService to update subtopic title', () => {
    component.ngOnInit();
    component.editableName = 'new unique title';
    let subtopicTitleSpy = spyOn(topicUpdateService, 'setSubtopicTitle');
    component.updateSubtopicTitle(1);
    expect(subtopicTitleSpy).toHaveBeenCalled();
  });

  it('should call set and reset the selected subtopic index', () => {
    component.editNameOfSubtopicWithId(1);
    expect(component.selectedSubtopicId).toEqual(1);
    component.editNameOfSubtopicWithId(10);
    expect(component.selectedSubtopicId).toEqual(10);
    component.editNameOfSubtopicWithId(null);
    expect(component.editableName).toEqual('');
    expect(component.selectedSubtopicId).toEqual(null);
  });

  it('should call initEditor on calls from topic being initialized', () => {
    topicInitializedEventEmitter = new EventEmitter();
    topicReinitializedEventEmitter = new EventEmitter();

    spyOnProperty(topicEditorStateService, 'onTopicInitialized').and.callFake(
      () => {
        return topicInitializedEventEmitter;
      }
    );
    spyOnProperty(topicEditorStateService, 'onTopicReinitialized').and.callFake(
      () => {
        return topicReinitializedEventEmitter;
      }
    );
    spyOn(component, 'initEditor').and.callThrough();
    component.ngOnInit();
    expect(component.initEditor).toHaveBeenCalledTimes(1);
    topicInitializedEventEmitter.emit();
    expect(component.initEditor).toHaveBeenCalledTimes(2);
    topicReinitializedEventEmitter.emit();
    expect(component.initEditor).toHaveBeenCalledTimes(3);
  });

  it('should set oldSubtopicId to null when oldSubtopicId is falsy in onMoveSkillStart', () => {
    let skillSummary = ShortSkillSummary.create('1', 'Skill description');
    component.onMoveSkillStart(0, skillSummary);
    expect(component.oldSubtopicId).toBeNull();
  });

  it('should return false when skill description exists in isSkillDeleted', () => {
    let skillSummary = ShortSkillSummary.create('1', 'Skill description');
    expect(component.isSkillDeleted(skillSummary)).toBeFalsy();
  });

  it('should reset editableName when editNameOfSubtopicWithId is called with null', () => {
    component.editableName = 'some name';
    component.selectedSubtopicId = 5;
    component.editNameOfSubtopicWithId(null);
    expect(component.editableName).toEqual('');
    expect(component.selectedSubtopicId).toEqual(null);
  });

  it('should not call removeSkillFromSubtopic when newSubtopicId equals oldSubtopicId', () => {
    const previousData = [
      ShortSkillSummary.create('1', 'Skill 1'),
      ShortSkillSummary.create('2', 'Skill 2'),
    ];

    const containerData = [ShortSkillSummary.create('3', 'Skill 3')];

    const previousContainer = {
      id: 'prev',
      data: previousData,
    } as CdkDropList<ShortSkillSummary[]>;

    const container = {
      id: 'curr',
      data: containerData,
    } as CdkDropList<ShortSkillSummary[]>;

    const event: CdkDragDrop<ShortSkillSummary[]> = {
      previousIndex: 1,
      currentIndex: 0,
      previousContainer,
      container,
      item: {data: previousData[1]} as CdkDrag<ShortSkillSummary>,
      isPointerOverContainer: true,
      distance: {x: 0, y: 0},
    };

    let removeSkillSpy = spyOn(topicUpdateService, 'removeSkillFromSubtopic');
    component.ngOnInit();
    let skillSummary = ShortSkillSummary.create('1', 'Skill description');
    component.onMoveSkillStart(1, skillSummary);
    component.onMoveSkillEnd(event, 1);
    expect(removeSkillSpy).not.toHaveBeenCalled();
  });

  it('should call moveItemInArray when item is moved within the same container', () => {
    const containerData = [
      ShortSkillSummary.create('1', 'Skill 1'),
      ShortSkillSummary.create('2', 'Skill 2'),
      ShortSkillSummary.create('3', 'Skill 3'),
    ];
    const container = {
      id: 'sameContainer',
      data: containerData,
    };
    const event = {
      previousIndex: 0,
      currentIndex: 2,
      previousContainer: container,
      container: container,
      item: {data: containerData[0]},
    } as CdkDragDrop<ShortSkillSummary[]>;

    let moveSkillSpy = spyOn(topicUpdateService, 'moveSkillToSubtopic');
    let removeSkillSpy = spyOn(topicUpdateService, 'removeSkillFromSubtopic');
    component.ngOnInit();
    let skillSummary = ShortSkillSummary.create('1', 'Skill 1');
    component.onMoveSkillStart(1, skillSummary);
    component.onMoveSkillEnd(event, 1);

    expect(moveSkillSpy).not.toHaveBeenCalled();
    expect(removeSkillSpy).not.toHaveBeenCalled();
  });

  it('should set error message when subtopic name validation fails', () => {
    spyOn(subtopicValidationService, 'checkValidSubtopicName').and.returnValue(
      false
    );
    component.ngOnInit();
    component.editableName = 'duplicate name';
    component.updateSubtopicTitle(1);
    expect(component.errorMsg).toEqual(
      'A subtopic with this title already exists'
    );
  });

  it('should initialize subtopics and uncategorizedSkillSummaries in initEditor', () => {
    component.ngOnInit();
    expect(component.subtopics).toBeDefined();
    expect(component.uncategorizedSkillSummaries).toBeDefined();
    expect(component.subtopics).toEqual(topic.getSubtopics());
    expect(component.uncategorizedSkillSummaries).toEqual(
      topic.getUncategorizedSkillSummaries()
    );
  });

  it('should call urlInterpolationService.interpolateUrl with correct params', () => {
    let interpolateSpy = spyOn(
      urlInterpolationService,
      'interpolateUrl'
    ).and.callThrough();
    component.getSkillEditorUrl('test_skill_id');
    expect(interpolateSpy).toHaveBeenCalledWith('/skill_editor/<skillId>', {
      skillId: 'test_skill_id',
    });
  });

  it('should have maxCharsInSubtopicTitle set from AppConstants', () => {
    expect(component.maxCharsInSubtopicTitle).toBeDefined();
    expect(typeof component.maxCharsInSubtopicTitle).toBe('number');
  });

  it('should initialize editableName to empty string on ngOnInit', () => {
    component.ngOnInit();
    expect(component.editableName).toEqual('');
  });

  it('should call editNameOfSubtopicWithId(null) after successful title update', () => {
    spyOn(subtopicValidationService, 'checkValidSubtopicName').and.returnValue(
      true
    );
    spyOn(topicUpdateService, 'setSubtopicTitle');
    spyOn(component, 'editNameOfSubtopicWithId').and.callThrough();

    component.ngOnInit();
    component.editableName = 'valid new title';
    component.updateSubtopicTitle(1);

    expect(component.editNameOfSubtopicWithId).toHaveBeenCalledWith(null);
    expect(component.editableName).toEqual('');
    expect(component.selectedSubtopicId).toEqual(null);
  });

  it('should call initEditor after onMoveSkillEnd completes skill transfer', () => {
    const previousData = [ShortSkillSummary.create('1', 'Skill 1')];

    const containerData = [ShortSkillSummary.create('2', 'Skill 2')];

    const previousContainer = {
      id: 'prev',
      data: previousData,
    } as CdkDropList<ShortSkillSummary[]>;

    const container = {
      id: 'curr',
      data: containerData,
    } as CdkDropList<ShortSkillSummary[]>;

    const event: CdkDragDrop<ShortSkillSummary[]> = {
      previousIndex: 0,
      currentIndex: 0,
      previousContainer,
      container,
      item: {data: previousData[0]} as CdkDrag<ShortSkillSummary>,
      isPointerOverContainer: true,
      distance: {x: 0, y: 0},
    };

    spyOn(topicUpdateService, 'moveSkillToSubtopic');
    spyOn(component, 'initEditor').and.callThrough();

    component.ngOnInit();
    let skillSummary = ShortSkillSummary.create('1', 'Skill description');
    component.onMoveSkillStart(1, skillSummary);
    component.onMoveSkillEnd(event, 2);

    expect(component.initEditor).toHaveBeenCalledTimes(2);
  });

  it('should unsubscribe from directiveSubscriptions on ngOnDestroy', () => {
    component.ngOnInit();
    spyOn(component.directiveSubscriptions, 'unsubscribe');
    component.ngOnDestroy();
    expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });
});
