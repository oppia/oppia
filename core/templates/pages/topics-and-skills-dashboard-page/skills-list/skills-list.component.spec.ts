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
 * @fileoverview Unit tests for the skills list component.
 */

import {EventEmitter} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatRadioModule} from '@angular/material/radio';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {NgbModal, NgbModalOptions} from '@ng-bootstrap/ng-bootstrap';
import {MergeSkillModalComponent} from 'components/skill-selector/merge-skill-modal.component';
import {SkillSelectorComponent} from 'components/skill-selector/skill-selector.component';
import {
  AugmentedSkillSummary,
  AugmentedSkillSummaryBackendDict,
} from 'domain/skill/augmented-skill-summary.model';
import {SkillBackendApiService} from 'domain/skill/skill-backend-api.service';
import {EditableTopicBackendApiService} from 'domain/topic/editable-topic-backend-api.service';
import {CreatorTopicSummary} from 'domain/topic/creator-topic-summary.model';
import {TopicsAndSkillsDashboardBackendApiService} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AlertsService} from 'services/alerts.service';
import {AssignSkillToTopicModalComponent} from '../modals/assign-skill-to-topic-modal.component';
import {DeleteSkillModalComponent} from '../modals/delete-skill-modal.component';
import {
  TopicNameToTopicAssignments,
  UnassignSkillFromTopicsModalComponent,
} from '../modals/unassign-skill-from-topics-modal.component';
import {SelectTopicsComponent} from '../topic-selector/select-topics.component';
import {SkillsListComponent} from './skills-list.component';

