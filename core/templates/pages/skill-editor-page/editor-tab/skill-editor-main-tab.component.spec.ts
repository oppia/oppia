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
 * @fileoverview Unit tests for the skill editor main tab component.
 */

import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NgbModal, NgbModalRef, NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {SkillEditorMainTabComponent} from './skill-editor-main-tab.component';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {SkillEditorRoutingService} from '../services/skill-editor-routing.service';
import {SkillEditorStateService} from '../services/skill-editor-state.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {PageTitleService} from 'services/page-title.service';
import {AlertsService} from 'services/alerts.service';
import {EditableTopicBackendApiService} from 'domain/topic/editable-topic-backend-api.service';
import {TopicsAndSkillsDashboardBackendApiService} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {CreatorTopicSummary} from 'domain/topic/creator-topic-summary.model';

class MockNgbModalRef {
  componentInstance!: {
    body: 'xyz';
  };
}

describe('Skill editor main tab component', () => {
  let component: SkillEditorMainTabComponent;
  let fixture: ComponentFixture<SkillEditorMainTabComponent>;
  let undoRedoService: UndoRedoService;
  let ngbModal: NgbModal;
  let skillEditorRoutingService: SkillEditorRoutingService;
  let skillEditorStateService: SkillEditorStateService;
  let focusManagerService: FocusManagerService;
  let pageTitleService: PageTitleService;
  let alertsService: AlertsService;
  let editableTopicBackendApiService: EditableTopicBackendApiService;
  let topicsAndSkillsDashboardBackendApiService: TopicsAndSkillsDashboardBackendApiService;

  const assignedSkillTopicData = {topic1: 'subtopic1', topic2: 'subtopic2'};

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgbModule],
      declarations: [SkillEditorMainTabComponent],
      providers: [
        UndoRedoService,
        SkillEditorRoutingService,
        SkillEditorStateService,
        FocusManagerService,
        PageTitleService,
        AlertsService,
        EditableTopicBackendApiService,
        TopicsAndSkillsDashboardBackendApiService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillEditorMainTabComponent);
    component = fixture.componentInstance;

    focusManagerService = TestBed.inject(FocusManagerService);
    ngbModal = TestBed.inject(NgbModal);
    undoRedoService = TestBed.inject(UndoRedoService);
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    skillEditorRoutingService = TestBed.inject(SkillEditorRoutingService);
    pageTitleService = TestBed.inject(PageTitleService);
    alertsService = TestBed.inject(AlertsService);
    editableTopicBackendApiService = TestBed.inject(
      EditableTopicBackendApiService
    );
    topicsAndSkillsDashboardBackendApiService = TestBed.inject(
      TopicsAndSkillsDashboardBackendApiService
    );

    spyOn(pageTitleService, 'setNavbarTitleForMobileView');
    spyOn(
      topicsAndSkillsDashboardBackendApiService,
      'fetchDashboardDataAsync'
    ).and.returnValue(
      Promise.resolve({
        topicSummaries: [],
      } as {
        topicSummaries: CreatorTopicSummary[];
      })
    );

    component.ngOnInit();
    component.ngAfterContentChecked();
  });

  it('should initialize the variables', () => {
    expect(component.subtopicName).toBeUndefined();
    expect(component.topicName).toBeUndefined();
    expect(component.assignedSkillTopicData).toBeUndefined();
    expect(component.editableTopicSummaries).toEqual([]);
  });

  it('should navigate to questions tab when unsaved changes are not present', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(0);
    const routingSpy = spyOn(
      skillEditorRoutingService,
      'navigateToQuestionsTab'
    ).and.callThrough();
    const createQuestionEventSpy = spyOn(
      skillEditorRoutingService,
      'creatingNewQuestion'
    ).and.callThrough();

    component.createQuestion();

    expect(routingSpy).toHaveBeenCalled();
    expect(createQuestionEventSpy).toHaveBeenCalledWith(true);
  });

  it('should return if skill has been loaded', () => {
    spyOn(skillEditorStateService, 'getSkill').and.returnValue({
      getId: () => 'skill_1',
    } as never);

    expect(component.hasLoadedSkill()).toBe(false);

    spyOn(skillEditorStateService, 'hasLoadedSkill').and.returnValue(true);
    expect(component.hasLoadedSkill()).toBe(true);
  });

  it(
    'should open save changes modal with ngbModal when unsaved changes are' +
      ' present',
    () => {
      spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return {
          componentInstance: MockNgbModalRef,
          result: Promise.resolve(),
        } as NgbModalRef;
      });

      component.createQuestion();

      expect(modalSpy).toHaveBeenCalled();
    }
  );

  it(
    'should close save changes modal with ngbModal when cancel button is' +
      ' clicked',
    () => {
      spyOn(undoRedoService, 'getChangeCount').and.returnValue(1);
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return {
          componentInstance: MockNgbModalRef,
          result: Promise.reject(),
        } as NgbModalRef;
      });

      component.createQuestion();

      expect(modalSpy).toHaveBeenCalled();
    }
  );

  it('should return assigned skill topic data', () => {
    const assignedSkillTopicDataSpy = spyOn(
      skillEditorStateService,
      'getAssignedSkillTopicData'
    );

    assignedSkillTopicDataSpy.and.returnValue(null);
    expect(component.assignedSkillTopicData).toBeUndefined();
    expect(component.getAssignedSkillTopicData()).toBeNull();

    assignedSkillTopicDataSpy.and.returnValue(assignedSkillTopicData);
    component.topicName = '' as string;
    expect(component.getAssignedSkillTopicData()).toEqual(
      assignedSkillTopicData
    );
  });

  it('should return subtopic name', () => {
    expect(component.subtopicName).toBeUndefined();
    component.subtopicName = 'Subtopic1';
    expect(component.getSubtopicName()).toEqual('Subtopic1');
  });

  it('should update subtopic name when topic exists in assigned topic data', () => {
    component.assignedSkillTopicData = assignedSkillTopicData;

    component.updateSubtopicForTopic('topic1');
    expect(component.getSubtopicName()).toBe('subtopic1');

    component.updateSubtopicForTopic('topic2');
    expect(component.getSubtopicName()).toBe('subtopic2');
  });

  it('should clear subtopic name when topic does not exist in assigned topic data', () => {
    component.assignedSkillTopicData = assignedSkillTopicData;
    component.subtopicName = 'old value';

    component.updateSubtopicForTopic('topic3');

    expect(component.getSubtopicName()).toBe('');
  });

  it('should return editable topic names', () => {
    component.editableTopicSummaries = [
      {name: 'topic1'} as CreatorTopicSummary,
      {name: 'topic2'} as CreatorTopicSummary,
    ];

    expect(component.getEditableTopicNames()).toEqual(['topic1', 'topic2']);
  });

  it('should return whether the topic dropdown is enabled', () => {
    expect(component.isTopicDropdownEnabled()).toBe(false);

    component.editableTopicSummaries = [
      {name: 'topic1'} as CreatorTopicSummary,
      {name: 'topic2'} as CreatorTopicSummary,
    ];

    expect(component.isTopicDropdownEnabled()).toBe(true);
  });

  it('should update subtopic name when selected topic is already assigned', () => {
    spyOn(skillEditorStateService, 'getAssignedSkillTopicData').and.returnValue(
      assignedSkillTopicData
    );
    const updateSubtopicSpy = spyOn(component, 'updateSubtopicForTopic');

    component.handleTopicSelectionChange('topic1');

    expect(component.topicName).toBe('topic1');
    expect(updateSubtopicSpy).toHaveBeenCalledWith('topic1');
  });

  it('should assign skill to topic when selected topic is not already assigned', () => {
    spyOn(skillEditorStateService, 'getAssignedSkillTopicData').and.returnValue(
      assignedSkillTopicData
    );
    const assignSkillSpy = spyOn(component, 'assignSkillToTopic');

    component.handleTopicSelectionChange('topic3');

    expect(component.topicName).toBe('topic3');
    expect(assignSkillSpy).toHaveBeenCalledWith('topic3');
  });

  it('should show warning if selected topic name is invalid', () => {
    const warningSpy = spyOn(alertsService, 'addWarning');

    component.assignSkillToTopic('   ');

    expect(warningSpy).toHaveBeenCalledWith('Please select a valid topic.');
  });

  it('should show warning if selected topic cannot be found', () => {
    component.skill = {
      getId: () => 'skill_1',
    } as never;
    component.editableTopicSummaries = [];

    const warningSpy = spyOn(alertsService, 'addWarning');

    component.assignSkillToTopic('topic3');

    expect(warningSpy).toHaveBeenCalledWith(
      'Could not find the selected topic.'
    );
  });

  it('should assign skill to topic successfully', fakeAsync(() => {
    component.skill = {
      getId: () => 'skill_1',
    } as never;
    component.editableTopicSummaries = [
      {
        id: 'topic_1',
        version: 1,
        name: 'topic3',
      } as CreatorTopicSummary,
    ];

    spyOn(editableTopicBackendApiService, 'updateTopicAsync').and.returnValue(
      Promise.resolve()
    );
    spyOn(skillEditorStateService, 'loadSkill');
    const successSpy = spyOn(alertsService, 'addSuccessMessage');

    component.assignSkillToTopic('topic3');
    flush();

    expect(editableTopicBackendApiService.updateTopicAsync).toHaveBeenCalled();
    expect(skillEditorStateService.loadSkill).toHaveBeenCalledWith('skill_1');
    expect(component.subtopicName).toBe('');
    expect(successSpy).toHaveBeenCalledWith(
      'The skill has been assigned to the topic.'
    );
  }));

  it('should show warning when assigning skill to topic fails', fakeAsync(() => {
    component.skill = {
      getId: () => 'skill_1',
    } as never;
    component.editableTopicSummaries = [
      {
        id: 'topic_1',
        version: 1,
        name: 'topic3',
      } as CreatorTopicSummary,
    ];

    spyOn(editableTopicBackendApiService, 'updateTopicAsync').and.returnValue(
      Promise.reject('Backend error')
    );
    const warningSpy = spyOn(alertsService, 'addWarning');

    component.assignSkillToTopic('topic3');
    flush();

    expect(warningSpy).toHaveBeenCalledWith('Backend error');
  }));

  it('should set focus on create question button', fakeAsync(() => {
    const focusSpy = spyOn(focusManagerService, 'setFocus');
    component.ngOnInit();
    flush();
    expect(focusSpy).toHaveBeenCalled();
  }));
});
