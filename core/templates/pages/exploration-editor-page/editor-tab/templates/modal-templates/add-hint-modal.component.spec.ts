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
 * @fileoverview Unit tests for AddHintModalComponent.
 */

import {ChangeDetectorRef, NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {StateHintsService} from 'components/state-editor/state-editor-properties-services/state-hints.service';
import {Hint} from 'domain/exploration/hint-object.model';
import {ContextService} from 'services/context.service';
import {GenerateContentIdService} from 'services/generate-content-id.service';
import {AddHintModalComponent} from './add-hint-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Add Hint Modal Component', () => {
  let component: AddHintModalComponent;
  let fixture: ComponentFixture<AddHintModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let contextService: ContextService;
  let generateContentIdService: GenerateContentIdService;
  let stateHintsService: StateHintsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AddHintModalComponent],
      providers: [
        ContextService,
        GenerateContentIdService,
        ChangeDetectorRef,
        StateHintsService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddHintModalComponent);
    component = fixture.componentInstance;
    stateHintsService = TestBed.inject(StateHintsService);
    generateContentIdService = TestBed.inject(GenerateContentIdService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    contextService = TestBed.inject(ContextService);

    spyOn(contextService, 'getEntityType').and.returnValue('question');

    stateHintsService.init('State1', new Array(4));
    fixture.detectChanges();
  });

  it('should initialize the properties after component is initialized', () => {
    expect(component.tmpHint).toBe('');
    expect(component.hintIndex).toBe(5);
  });

  it('should get schema', () => {
    expect(component.getSchema()).toEqual(component.HINT_FORM_SCHEMA);
  });

  it('should save hint when closing the modal', () => {
    let contentId = 'cont_1';
    let hintExpected = Hint.createNew(contentId, '');
    spyOn(ngbActiveModal, 'close');
    spyOn(generateContentIdService, 'getNextStateId').and.returnValue(
      contentId
    );

    component.saveHint();

    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      hint: hintExpected,
      contentId: contentId,
    });
  });

  it('should check if hint length is valid', () => {
    let hint1 = '<p>This is a hint </p>';

    expect(component.isHintLengthExceeded(hint1)).toBe(false);
  });

  it('should check if hint length is not valid', () => {
    let hint1 = '<p>This is a hint.</p>';
    let hint2 = hint1.repeat(35);

    expect(component.isHintLengthExceeded(hint2)).toBe(true);
  });

  it('should update hint', () => {
    component.tmpHint = '<p>hint</p>';

    let hint = '<p>new hint</p>';
    component.updateLocalHint(hint);

    expect(component.tmpHint).toEqual(hint);
  });
});
