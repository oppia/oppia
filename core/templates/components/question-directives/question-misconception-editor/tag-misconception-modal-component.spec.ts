// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for tag misconception modal component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {
  MisconceptionObjectFactory,
  MisconceptionSkillMap,
} from 'domain/skill/MisconceptionObjectFactory';
import {TagMisconceptionModalComponent} from './tag-misconception-modal-component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Tag Misconception Modal Component', () => {
  let component: TagMisconceptionModalComponent;
  let fixture: ComponentFixture<TagMisconceptionModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let stateEditorService: StateEditorService;

  let misconceptionObjectFactory: MisconceptionObjectFactory;
  let mockMisconceptionObject: MisconceptionSkillMap;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [TagMisconceptionModalComponent],
      providers: [
        StateEditorService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TagMisconceptionModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    stateEditorService = TestBed.inject(StateEditorService);
    misconceptionObjectFactory = TestBed.inject(MisconceptionObjectFactory);

    mockMisconceptionObject = {
      abc: [
        misconceptionObjectFactory.create(
          1,
          'misc1',
          'notes1',
          'feedback1',
          true
        ),
      ],
      def: [
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

    fixture.detectChanges();
  });

  it('should initialize the properties correctly', () => {
    expect(component.misconceptionsBySkill).toEqual(mockMisconceptionObject);
    expect(component.tempSelectedMisconception).toEqual(null);
    expect(component.tempSelectedMisconceptionSkillId).toBeNull();
    expect(component.tempMisconceptionFeedbackIsUsed).toEqual(true);
  });

  it('should update the values', () => {
    let updatedValues = {
      misconception: mockMisconceptionObject.def[0],
      skillId: 'id',
      feedbackIsUsed: false,
    };

    expect(component.tempSelectedMisconception).toEqual(null);
    expect(component.tempSelectedMisconceptionSkillId).toBeNull();
    expect(component.tempMisconceptionFeedbackIsUsed).toBeTrue();

    component.updateValues(updatedValues);

    expect(component.tempSelectedMisconception).toEqual(
      mockMisconceptionObject.def[0]
    );
    expect(component.tempSelectedMisconceptionSkillId).toEqual('id');
    expect(component.tempMisconceptionFeedbackIsUsed).toBeFalse();
  });

  it('should close modal correctly', () => {
    spyOn(ngbActiveModal, 'close');
    component.tempSelectedMisconception = mockMisconceptionObject.abc[0];
    component.tempSelectedMisconceptionSkillId = 'abc';

    component.done();

    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      misconception: mockMisconceptionObject.abc[0],
      misconceptionSkillId: 'abc',
      feedbackIsUsed: true,
    });
  });
});
