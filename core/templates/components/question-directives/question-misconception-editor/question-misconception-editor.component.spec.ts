// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the question misconception editor component.
 */

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {
  Outcome,
  QuestionMisconceptionEditorComponent,
} from './question-misconception-editor.component';
import {ExternalSaveService} from 'services/external-save.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {
  MisconceptionSkillMap,
  MisconceptionObjectFactory,
} from 'domain/skill/MisconceptionObjectFactory';

class MockNgbModalRef {
  componentInstance = {
    taggedSkillMisconceptionId: null,
  };
}

describe('Question Misconception Editor Component', () => {
  let component: QuestionMisconceptionEditorComponent;
  let fixture: ComponentFixture<QuestionMisconceptionEditorComponent>;
  let ngbModal: NgbModal;
  let stateEditorService: StateEditorService;

  let misconceptionObjectFactory: MisconceptionObjectFactory;
  let mockMisconceptionObject: MisconceptionSkillMap;
  let outcome = {
    feedback: {
      content_id: null,
      html: '',
    },
  } as Outcome;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [QuestionMisconceptionEditorComponent],
      providers: [StateEditorService, ExternalSaveService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionMisconceptionEditorComponent);
    component = fixture.componentInstance;
    ngbModal = TestBed.inject(NgbModal);
    stateEditorService = TestBed.inject(StateEditorService);
    misconceptionObjectFactory = TestBed.inject(MisconceptionObjectFactory);

    component.isEditable = true;
    component.outcome = outcome;
    mockMisconceptionObject = {
      abc: [
        misconceptionObjectFactory.create(
          1,
          'misc1',
          'notes1',
          'feedback1',
          true
        ),
        misconceptionObjectFactory.create(
          2,
          'misc2',
          'notes2',
          'feedback1',
          true
        ),
      ],
    };
    spyOn(stateEditorService, 'getMisconceptionsBySkill').and.callFake(() => {
      return mockMisconceptionObject;
    });

    component.taggedSkillMisconceptionId = 'abc-1';
    fixture.detectChanges();
  });

  it('should initialize correctly when tagged misconception is provided', () => {
    expect(component.misconceptionEditorIsOpen).toBeFalse();
    expect(component.misconceptionName).toEqual('misc1');
    expect(component.selectedMisconception).toEqual(
      mockMisconceptionObject.abc[0]
    );
    expect(component.selectedMisconceptionSkillId).toEqual('abc');
    expect(component.feedbackIsUsed).toBeTrue();
  });

  it('should throw an error if tagged misconception id is invalid', () => {
    component.taggedSkillMisconceptionId = 'invalidId';

    expect(() => component.ngOnInit()).toThrowError(
      'Expected skillMisconceptionId to be <skillId>-<misconceptionId>.'
    );
  });

  it('should use feedback by default', () => {
    expect(component.feedbackIsUsed).toBeTrue();
    expect(component.misconceptionsBySkill).toEqual(mockMisconceptionObject);
  });

  it('should enable edit mode correctly', () => {
    expect(component.misconceptionEditorIsOpen).toBeFalse();

    component.editMisconception();

    expect(component.misconceptionEditorIsOpen).toBeTrue();
  });

  it('should report containing misconceptions in question mode', () => {
    spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(true);
    expect(component.containsMisconceptions()).toBeTrue();

    component.misconceptionsBySkill = {};

    expect(component.containsMisconceptions()).toBeFalse();
  });

  it('should report containing misconceptions for state skill', () => {
    spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(false);
    spyOn(stateEditorService, 'getLinkedSkillId').and.returnValue('abc');
    expect(component.containsMisconceptions()).toBeTrue();

    component.misconceptionsBySkill = {};

    expect(component.containsMisconceptions()).toBeFalse();
  });

  it('should reset values when linked skill id change event is emitted', fakeAsync(() => {
    let onUpdateMisconceptionsEmitter = new EventEmitter();
    spyOnProperty(stateEditorService, 'onUpdateMisconceptions').and.returnValue(
      onUpdateMisconceptionsEmitter
    );
    spyOn(component, 'initValues');

    component.ngOnInit();
    onUpdateMisconceptionsEmitter.emit();
    tick();

    expect(component.initValues).toHaveBeenCalled();
    component.ngOnDestroy();
  }));

  it('should update values when update misconception event is emitted', fakeAsync(() => {
    let onChangeLinkedSkillIdEmitter = new EventEmitter();
    spyOnProperty(stateEditorService, 'onChangeLinkedSkillId').and.returnValue(
      onChangeLinkedSkillIdEmitter
    );
    spyOn(component, 'initValues');

    expect(component.taggedSkillMisconceptionId).toEqual('abc-1');

    component.ngOnInit();
    onChangeLinkedSkillIdEmitter.emit();
    tick();

    expect(component.taggedSkillMisconceptionId).toBeNull();
    expect(component.initValues).toHaveBeenCalled();
    component.ngOnDestroy();
  }));

  it('should tag a misconception correctly', fakeAsync(() => {
    let mockResultObject = {
      misconception: mockMisconceptionObject.abc[1],
      misconceptionSkillId: 'abc',
      feedbackIsUsed: false,
    };
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        componentInstance: MockNgbModalRef,
        result: Promise.resolve(mockResultObject),
      } as NgbModalRef;
    });

    expect(component.misconceptionName).toEqual('misc1');
    expect(component.selectedMisconception).toEqual(
      mockMisconceptionObject.abc[0]
    );
    expect(component.selectedMisconceptionSkillId).toEqual('abc');
    expect(component.feedbackIsUsed).toBeTrue();

    component.tagAnswerGroupWithMisconception();
    tick();

    expect(component.misconceptionName).toEqual('misc2');
    expect(component.selectedMisconception).toEqual(
      mockMisconceptionObject.abc[1]
    );
    expect(component.selectedMisconceptionSkillId).toEqual('abc');
    expect(component.feedbackIsUsed).toBeFalse();
    expect(component.misconceptionEditorIsOpen).toBeFalse();
  }));

  it('should not tag a misconception if the modal was dismissed', () => {
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        componentInstance: MockNgbModalRef,
        result: Promise.reject(),
      } as NgbModalRef;
    });

    expect(component.misconceptionName).toEqual('misc1');
    expect(component.selectedMisconception).toEqual(
      mockMisconceptionObject.abc[0]
    );
    expect(component.selectedMisconceptionSkillId).toEqual('abc');
    expect(component.feedbackIsUsed).toBeTrue();

    component.tagAnswerGroupWithMisconception();

    expect(component.misconceptionName).toEqual('misc1');
    expect(component.selectedMisconception).toEqual(
      mockMisconceptionObject.abc[0]
    );
    expect(component.selectedMisconceptionSkillId).toEqual('abc');
    expect(component.feedbackIsUsed).toBeTrue();
  });

  it('should update tagged misconception name correctly', () => {
    component.misconceptionEditorIsOpen = false;

    component.editMisconception();

    expect(component.misconceptionEditorIsOpen).toBeTrue();

    component.selectedMisconception = mockMisconceptionObject.abc[0];
    component.selectedMisconceptionSkillId = 'abc';

    component.updateMisconception();

    expect(component.misconceptionEditorIsOpen).toBeFalse();
    expect(component.misconceptionName).toEqual('misc1');
  });

  it('should update the values', () => {
    let updatedValues = {
      misconception: mockMisconceptionObject.abc[1],
      skillId: 'id',
      feedbackIsUsed: false,
    };

    expect(component.selectedMisconception).toEqual(
      mockMisconceptionObject.abc[0]
    );
    expect(component.selectedMisconceptionSkillId).toEqual('abc');
    expect(component.feedbackIsUsed).toBeTrue();

    component.updateValues(updatedValues);

    expect(component.selectedMisconception).toEqual(
      mockMisconceptionObject.abc[1]
    );
    expect(component.selectedMisconceptionSkillId).toEqual('id');
    expect(component.feedbackIsUsed).toBeFalse();
  });
});