describe('Skills List Component', () => {
  let fixture: ComponentFixture<SkillsListComponent>;
  let componentInstance: SkillsListComponent;
  let topicsAndSkillsDashboardBackendApiService: MockTopicsAndSkillsDashboardBackendApiService;
  let alertsService: AlertsService;
  let mockNgbModal: MockNgbModal;
  let mockSkillBackendApiService: MockSkillBackendApiService;
  let augmentedSkillSummaryBackendDict: AugmentedSkillSummaryBackendDict = {
    id: 'test_id',
    description: 'description',
    language_code: 'sadf',
    version: 10,
    misconception_count: 0,
    worked_examples_count: 1,
    skill_model_created_on: 2,
    skill_model_last_updated: 3,
    topic_names: ['a'],
    classroom_names: ['a'],
  };
  let topicAssignmentsSummary: TopicNameToTopicAssignments = {
    topic1: {
      subtopicId: 12,
      topicVersion: 7,
      topicId: 'topic_id',
    },
  };

  class MockNgbModal {
    // Avoiding non-null assertion for modal below by suffixing '!' symbol.
    // It was done as the value of modal is not being initialized right away.
    // The modal is initialized to different values to test various components.
    modal!: string;
    success: boolean = true;
    cancelCallbackTopics: string[] | undefined = ['test_id', 'b', 'c'];
    open(
      content:
        | AssignSkillToTopicModalComponent
        | DeleteSkillModalComponent
        | MergeSkillModalComponent
        | UnassignSkillFromTopicsModalComponent,
      options: NgbModalOptions
    ) {
      if (this.modal === 'delete_skill') {
        return {
          componentInstance: {
            skillId: '',
          },
          result: {
            then: (successCallback: () => void, errorCallback: () => void) => {
              if (this.success) {
                successCallback();
              } else {
                errorCallback();
              }
              return {
                then: (callback: () => void) => {
                  callback();
                },
              };
            },
          },
        };
      } else if (this.modal === 'merge_skill') {
        return {
          componentInstance: {
            skillSummaries: null,
            skill: null,
            categorizedSkills: null,
            allowSkillsFromOtherTopics: null,
            untriagedSkillSummaries: null,
          },
          result: {
            then: (
              successCallback: (result: {
                skill: {};
                supersedingSkillId: string;
              }) => void,
              cancelCallback: () => void
            ) => {
              if (this.success) {
                successCallback({
                  skill: {},
                  supersedingSkillId: 'test_id',
                });
              } else {
                cancelCallback();
              }
            },
          },
        };
      } else if (this.modal === 'unassign_skill') {
        return {
          componentInstance: {
            skillId: '',
          },
          result: {
            then: (
              successCallback: (
                topicsToUnassign: TopicNameToTopicAssignments
              ) => void,
              cancelCallback: () => void
            ) => {
              if (this.success) {
                successCallback(topicAssignmentsSummary);
              } else {
                cancelCallback();
              }
            },
          },
        };
      } else if (this.modal === 'assign_skill_to_topic') {
        return {
          componentInstance: {
            topicSummaries: null,
          },
          result: {
            then: (
              successCallback: (skillsToAssign: string[]) => void,
              cancelCallback: (skillsToAssign?: string[]) => void
            ) => {
              if (this.success) {
                successCallback(['test_id', 'b', 'c']);
              } else {
                cancelCallback(this.cancelCallbackTopics);
              }
            },
          },
        };
      }
    }
  }

  class MockSkillBackendApiService {
    doesNotHaveSkillLinked: boolean = false;
    deleteSkillAsync(skillId: string) {
      return {
        then: (callb: () => void) => {
          callb();
          return {
            catch: (callback: (errorMessage: string) => void) => {
              if (this.doesNotHaveSkillLinked) {
                callback('does not have any skills linked');
              } else {
                callback('');
              }
            },
          };
        },
      };
    }
  }

  class MockTopicsAndSkillsDashboardBackendApiService {
    error: boolean = false;
    onTopicsAndSkillsDashboardReinitialized: EventEmitter<boolean> =
      new EventEmitter();

    mergeSkillsAsync(skillId: string, supersedingSkillId: string) {
      return {
        then: (
          successCallback: () => void,
          errorCallback: (errorMessage: {error: {error: string}}) => void
        ) => {
          if (this.error) {
            errorCallback({
              error: {
                error: 'error',
              },
            });
          } else {
            successCallback();
          }
        },
      };
    }
  }

  class MockEditableBackendApiService {
    updateTopicAsync(
      topicId: string,
      topicVersion: number,
      msg: string,
      changeList: []
    ) {
      return {
        then: (successCallback: () => void) => {
          successCallback();
          return {
            then: (successCallback: () => void) => {
              successCallback();
            },
          };
        },
      };
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatCardModule,
        MatCheckboxModule,
        MatRadioModule,
        MatProgressSpinnerModule,
        FormsModule,
      ],
      declarations: [
        SkillsListComponent,
        DeleteSkillModalComponent,
        UnassignSkillFromTopicsModalComponent,
        AssignSkillToTopicModalComponent,
        MergeSkillModalComponent,
        SelectTopicsComponent,
        SkillSelectorComponent,
      ],
      providers: [
        AlertsService,
        UrlInterpolationService,
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: EditableTopicBackendApiService,
          useClass: MockEditableBackendApiService,
        },
        {
          provide: SkillBackendApiService,
          useClass: MockSkillBackendApiService,
        },
        {
          provide: TopicsAndSkillsDashboardBackendApiService,
          useClass: MockTopicsAndSkillsDashboardBackendApiService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillsListComponent);
    componentInstance = fixture.componentInstance;
    componentInstance.skillSummaries = [];
    componentInstance.pageNumber = 0;
    componentInstance.itemsPerPage = 5;
    componentInstance.editableTopicSummaries = [];
    componentInstance.mergeableSkillSummaries = [];
    componentInstance.untriagedSkillSummaries = [];

    topicsAndSkillsDashboardBackendApiService = TestBed.inject(
      TopicsAndSkillsDashboardBackendApiService
    ) as unknown as jasmine.SpyObj<MockTopicsAndSkillsDashboardBackendApiService>;
    alertsService = TestBed.inject(AlertsService);
    alertsService = alertsService as unknown as jasmine.SpyObj<AlertsService>;
    mockNgbModal = TestBed.inject(
      NgbModal
    ) as unknown as jasmine.SpyObj<MockNgbModal>;
    mockSkillBackendApiService = TestBed.inject(
      SkillBackendApiService
    ) as unknown as jasmine.SpyObj<MockSkillBackendApiService>;
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should destroy', () => {
    spyOn(componentInstance.directiveSubscriptions, 'unsubscribe');
    componentInstance.ngOnDestroy();
    expect(
      componentInstance.directiveSubscriptions.unsubscribe
    ).toHaveBeenCalled();
  });

  it('should show edit options', () => {
    componentInstance.selectedIndex = 'test_index';
    expect(componentInstance.showEditOptions('test_index')).toBeTrue();
    expect(componentInstance.showEditOptions('test')).toBeFalse();
  });

  it('should change edit options', () => {
    componentInstance.selectedIndex = '';
    let skillId: string = 'test_id';
    componentInstance.changeEditOptions(skillId);
    expect(componentInstance.selectedIndex).toEqual(skillId);
    componentInstance.selectedIndex = 'not_empty';
    componentInstance.changeEditOptions(skillId);
    expect(componentInstance.selectedIndex).toEqual('');
  });

  it('should get serial number for skill', () => {
    expect(componentInstance.getSerialNumberForSkill(5)).toEqual(6);
  });

  it('should get skill editor url', () => {
    expect(componentInstance.getSkillEditorUrl('test_id')).toEqual(
      '/skill_editor/test_id#/'
    );
  });

  it('should delete skill', fakeAsync(() => {
    mockNgbModal.modal = 'delete_skill';
    spyOn(
      topicsAndSkillsDashboardBackendApiService.onTopicsAndSkillsDashboardReinitialized,
      'emit'
    );
    spyOn(alertsService, 'addSuccessMessage');
    componentInstance.deleteSkill('skill_id');
    tick(500);
    expect(
      topicsAndSkillsDashboardBackendApiService
        .onTopicsAndSkillsDashboardReinitialized.emit
    ).toHaveBeenCalled();
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'The skill has been deleted.',
      1000
    );
    mockSkillBackendApiService.doesNotHaveSkillLinked = true;
    componentInstance.deleteSkill('skill_id');
    tick(500);
  }));

  it('should cancel delete skill modal', () => {
    mockNgbModal.modal = 'delete_skill';
    mockNgbModal.success = false;
    componentInstance.deleteSkill('test_skill');
  });

  it('should merge skill', fakeAsync(() => {
    mockNgbModal.modal = 'merge_skill';
    spyOn(
      topicsAndSkillsDashboardBackendApiService.onTopicsAndSkillsDashboardReinitialized,
      'emit'
    );
    spyOn(alertsService, 'addSuccessMessage');
    componentInstance.mergeSkill(
      AugmentedSkillSummary.createFromBackendDict(
        augmentedSkillSummaryBackendDict
      )
    );
    tick(300);
    expect(
      topicsAndSkillsDashboardBackendApiService
        .onTopicsAndSkillsDashboardReinitialized.emit
    ).toHaveBeenCalled();
    expect(alertsService.addSuccessMessage).toHaveBeenCalled();
    topicsAndSkillsDashboardBackendApiService.error = true;
    componentInstance.mergeSkill(
      AugmentedSkillSummary.createFromBackendDict(
        augmentedSkillSummaryBackendDict
      )
    );
  }));

  it('should handle cancel on merge skill modal', fakeAsync(() => {
    mockNgbModal.modal = 'merge_skill';
    mockNgbModal.success = false;
    componentInstance.mergeSkill(
      AugmentedSkillSummary.createFromBackendDict(
        augmentedSkillSummaryBackendDict
      )
    );
  }));

  it('should unassign skill', fakeAsync(() => {
    mockNgbModal.modal = 'unassign_skill';
    let skillId: string = 'test_skill';
    spyOn(
      topicsAndSkillsDashboardBackendApiService.onTopicsAndSkillsDashboardReinitialized,
      'emit'
    );
    spyOn(alertsService, 'addSuccessMessage');
    componentInstance.unassignSkill(skillId);
    tick(500);
    expect(
      topicsAndSkillsDashboardBackendApiService
        .onTopicsAndSkillsDashboardReinitialized.emit
    ).toHaveBeenCalledWith(true);
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'The skill has been unassigned to the topic.',
      1000
    );
    mockNgbModal.success = false;
    componentInstance.unassignSkill('skill_id');
  }));

  it('should assign skill to topic', fakeAsync(() => {
    mockNgbModal.modal = 'assign_skill_to_topic';
    componentInstance.editableTopicSummaries = [
      new CreatorTopicSummary(
        'test_id',
        'asd',
        1,
        2,
        3,
        4,
        23,
        'sadf',
        'asdf',
        12,
        21,
        123,
        23,
        true,
        false,
        'sad',
        'asdf',
        'asdf',
        'sdf',
        1,
        1,
        [5, 4],
        [3, 4]
      ),
    ];
    spyOn(
      topicsAndSkillsDashboardBackendApiService.onTopicsAndSkillsDashboardReinitialized,
      'emit'
    );
    spyOn(alertsService, 'addSuccessMessage');

    mockNgbModal.success = false;
    componentInstance.assignSkillToTopic(
      AugmentedSkillSummary.createFromBackendDict(
        augmentedSkillSummaryBackendDict
      )
    );

    tick(500);
    expect(componentInstance.editableTopicSummaries[0].isSelected).toBe(false);
    mockNgbModal.cancelCallbackTopics = undefined;
    componentInstance.assignSkillToTopic(
      AugmentedSkillSummary.createFromBackendDict(
        augmentedSkillSummaryBackendDict
      )
    );
    tick(500);
    expect(alertsService.addSuccessMessage).not.toHaveBeenCalled();

    mockNgbModal.success = true;
    componentInstance.assignSkillToTopic(
      AugmentedSkillSummary.createFromBackendDict(
        augmentedSkillSummaryBackendDict
      )
    );
    tick(500);
    expect(
      topicsAndSkillsDashboardBackendApiService
        .onTopicsAndSkillsDashboardReinitialized.emit
    ).toHaveBeenCalledWith(true);
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'The skill has been assigned to the topic.'
    );
  }));
});
