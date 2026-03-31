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
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {NgbModal, NgbModalRef, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {SkillEditorMainTabComponent} from './skill-editor-main-tab.component';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {SkillEditorRoutingService} from '../services/skill-editor-routing.service';
import {SkillEditorStateService} from '../services/skill-editor-state.service';
import {NO_ERRORS_SCHEMA} from '@angular/core';

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
  let assignedSkillTopicData = {topic1: 'subtopic1', topic2: 'subtopic2'};

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgbModule],
      declarations: [SkillEditorMainTabComponent],
      providers: [
        UndoRedoService,
        SkillEditorRoutingService,
        SkillEditorStateService,
        FocusManagerService,
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
    focusManagerService = TestBed.inject(FocusManagerService);

    component.ngOnInit();
    component.ngAfterContentChecked();
  });

  it('should initialize the variables', () => {
    expect(component.selectedTopic).toBeUndefined();
    expect(component.subtopicName).toBeUndefined();
  });

  it('should navigate to questions tab when unsaved changes are not present', () => {
    spyOn(undoRedoService, 'getChangeCount').and.returnValue(0);
    let routingSpy = spyOn(
      skillEditorRoutingService,
      'navigateToQuestionsTab'
    ).and.callThrough();
    component.createQuestion(), expect(routingSpy).toHaveBeenCalled();
    let createQuestionEventSpyon = spyOn(
      skillEditorRoutingService,
      'creatingNewQuestion'
    ).and.callThrough();
    component.createQuestion();
    expect(createQuestionEventSpyon).toHaveBeenCalled();
  });

  it('should return if skill has been loaded', () => {
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

      component.createQuestion(), expect(modalSpy).toHaveBeenCalled();
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

      component.createQuestion(), expect(modalSpy).toHaveBeenCalled();
    }
  );

  it('should return assigned Skill Topic Data', () => {
    expect(component.assignedSkillTopicData).toBeUndefined();
    expect(component.getAssignedSkillTopicData()).toBeNull();
    component.assignedSkillTopicData = assignedSkillTopicData;
    expect(component.getAssignedSkillTopicData()).toEqual(
      assignedSkillTopicData
    );
  });

  it('should return subtopic name', () => {
    expect(component.subtopicName).toBeUndefined();
    component.subtopicName = 'Subtopic1';
    expect(component.getSubtopicName()).toEqual('Subtopic1');
  });

  it('should change subtopic when selected topic is changed', () => {
    // This throws "Argument of type 'null' is not assignable to parameter of
    // type 'string'" We need to suppress this error because of the need to test
    // validations. This throws an error because the value is null.
    // @ts-ignore
    component.changeSelectedTopic(null);
    component.assignedSkillTopicData = assignedSkillTopicData;
    component.changeSelectedTopic('topic1');
    expect(component.getSubtopicName()).toEqual(assignedSkillTopicData.topic1);
    component.changeSelectedTopic('topic2');
    expect(component.getSubtopicName()).toEqual(assignedSkillTopicData.topic2);
  });

  it('should return whether the topic dropdown is enabled', () => {
    expect(component.isTopicDropdownEnabled()).toEqual(false);
    component.assignedSkillTopicData = assignedSkillTopicData;
    expect(component.isTopicDropdownEnabled()).toEqual(true);
  });

  it('should set focus on create question button', fakeAsync(() => {
    let focusSpy = spyOn(focusManagerService, 'setFocus');
    component.ngOnInit();
    flush();
    expect(focusSpy).toHaveBeenCalled();
  }));
});
