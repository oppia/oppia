// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the State Skill Editor Component.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TopicsAndSkillsDashboardBackendApiService, TopicsAndSkillDashboardData } from
  // eslint-disable-next-line max-len
  'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { SelectSkillModalComponent } from 'components/skill-selector/select-skill-modal.component';
import { DeleteStateSkillModalComponent } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-state-skill-modal.component';
import { StateLinkedSkillIdService } from '../state-editor-properties-services/state-skill.service';
import { StateSkillEditorComponent } from './state-skill-editor.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { SkillSummary, SkillSummaryBackendDict } from 'domain/skill/skill-summary.model';
import { SkillSelectorComponent } from 'components/skill-selector/skill-selector.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';


describe('State Skill Editor Component', () => {
  let fixture: ComponentFixture<StateSkillEditorComponent>;
  let componentInstance: StateSkillEditorComponent;
  let mockNgbModal: MockNgbModal;
  let stateLinkedSkillIdService: StateLinkedSkillIdService;
  let urlInterpolationService: UrlInterpolationService;

  let skillSummaryBackendDict: SkillSummaryBackendDict = {
    id: 'test_id',
    description: 'description',
    language_code: 'sadf',
    version: 10,
    misconception_count: 0,
    worked_examples_count: 1,
    skill_model_created_on: 2,
    skill_model_last_updated: 3
  };

  let untriagedSkillSummariesData: SkillSummary[] = (
    [SkillSummary.createFromBackendDict(skillSummaryBackendDict)]);

  class MockNgbModal {
    modal!: string;
    success: boolean = true;
    open(content: string, options: NgbModalOptions) {
      if (this.modal === 'add_skill') {
        return {
          componentInstance: {
            skillSummaries: null,
            skillsInSameTopicCount: null,
            categorizedSkills: null,
            allowSkillsFromOtherTopics: null,
            untriagedSkillSummaries: null
          },
          result: {
            then: (
                successCallback: (result: {}) => void,
                cancelCallback: () => void
            ) => {
              if (this.success) {
                successCallback({});
              } else {
                cancelCallback();
              }
            }
          }
        };
      } else if (this.modal === 'delete_skill') {
        return {
          componentInstance: {},
          result: {
            then: (
                successCallback: () => void,
                errorCallback: () => void
            ) => {
              if (this.success) {
                successCallback();
              } else {
                errorCallback();
              }
              return {
                then: (callback: () => void) => {
                  callback();
                }
              };
            }
          }
        };
      }
    }
  }

  const topicsAndSkillsDashboardData: TopicsAndSkillDashboardData = {
    allClassroomNames: [
      'math'
    ],
    canDeleteTopic: true,
    canCreateTopic: true,
    canDeleteSkill: true,
    canCreateSkill: true,
    untriagedSkillSummaries: untriagedSkillSummariesData,
    mergeableSkillSummaries: [
      {
        id: 'ho60YBh7c3Sn',
        description: 'terst',
        languageCode: 'en',
        version: 1,
        misconceptionCount: 0,
        workedExamplesCount: 0,
        skillModelCreatedOn: 1622827020924.104,
        skillModelLastUpdated: 1622827020924.109
      }
    ],
    totalSkillCount: 1,
    topicSummaries: [
      {
        version: 1,
        urlFragment: 'empty-topic',
        languageCode: 'en',
        description: 'description',
        uncategorizedSkillCount: 0,
        totalPublishedNodeCount: 0,
        canEditTopic: true,
        isPublished: false,
        id: 'HLEn0XQiV9XE',
        topicModelCreatedOn: 1623851496406.576,
        subtopicCount: 0,
        thumbnailBgColor: '#FFFFFF',
        canonicalStoryCount: 0,
        name: 'Empty Topic',
        classroom: 'math',
        totalSkillCount: 0,
        additionalStoryCount: 0,
        topicModelLastUpdated: 1623851496406.582,
        thumbnailFilename: 'thumbnail_filename',
        getId(): string {
          return this.id;
        },
        getName(): string {
          return this.name;
        },
        getCanonicalStoryCount(): number {
          return this.canonicalStoryCount;
        },
        getSubtopicCount(): number {
          return this.subtopicCount;
        },
        getTotalSkillCount(): number {
          return this.totalSkillCount;
        },
        getTotalPublishedNodeCount(): number {
          return this.totalPublishedNodeCount;
        },
        getUncategorizedSkillCount(): number {
          return this.uncategorizedSkillCount;
        },
        getLanguageCode(): string {
          return this.languageCode;
        },
        getDescription(): string {
          return this.description;
        },
        getVersion(): number {
          return this.version;
        },
        getAdditionalStoryCount(): number {
          return this.additionalStoryCount;
        },
        getTopicModelCreatedOn(): number {
          return this.topicModelCreatedOn;
        },
        getTopicModelLastUpdated(): number {
          return this.topicModelLastUpdated;
        },
        getClassroom(): string | undefined {
          return this.classroom;
        },
        getUrlFragment(): string {
          return this.urlFragment;
        },
        getThumbnailFilename(): string {
          return this.thumbnailFilename;
        },
        getThumbnailBgColor(): string {
          return this.thumbnailBgColor;
        },
        isTopicPublished(): boolean {
          return this.isPublished;
        }
      }
    ],
    categorizedSkillsDict: {}
  };

  class MockTopicsAndSkillsDashboardBackendApiService {
    success: boolean = true;
    fetchDashboardDataAsync() {
      return {
        then: (callback: (resp: TopicsAndSkillDashboardData) => void) => {
          callback(topicsAndSkillsDashboardData);
        }
      };
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatCardModule,
        MatCheckboxModule,
        MatRadioModule,
        FormsModule,
        HttpClientTestingModule
      ],
      declarations: [
        StateSkillEditorComponent,
        DeleteStateSkillModalComponent,
        SelectSkillModalComponent,
        SkillSelectorComponent
      ],
      providers: [
        TopicsAndSkillsDashboardBackendApiService,
        StateLinkedSkillIdService,
        UrlInterpolationService,
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        {
          provide: TopicsAndSkillsDashboardBackendApiService,
          useClass: MockTopicsAndSkillsDashboardBackendApiService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateSkillEditorComponent);
    componentInstance = fixture.componentInstance;
    fixture.detectChanges();
    componentInstance.untriagedSkillSummaries = [];
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    mockNgbModal = (TestBed.inject(NgbModal) as unknown) as MockNgbModal;
    stateLinkedSkillIdService = TestBed.inject(StateLinkedSkillIdService);
    stateLinkedSkillIdService = (
      stateLinkedSkillIdService as unknown) as
      jasmine.SpyObj<StateLinkedSkillIdService>;
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should open add skill modal for adding skill', () => {
    mockNgbModal.modal = 'add_skill';
    const modalSpy = spyOn(mockNgbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss as TimerHandler);
      return (
        { componentInstance: MockNgbModal,
          result: Promise.resolve('success')
        }
      ) as NgbModalRef;
    });
    componentInstance.addSkill();
    fixture.detectChanges();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should close the add skill modal on clicking cancel', () => {
    mockNgbModal.modal = 'add_skill';
    mockNgbModal.success = false;
    componentInstance.addSkill();
    fixture.detectChanges();
  });

  it('should open delete skill modal for deleting skill', () => {
    mockNgbModal.modal = 'delete_skill';
    const modalSpy = spyOn(mockNgbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss as TimerHandler);
      return (
        { componentInstance: MockNgbModal,
          result: Promise.resolve('success')
        }
      ) as NgbModalRef;
    });
    componentInstance.deleteSkill();
    fixture.detectChanges();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should close the delete skill modal on clicking cancel', () => {
    mockNgbModal.modal = 'delete_skill';
    mockNgbModal.success = false;
    componentInstance.deleteSkill();
    fixture.detectChanges();
  });

  it('should call getSkillEditorUrl and return skillEditor URL', () => {
    const urlSpy = spyOn(
      urlInterpolationService, 'interpolateUrl')
      .and.returnValue('/skill_editor/skill_1');

    stateLinkedSkillIdService.displayed = 'skill_1';
    componentInstance.getSkillEditorUrl();
    fixture.detectChanges();
    expect(urlSpy).toHaveBeenCalled();
  });

  it('should toggle skillEditorIsShown', () => {
    componentInstance.skillEditorIsShown = true;
    componentInstance.toggleSkillEditor();
    fixture.detectChanges();
    expect(componentInstance.skillEditorIsShown).toEqual(false);
  });
});
