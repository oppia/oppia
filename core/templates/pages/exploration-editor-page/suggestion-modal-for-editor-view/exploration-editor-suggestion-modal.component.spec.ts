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
 * @fileoverview Unit tests for ExplorationEditorSuggestionModalController.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EditabilityService } from 'services/editability.service';
import { SuggestionModalService } from 'services/suggestion-modal.service';
import { ExplorationEditorSuggestionModalComponent } from './exploration-editor-suggestion-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Exploration Editor Suggestion Modal Component', () => {
  let component: ExplorationEditorSuggestionModalComponent;
  let fixture: ComponentFixture<ExplorationEditorSuggestionModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let editabilityService: EditabilityService;
  let suggestionModalService: SuggestionModalService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        ExplorationEditorSuggestionModalComponent
      ],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  describe('when suggestion is already rejected', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(
        ExplorationEditorSuggestionModalComponent);
      component = fixture.componentInstance;

      editabilityService = TestBed.inject(EditabilityService);
      suggestionModalService = TestBed.inject(SuggestionModalService);
      ngbActiveModal = TestBed.inject(NgbActiveModal);
      spyOn(editabilityService, 'isEditable').and.returnValue(true);

      component.suggestionIsHandled = false;
      component.suggestionIsValid = true;
      component.threadUibModalInstance = {
        close: () => {},
        dismiss: () => {}
      };
      component.unsavedChangesExist = true;
      component.suggestionStatus = 'rejected';

      fixture.detectChanges();
    });


    it('should initialize component properties after controller is initialized',
      () => {
        expect(component.commitMessage).toBe('');
        expect(component.reviewMessage).toBe('');
        expect(component.errorMessage).toBe(
          'You have unsaved changes to this exploration.' +
           ' Please save/discard your unsaved changes if you wish to accept.');
      });

    it('should close modal when accepting suggestion', () => {
      spyOn(ngbActiveModal, 'close').and.stub();
      spyOn(suggestionModalService, 'acceptSuggestion').and.callThrough();
      component.acceptSuggestion();

      expect(suggestionModalService.acceptSuggestion).toHaveBeenCalled();
      expect(ngbActiveModal.close).toHaveBeenCalled();
    });

    it('should close modal when rejecting suggestion', () => {
      spyOn(ngbActiveModal, 'close').and.stub();
      spyOn(suggestionModalService, 'rejectSuggestion').and.callThrough();
      component.rejectSuggestion();

      expect(suggestionModalService.rejectSuggestion).toHaveBeenCalled();
      expect(ngbActiveModal.close).toHaveBeenCalled();
    });

    it('should dismiss modal when canceling suggestion', () => {
      spyOn(ngbActiveModal, 'dismiss').and.stub();
      spyOn(suggestionModalService, 'cancelSuggestion').and.callThrough();
      component.cancelReview();

      expect(suggestionModalService.cancelSuggestion).toHaveBeenCalledWith(
        ngbActiveModal);
      expect(ngbActiveModal.dismiss).toHaveBeenCalled();
    });
  });

  describe('when suggestion is from a state that doesn\'t exist anymore',
    () => {
      beforeEach(() => {
        fixture = TestBed.createComponent(
          ExplorationEditorSuggestionModalComponent);
        component = fixture.componentInstance;

        ngbActiveModal = TestBed.inject(NgbActiveModal);
        editabilityService = TestBed.inject(EditabilityService);
        suggestionModalService = TestBed.inject(SuggestionModalService);

        spyOn(editabilityService, 'isEditable').and.returnValue(true);

        component.suggestionIsHandled = true;
        component.suggestionIsValid = false;
        component.threadUibModalInstance = {
          close: () => {},
          dismiss: () => {}
        };
        component.unsavedChangesExist = true;
        component.suggestionStatus = 'rejected';
        component.canEdit = true;
        fixture.detectChanges();
      });

      it(
        'should initialize component properties after component is initialized',
        () => {
          expect(component.commitMessage).toBe('');
          expect(component.reviewMessage).toBe('');
          expect(component.errorMessage).toBe(
            'This suggestion has already been rejected.');
        });
    });

  describe('when exploration has unsaved changes', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(
        ExplorationEditorSuggestionModalComponent);
      component = fixture.componentInstance;

      ngbActiveModal = TestBed.inject(NgbActiveModal);
      editabilityService = TestBed.inject(EditabilityService);
      suggestionModalService = TestBed.inject(SuggestionModalService);

      spyOn(editabilityService, 'isEditable').and.returnValue(true);

      component.suggestionIsHandled = false;
      component.suggestionIsValid = false;
      component.unsavedChangesExist = false;
      component.suggestionIsHandled = true;
      component.threadUibModalInstance = {
        close: () => {},
        dismiss: () => {}
      };
      component.suggestionStatus = 'rejected';

      fixture.detectChanges();
    });

    it('should initialize component properties after controller is initialized',
      () => {
        expect(component.commitMessage).toBe('');
        expect(component.reviewMessage).toBe('');
        expect(component.errorMessage).toEqual(
          'This suggestion has already been rejected.');
      });
  });

  describe('when suggestion is valid but not handled and no exist changes' +
     ' exist', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(
        ExplorationEditorSuggestionModalComponent);
      component = fixture.componentInstance;

      ngbActiveModal = TestBed.inject(NgbActiveModal);
      editabilityService = TestBed.inject(EditabilityService);
      suggestionModalService = TestBed.inject(SuggestionModalService);

      spyOn(editabilityService, 'isEditable').and.returnValue(true);

      component.suggestionIsHandled = false;
      component.suggestionIsValid = false;
      component.unsavedChangesExist = false;
      component.suggestionStatus = 'rejected';
      component.threadUibModalInstance = {
        close: () => {},
        dismiss: () => {}
      };

      fixture.detectChanges();
    });

    it('should accept suggestion and close the modal on clicking the accept' +
       ' suggestion button', () => {
      spyOn(suggestionModalService, 'acceptSuggestion').and.callThrough();
      component.acceptSuggestion();

      expect(suggestionModalService.acceptSuggestion).toHaveBeenCalled();
    });

    it('should accept suggestion and close the modal on clicking the accept' +
       ' suggestion button', () => {
      component.suggestionIsHandled = false;
      component.suggestionIsValid = true;
      component.unsavedChangesExist = false;
      component.suggestionStatus = 'rejected';
      component.threadUibModalInstance = {
        close: () => {},
        dismiss: () => {}
      };

      component.ngOnInit();
    });

    it('should reject suggestion and close the modal on clicking the reject' +
       ' suggestion button', () => {
      spyOn(suggestionModalService, 'rejectSuggestion').and.callThrough();
      component.rejectSuggestion();

      expect(suggestionModalService.rejectSuggestion).toHaveBeenCalled();
    });
  });
});
