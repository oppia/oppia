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
 * @fileoverview Unit tests for the skill prerequisite skills editor.
 */

import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { SkillPrerequisiteSkillsEditorComponent } from './skill-prerequisite-skills-editor.component';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { AlertsService } from 'services/alerts.service';
import { TopicsAndSkillsDashboardBackendApiService, TopicsAndSkillDashboardData } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SkillSummaryBackendDict } from 'domain/skill/skill-summary.model';
import { of } from 'rxjs';

describe('Skill editor main tab Component', () => {
  let component: SkillPrerequisiteSkillsEditorComponent;
  let fixture: ComponentFixture<SkillPrerequisiteSkillsEditorComponent>;
  let skillUpdateService: SkillUpdateService;
  let skillEditorStateService: SkillEditorStateService;
  let alertsService: AlertsService;
  let topicsAndSkillsDashboardBackendApiService:
    TopicsAndSkillsDashboardBackendApiService;
  let windowDimensionsService: WindowDimensionsService;
  let ngbModal: NgbModal;
  let skillObjectFactory: SkillObjectFactory;

  let topicAndSkillsDashboardDataBackendDict: TopicsAndSkillDashboardData;
  let sampleSkill: Skill;
  let skillSummaryDict: SkillSummaryBackendDict;
  let resizeEvent = new Event('resize');
  let mockEventEmitter = new EventEmitter();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        SkillPrerequisiteSkillsEditorComponent
      ],
      providers: [
        SkillUpdateService,
        SkillEditorStateService,
        AlertsService,
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => of(resizeEvent)
          }
        },
        NgbModal
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillPrerequisiteSkillsEditorComponent);
    component = fixture.componentInstance;

    skillUpdateService = TestBed.inject(SkillUpdateService);
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    alertsService = TestBed.inject(AlertsService);
    topicsAndSkillsDashboardBackendApiService =
      TestBed.inject(TopicsAndSkillsDashboardBackendApiService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    ngbModal = TestBed.inject(NgbModal);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);

    skillSummaryDict = {
      id: 'skillId1',
      description: 'description1',
      language_code: 'en',
      version: 1,
      misconception_count: 3,
      worked_examples_count: 3,
      skill_model_created_on: 1593138898626.193,
      skill_model_last_updated: 1593138898626.193
    };

    let misconceptionDict1 = {
      id: 2,
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback',
      must_be_addressed: true
    };

    const rubricDict = {
      difficulty: 'medium',
      explanations: ['explanation']
    };

    const skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [],
      recorded_voiceovers: {
        voiceovers_mapping: {}
      }
    };

    sampleSkill = skillObjectFactory.createFromBackendDict({
      id: 'skill1',
      description: 'test description 1',
      misconceptions: [misconceptionDict1],
      rubrics: [rubricDict],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3,
      next_misconception_id: 3,
      prerequisite_skill_ids: ['skill_1'],
      superseding_skill_id: 'skill0',
      all_questions_merged: true
    });

    topicAndSkillsDashboardDataBackendDict = {
      allClassroomNames: [
        'math'
      ],
      categorizedSkillsDict: {
        'Empty Topic': {
          uncategorized: []
        },
        'Dummy Topic 1': {
          uncategorized: [
            {
              id: 'BBB6dzfb5pPt',
              description: 'Dummy Skill 1',
              getId(): string {
                return this.id;
              },
              getDescription(): string {
                return this.description;
              }
            }
          ],
          'Dummy Subtopic Title': [
            {
              id: 'D1FdmljJNXdt',
              description: 'Dummy Skill 2',
              getId(): string {
                return this.id;
              },
              getDescription(): string {
                return this.description;
              }
            }
          ]
        }
      },
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
      canDeleteSkill: true,
      untriagedSkillSummaries: [
        {
          version: 1,
          languageCode: 'en',
          description: 'Dummy Skill 3',
          skillModelCreatedOn: 1623851495022.93,
          skillModelLastUpdated: 1623851495022.942,
          workedExamplesCount: 0,
          id: '4P77sLaU14DE',
          misconceptionCount: 0
        }
      ],
      totalSkillCount: 3,
      canCreateTopic: true,
      canCreateSkill: true,
      mergeableSkillSummaries: [
        {
          version: 1,
          languageCode: 'en',
          description: 'Dummy Skill 1',
          skillModelCreatedOn: 1623851493737.796,
          skillModelLastUpdated: 1623851493737.808,
          workedExamplesCount: 0,
          id: 'BBB6dzfb5pPt',
          misconceptionCount: 0
        },
        {
          version: 1,
          languageCode: 'en',
          description: 'Dummy Skill 2',
          skillModelCreatedOn: 1623851494780.516,
          skillModelLastUpdated: 1623851494780.529,
          workedExamplesCount: 0,
          id: 'D1FdmljJNXdt',
          misconceptionCount: 0
        }
      ],
      canDeleteTopic: true,
    };

    spyOn(skillEditorStateService, 'getSkill').and.returnValue(sampleSkill);
    spyOn(topicsAndSkillsDashboardBackendApiService, 'fetchDashboardDataAsync')
      .and.resolveTo(topicAndSkillsDashboardDataBackendDict);

    fixture.detectChanges();
  });

  it('should fetch skill when initialized', fakeAsync(() => {
    spyOn(
      skillEditorStateService, 'getGroupedSkillSummaries').and.returnValue({
      current: [],
      others: [skillSummaryDict]
    });

    component.ngOnInit();
    tick();

    expect(component.skill).toEqual(sampleSkill);
  }));

  it('should remove skill id when calling \'removeSkillId\'', () => {
    let deleteSpy = spyOn(skillUpdateService, 'deletePrerequisiteSkill')
      .and.callThrough();

    component.removeSkillId('xyz');

    expect(deleteSpy).toHaveBeenCalled();
  });

  it('should return skill editor url when calling ' +
    '\'getSkillEditorUrl\'', () => {
    let result = component.getSkillEditorUrl('skillId');

    expect(result).toBe('/skill_editor/skillId');
  });

  it('should toggle prerequisite skills ' +
    '\'togglePrerequisiteSkills\'', () => {
    component.prerequisiteSkillsAreShown = false;
    spyOn(windowDimensionsService, 'isWindowNarrow')
      .and.returnValue(true);

    component.togglePrerequisiteSkills();
    expect(component.prerequisiteSkillsAreShown).toBe(true);

    component.togglePrerequisiteSkills();
    expect(component.prerequisiteSkillsAreShown).toBe(false);
  });

  it('should show skill description on skill-editor tab', fakeAsync(() => {
    component.ngOnInit();
    tick(20);

    let desc = component.getSkillDescription('4P77sLaU14DE');
    expect(desc).toEqual('Dummy Skill 3');

    let desc2 = component.getSkillDescription('BBB6dzfb5pPt');
    expect(desc2).toEqual('Dummy Skill 1');

    let desc3 = component.getSkillDescription('nonexistentSkill');
    expect(desc3).toBeNull();
  }));

  describe('while adding a skill', () => {
    it('should show info message if we try ' +
      'to add a prerequisite skill to itself', fakeAsync(() => {
      spyOn(ngbModal, 'open').and.callFake(() => {
        return ({
          componentInstance: {},
          result: Promise.resolve({
            id: 'skill1'
          })
        }) as NgbModalRef;
      });
      let alertsSpy = spyOn(alertsService, 'addInfoMessage')
        .and.callThrough();

      component.skill = sampleSkill;
      component.addSkill();
      tick();

      expect(alertsSpy).toHaveBeenCalledWith(
        'A skill cannot be a prerequisite of itself', 5000);
    }));

    it('should show info message if we try to add a prerequisite ' +
      'skill which has already been added', fakeAsync(() => {
      spyOn(ngbModal, 'open').and.callFake(() => {
        return ({
          componentInstance: {},
          result: Promise.resolve({
            id: 'skill_1'
          })
        }) as NgbModalRef;
      });

      let alertsSpy = spyOn(alertsService, 'addInfoMessage')
        .and.callThrough();

      component.skill = sampleSkill;
      component.addSkill();
      tick();

      expect(alertsSpy).toHaveBeenCalledWith(
        'Given skill is already a prerequisite skill', 5000);
    }));

    it('should add skill sucessfully when calling ' +
      '\'addSkill\'', fakeAsync(() => {
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return ({
          componentInstance: {},
          result: Promise.resolve({
            id: 'skillId'
          })
        }) as NgbModalRef;
      });

      component.skill = sampleSkill;
      component.addSkill();
      tick();

      expect(modalSpy).toHaveBeenCalled();
    }));
  });

  it('should check if window is narrow when user resizes window', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
      mockEventEmitter);

    expect(component.prerequisiteSkillsAreShown).toBeFalse();

    component.windowIsNarrow = true;

    component.ngOnInit();
    mockEventEmitter.emit();

    expect(component.windowIsNarrow).toBeFalse();
  });

  it('should toggle skill editor card on clicking', () => {
    component.skillEditorCardIsShown = true;
    spyOn(windowDimensionsService, 'isWindowNarrow')
      .and.returnValue(true);

    component.toggleSkillEditorCard();

    expect(component.skillEditorCardIsShown).toBeFalse();

    component.toggleSkillEditorCard();

    expect(component.skillEditorCardIsShown).toBeTrue();
  });

  it('should show Prerequisites list when the window is narrow', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
      mockEventEmitter);
    component.windowIsNarrow = false;

    expect(component.prerequisiteSkillsAreShown).toBe(false);

    component.ngOnInit();
    mockEventEmitter.emit();

    expect(component.prerequisiteSkillsAreShown).toBe(false);
    expect(component.windowIsNarrow).toBe(true);
  });

  it('should show Prerequisites list when the window is wide', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    component.windowIsNarrow = true;

    expect(component.prerequisiteSkillsAreShown).toBe(false);

    component.ngOnInit();
    mockEventEmitter.emit();

    expect(component.prerequisiteSkillsAreShown).toBe(true);
    expect(component.windowIsNarrow).toBe(false);
  });

  it('should not toggle Prerequisites list when window is wide', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);

    component.prerequisiteSkillsAreShown = true;

    component.togglePrerequisiteSkills();

    expect(component.prerequisiteSkillsAreShown).toBe(true);
  });

  it('should not toggle skill card editor when window is wide', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);

    component.skillEditorCardIsShown = true;

    component.togglePrerequisiteSkills();

    expect(component.skillEditorCardIsShown).toBe(true);
  });
});
