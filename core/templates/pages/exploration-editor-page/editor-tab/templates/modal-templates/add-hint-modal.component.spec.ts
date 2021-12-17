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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AddHintModalComponent } from './add-hint-modal.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { StateHintsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-hints.service';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { ContextService } from 'services/context.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

describe('Add Hint Modal Controller', function() {
  let component: AddHintModalComponent;
  let fixture: ComponentFixture<AddHintModalComponent>;
  let hintObjectFactory: HintObjectFactory;
  let stateHintsService: StateHintsService;
  let generateContentIdService: GenerateContentIdService;
  let contextService: ContextService;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [AddHintModalComponent],
      providers: [
        HintObjectFactory,
        StateHintsService,
        GenerateContentIdService,
        ContextService,
        NgbActiveModal,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(function() {
    fixture = TestBed.createComponent(AddHintModalComponent);
    component = fixture.componentInstance;
    hintObjectFactory = TestBed.inject(HintObjectFactory);
    stateHintsService = TestBed.inject(StateHintsService);
    generateContentIdService = TestBed.inject(GenerateContentIdService);
    contextService = TestBed.inject(ContextService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);

    spyOn(contextService, 'getEntityType').and.returnValue('question');

    stateHintsService.init('State1', new Array(4));
  });

  it('should initialize $scope properties after controller is initialized',
    function() {
      component.ngOnInit();
      expect(component.tmpHint).toBe('');
      expect(component.addHintForm).toEqual({});
      expect(component.hintIndex).toBe(5);
    });

  it('should save hint when closing the modal', function() {
    let contentId = 'cont_1';
    let hintExpected = hintObjectFactory.createNew(contentId, '');
    let closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();

    spyOn(
      generateContentIdService, 'getNextStateId'
    ).and.returnValue(contentId);

    component.ngOnInit();
    component.saveHint();

    expect(closeSpy).toHaveBeenCalledWith({
      hint: hintExpected,
      contentId: contentId
    });
  });

  it('should check if hint length exceeded 500 characters', function() {
    let hint1 = 'This is a hint ';
    let hint2 = hint1.repeat(35);
    expect(component.isHintLengthExceeded(hint1)).toBe(false);
    expect(component.isHintLengthExceeded(hint2)).toBe(true);
  });
});
