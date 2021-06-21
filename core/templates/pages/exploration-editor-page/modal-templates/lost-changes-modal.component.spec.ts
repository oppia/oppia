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
  let loggerService: LoggerService;
  let logSpy = null;

  const lostChanges = [{
    cmd: 'add_state',
    state_name: 'State name',
  } as unknown as LostChange];

  const lostChangesResponse = [{
    utilsService: {},
    cmd: 'add_state',
    stateName: 'State name',
  }];

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
    loggerService = TestBed.inject(LoggerService);
    logSpy = spyOn(loggerService, 'error').and.callThrough();

    fixture.detectChanges();
  });

  it('should evaluates lostChanges when component is initialized', () => {
    expect(component.lostChanges[0].cmd).toBe('add_state');
    expect(component.lostChanges[0].stateName).toBe('State name');
    expect(logSpy).toHaveBeenCalledWith(
      'Lost changes: ' + JSON.stringify(lostChangesResponse));
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
      'The lost changes are displayed below. You may want to copy and ' +
      'paste these changes before discarding them.');
  });
});
