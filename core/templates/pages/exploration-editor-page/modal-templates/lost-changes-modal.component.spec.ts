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
 * @fileoverview Unit tests for LostChangesModalComponent.
 */

import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { LostChange, LostChangeObjectFactory } from
  'domain/exploration/LostChangeObjectFactory';

import { LostChangesModalComponent } from './lost-changes-modal.component';
import { LoggerService } from 'services/contextual/logger.service';
import { UtilsService } from 'services/utils.service';

@Component({
  selector: 'oppia-changes-in-human-readable-form',
  template: ''
})
class ChangesInHumanReadableFormComponentStub {
}

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}


describe('Lost Changes Modal Component', () => {
  let component: LostChangesModalComponent;
  let fixture: ComponentFixture<LostChangesModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  const lostChanges = [{
    cmd: 'add_state',
    state_name: 'State name',
    utilsService: new UtilsService,
    isEndingExploration: () => false,
    isAddingInteraction: () => false,
    isOldValueEmpty: () => false,
    isNewValueEmpty: () => false,
    isOutcomeFeedbackEqual: () => false,
    isOutcomeDestEqual: () => false,
    isDestEqual: () => false,
    isFeedbackEqual: () => false,
    isRulesEqual: () => false,
    getRelativeChangeToGroups: () => 'string',
    getLanguage: () => 'en',
    getStatePropertyValue: (value1) => 'string'
  } as LostChange];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        LostChangesModalComponent,
        ChangesInHumanReadableFormComponentStub
      ],
      providers: [
        LostChangeObjectFactory,
        LoggerService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LostChangesModalComponent);
    component = fixture.componentInstance;
    component.lostChanges = lostChanges;

    ngbActiveModal = TestBed.inject(NgbActiveModal);
    fixture.detectChanges();
  });

  it('should close the modal', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();

    component.cancel();

    expect(dismissSpy).toHaveBeenCalledWith();
  });

  it('should contain correct modal header', () => {
    const modalHeader =
    fixture.debugElement.nativeElement
      .querySelector('.modal-header').innerText;

    expect(modalHeader).toBe('Error Loading Exploration');
  });

  it('should contain correct modal body', () => {
    const modalBody =
    fixture.debugElement.nativeElement
      .querySelector('.modal-body').children[0].innerText;

    expect(modalBody).toBe(
      'Sorry! The following changes will be lost. It appears that your ' +
      'draft was overwritten by changes on another machine.');
  });

  it('should contain description on lost changes' +
    'only if they exists in modal body', () => {
    const modalBody =
    fixture.debugElement.nativeElement
      .querySelector('.modal-body').children[1].innerText;

    component.hasLostChanges = true;
    fixture.detectChanges();

    expect(modalBody).toBe(
      'The lost changes are displayed below. You may want to export or ' +
      'copy and paste these changes before discarding them.');
  });

  it('should export the lost changes and close the modal', () => {
    spyOn(
      fixture.elementRef.nativeElement, 'getElementsByClassName'
    ).withArgs('oppia-lost-changes').and.returnValue([
      {
        innerText: 'Dummy Inner Text'
      }
    ]);
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    const spyObj = jasmine.createSpyObj('a', ['click']);
    spyOn(document, 'createElement').and.returnValue(spyObj);
    component.exportChangesAndClose();
    expect(document.createElement).toHaveBeenCalledTimes(1);
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(spyObj.download).toBe('lostChanges.txt');
    expect(spyObj.click).toHaveBeenCalledTimes(1);
    expect(spyObj.click).toHaveBeenCalledWith();
    expect(dismissSpy).toHaveBeenCalledWith();
  });
});
