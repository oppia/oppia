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

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {MatCardModule} from '@angular/material/card';
import {
  NgbModal,
  NgbModalOptions,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import {
  TopicsAndSkillsDashboardBackendApiService,
  TopicsAndSkillDashboardData,
  // eslint-disable-next-line max-len
} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {SelectSkillModalComponent} from 'components/skill-selector/select-skill-modal.component';
import {
  DeleteStateSkillModalComponent,
  // eslint-disable-next-line max-len
} from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-state-skill-modal.component';
import {StateLinkedSkillIdService} from '../state-editor-properties-services/state-skill.service';
import {StateSkillEditorComponent} from './state-skill-editor.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatRadioModule} from '@angular/material/radio';
import {FormsModule} from '@angular/forms';
import {
  SkillSummary,
  SkillSummaryBackendDict,
} from 'domain/skill/skill-summary.model';
import {SkillSelectorComponent} from 'components/skill-selector/skill-selector.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {CreatorTopicSummary} from 'domain/topic/creator-topic-summary.model';
import {UserService} from 'services/user.service';
import {SkillBackendApiService} from 'domain/skill/skill-backend-api.service';
import {MaterialModule} from 'modules/material.module';
import {SkillObjectFactory} from 'domain/skill/SkillObjectFactory';

describe('State Skill Editor Component', () => {
  let fixture: ComponentFixture<StateSkillEditorComponent>;
  let componentInstance: StateSkillEditorComponent;
  let mockNgbModal: MockNgbModal;
  let stateLinkedSkillIdService: StateLinkedSkillIdService;
  let urlInterpolationService: UrlInterpolationService;
  let userService: UserService;
  let skillBackendApiService: SkillBackendApiService;
  let skillObjectFactory: SkillObjectFactory;

  let skillSummaryBackendDict: SkillSummaryBackendDict = {
    id: 'test_id',
    description: 'description',
    language_code: 'sadf',
    version: 10,
    misconception_count: 0,
    worked_examples_count: 1,
    skill_model_created_on: 2,
    skill_model_last_updated: 3,
  };

  let untriagedSkillSummariesData: SkillSummary[] = [
    SkillSummary.createFromBackendDict(skillSummaryBackendDict),
  ];

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
            untriagedSkillSummaries: null,
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
            },
          },
        };
      } else if (this.modal === 'delete_skill') {
        return {
          componentInstance: {},
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
      }
    }
  }

  const topicsAndSkillsDashboardData: TopicsAndSkillDashboardData = {
    allClassroomNames: ['math'],
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
        skillModelLastUpdated: 1622827020924.109,
      },
    ],
    totalSkillCount: 1,
    topicSummaries: [
      new CreatorTopicSummary(
        'dummy2',
        'division',
        2,
        2,
        3,
        3,
        0,
        'es',
        'dummy2',
        1,
        1,
        1,
        1,
        true,
        true,
        'math',
        'public/img1.png',
        'green',
        'div',
        1,
        1,
        [5, 4],
        [3, 4]
      ),
    ],
    categorizedSkillsDict: {},
  };

  class MockTopicsAndSkillsDashboardBackendApiService {
    success: boolean = true;
    fetchCategorizedAndUntriagedSkillsDataAsync() {
      return {
        then: (callback: (resp: TopicsAndSkillDashboardData) => void) => {
          callback(topicsAndSkillsDashboardData);
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
        FormsModule,
        MaterialModule,
        HttpClientTestingModule,
      ],
      declarations: [
        StateSkillEditorComponent,
        DeleteStateSkillModalComponent,
        SelectSkillModalComponent,
        SkillSelectorComponent,
      ],
      providers: [
        TopicsAndSkillsDashboardBackendApiService,
        StateLinkedSkillIdService,
        UrlInterpolationService,
        UserService,
        SkillBackendApiService,
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: TopicsAndSkillsDashboardBackendApiService,
          useClass: MockTopicsAndSkillsDashboardBackendApiService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateSkillEditorComponent);
    componentInstance = fixture.componentInstance;
    fixture.detectChanges();
    componentInstance.untriagedSkillSummaries = [];
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    mockNgbModal = TestBed.inject(NgbModal) as unknown as MockNgbModal;
    stateLinkedSkillIdService = TestBed.inject(StateLinkedSkillIdService);
    userService = TestBed.inject(UserService);
    skillBackendApiService = TestBed.inject(SkillBackendApiService);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
  });

  beforeEach(() => {
    spyOn(userService, 'canUserAccessTopicsAndSkillsDashboard').and.returnValue(
      Promise.resolve(true)
    );
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should open add skill modal for adding skill', () => {
    mockNgbModal.modal = 'add_skill';
    const modalSpy = spyOn(mockNgbModal, 'open').and.callFake((dlg, opt) => {
      return {
        componentInstance: MockNgbModal,
        result: Promise.resolve('success'),
      } as NgbModalRef;
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
      return {
        componentInstance: MockNgbModal,
        result: Promise.resolve('success'),
      } as NgbModalRef;
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
      urlInterpolationService,
      'interpolateUrl'
    ).and.returnValue('/skill_editor/skill_1');

    stateLinkedSkillIdService.displayed = 'skill_1';
    componentInstance.getSkillEditorUrl();
    fixture.detectChanges();
    expect(urlSpy).toHaveBeenCalled();
  });

  it(
    'should throw error on call getSkillEditorUrl when there is no skill' +
      'is selected',
    () => {
      stateLinkedSkillIdService.displayed = null;
      expect(() => {
        componentInstance.getSkillEditorUrl();
      }).toThrowError('Expected a skill id to be displayed');
    }
  );

  it('should toggle skillEditorIsShown', () => {
    componentInstance.skillEditorIsShown = true;
    componentInstance.toggleSkillEditor();
    fixture.detectChanges();
    expect(componentInstance.skillEditorIsShown).toEqual(false);
  });

  it('should fetch the linked skill name to be displayed from linked skill id', fakeAsync(() => {
    const skillBackendDict = {
      id: 'skill_1',
      description: 'skill 1',
      misconceptions: [],
      rubrics: [],
      skill_contents: {
        explanation: {
          html: 'test explanation',
          content_id: 'explanation',
        },
        worked_examples: [],
        recorded_voiceovers: {
          voiceovers_mapping: {},
        },
      },
      language_code: 'en',
      version: 3,
      prerequisite_skill_ids: [],
      all_questions_merged: false,
      next_misconception_id: 0,
      superseding_skill_id: '2',
    };
    const fetchSkillResponse = {
      skill: skillObjectFactory.createFromBackendDict(skillBackendDict),
      assignedSkillTopicData: {},
      groupedSkillSummaries: {},
    };
    spyOn(skillBackendApiService, 'fetchSkillAsync').and.returnValue(
      Promise.resolve(fetchSkillResponse)
    );
    stateLinkedSkillIdService.displayed = 'skill_1';

    expect(componentInstance.skillName).toBeUndefined();

    componentInstance.ngOnInit();
    stateLinkedSkillIdService.onStateLinkedSkillIdInitialized.emit();
    tick();

    expect(componentInstance.skillName).toEqual('skill 1');
  }));
});
