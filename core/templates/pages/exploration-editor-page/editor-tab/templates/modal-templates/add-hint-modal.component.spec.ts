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

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ContextService } from 'services/context.service';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { StateHintsService } from 'components/state-editor/state-editor-properties-services/state-hints.service';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { AddHintModalComponent } from './add-hint-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Add Hint Modal Component', function() {
  let component: AddHintModalComponent;
  let fixture: ComponentFixture<AddHintModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let contextService: ContextService;
  let generateContentIdService: GenerateContentIdService;
  let hintObjectFactory: HintObjectFactory;
  let stateHintsService: StateHintsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AddHintModalComponent
      ],
      providers: [
        ContextService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddHintModalComponent);
    component = fixture.componentInstance;

    ngbActiveModal = TestBed.inject(NgbActiveModal);
    contextService = TestBed.inject(ContextService);
    stateHintsService = TestBed.inject(StateHintsService);
    hintObjectFactory = TestBed.inject(HintObjectFactory);
    generateContentIdService = TestBed.inject(GenerateContentIdService);

    stateHintsService.init('State1', new Array(4));

    spyOn(contextService, 'getEntityType').and.returnValue('question');
    fixture.detectChanges();
  });

  it('should initialize component properties after controller is initialized',
    () => {
      expect(component.tmpHint).toBe('');
      expect(component.addHintForm).toEqual({});
      expect(component.hintIndex).toBe(5);
    });

  it('should save hint when closing the modal', fakeAsync(() => {
    spyOn(hintObjectFactory, 'createNew').and.stub();
    spyOn(generateContentIdService, 'getNextStateId').and.stub();
    spyOn(ngbActiveModal, 'close');

    component.saveHint();
    tick();

    expect(ngbActiveModal.close).toHaveBeenCalled();
    expect(generateContentIdService.getNextStateId).toHaveBeenCalled();
    expect(hintObjectFactory.createNew).toHaveBeenCalled();
  }));

  it('should check if hint length exceeded 500 characters', () => {
    let hint1 = 'This is a hint ';
    let hint2 = hint1.repeat(35);

    expect(component.isHintLengthExceeded(hint1)).toBe(false);
    expect(component.isHintLengthExceeded(hint2)).toBe(true);
  });
});
