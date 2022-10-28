// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TrainingDataEditorPanelService.
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AlertsService } from 'services/alerts.service';
import { ExternalSaveService } from 'services/external-save.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TrainingDataEditorPanelService } from './training-data-editor-panel.service';

describe('Training Modal Service', () => {
  let trainingDataEditorPanelService: TrainingDataEditorPanelService;
  let alertsService: AlertsService;
  let ngbModal: NgbModal;
  let externalSaveService: ExternalSaveService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TrainingDataEditorPanelService,
        AlertsService,
        ExternalSaveService,
        NgbModal
      ]
    });

    trainingDataEditorPanelService = TestBed.inject(
      TrainingDataEditorPanelService);
    alertsService = TestBed.inject(AlertsService);
    ngbModal = TestBed.inject(NgbModal);
    externalSaveService = TestBed.inject(ExternalSaveService);
  });

  it('should open NgbModal', () => {
    spyOn(alertsService, 'clearWarnings')
      .and.stub();
    spyOn(ngbModal, 'open').and.callFake(() => {
      return ({
        result: Promise.resolve()
      } as NgbModalRef);
    });
    spyOn(externalSaveService.onExternalSave, 'emit').and.stub();

    trainingDataEditorPanelService.openTrainingDataEditor();

    expect(alertsService.clearWarnings).toHaveBeenCalled();
    expect(
      externalSaveService.onExternalSave.emit).toHaveBeenCalled();
    expect(ngbModal.open).toHaveBeenCalled();
  });
});
