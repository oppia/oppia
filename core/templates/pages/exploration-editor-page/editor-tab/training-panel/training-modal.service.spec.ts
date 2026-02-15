// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TrainingModalService.
 */

import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {AlertsService} from 'services/alerts.service';
import {TrainingModalService} from './training-modal.service';
import {ExternalSaveService} from 'services/external-save.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {EventEmitter} from '@angular/core';

describe('Training Modal Service', () => {
  let trainingModalService: TrainingModalService;
  let alertsService: AlertsService;
  let externalSaveService: ExternalSaveService;
  let ngbModal: NgbModal;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TrainingModalService,
        AlertsService,
        ExternalSaveService,
        NgbModal,
      ],
    });

    trainingModalService = TestBed.inject(TrainingModalService);
    alertsService = TestBed.inject(AlertsService);
    externalSaveService = TestBed.inject(ExternalSaveService);
    ngbModal = TestBed.inject(NgbModal);
  });

  it('should open NgbModal', fakeAsync(() => {
    let MockComponentInstance = {
      unhandledAnswer: 'unhandledAnswer',
      finishTrainingCallback: new EventEmitter(),
      answerIndex: -1,
      interactionId: '',
    };

    spyOn(alertsService, 'clearWarnings').and.stub();
    spyOn(externalSaveService.onExternalSave, 'emit').and.stub();
    spyOn(ngbModal, 'open').and.callFake(() => {
      return {
        componentInstance: MockComponentInstance,
        result: Promise.resolve(),
      } as NgbModalRef;
    });

    const modalRef = trainingModalService.openTrainUnresolvedAnswerModal(
      'Test',
      'textInput',
      2
    );
    tick();

    expect(alertsService.clearWarnings).toHaveBeenCalled();
    expect(modalRef.componentInstance.unhandledAnswer).toBe('Test');
    expect(modalRef.componentInstance.interactionId).toBe('textInput');
    expect(modalRef.componentInstance.answerIndex).toBe(2);
    expect(externalSaveService.onExternalSave.emit).toHaveBeenCalled();
    expect(ngbModal.open).toHaveBeenCalled();
  }));
});
