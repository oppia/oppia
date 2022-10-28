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
 * @fileoverview Unit tests for CreateFeedbackThreadModalComponent.
 */

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertsService } from 'services/alerts.service';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { CreateFeedbackThreadModalComponent } from './create-feedback-thread-modal.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Create Feedback Thread Modal Controller', function() {
  let component: CreateFeedbackThreadModalComponent;
  let fixture: ComponentFixture<CreateFeedbackThreadModalComponent>;
  let alertsService: AlertsService;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        CreateFeedbackThreadModalComponent
      ],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateFeedbackThreadModalComponent);
    component = fixture.componentInstance;

    ngbActiveModal = TestBed.inject(NgbActiveModal);
    alertsService = TestBed.inject(AlertsService);

    fixture.detectChanges();
  });

  it('should initialize properties after component is initialized',
    function() {
      expect(component.newThreadSubject).toEqual('');
      expect(component.newThreadText).toEqual('');
    });

  it('should not close modal when new thread subject is empty', function() {
    spyOn(alertsService, 'addWarning').and.callThrough();
    spyOn(ngbActiveModal, 'close').and.callThrough();

    let newThreadSubject = '';
    let newThreadText = 'text';
    component.create(newThreadSubject, newThreadText);

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Please specify a thread subject.');
    expect(ngbActiveModal.close).not.toHaveBeenCalled();
  });

  it('should not close modal when new thread text is empty', function() {
    spyOn(alertsService, 'addWarning').and.callThrough();
    spyOn(ngbActiveModal, 'close').and.callThrough();

    let newThreadSubject = 'subject';
    let newThreadText = '';
    component.create(newThreadSubject, newThreadText);

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Please specify a message.');
    expect(ngbActiveModal.close).not.toHaveBeenCalled();
  });

  it('should close modal when both new thread subject and new thread text are' +
      ' valid', function() {
    spyOn(ngbActiveModal, 'close').and.callThrough();

    let newThreadSubject = 'subject';
    let newThreadText = 'text';
    component.create(newThreadSubject, newThreadText);

    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      newThreadSubject: 'subject',
      newThreadText: 'text'
    });
  });
});
