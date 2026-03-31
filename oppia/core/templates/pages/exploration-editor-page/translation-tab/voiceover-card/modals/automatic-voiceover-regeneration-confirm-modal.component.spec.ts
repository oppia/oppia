// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for automatic voiceover regeneration confirmation modal.
 */

import {
  ComponentFixture,
  TestBed,
  waitForAsync,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {MatTooltipModule} from '@angular/material/tooltip';
import {AutomaticVoiceoverRegenerationConfirmModalComponent} from './automatic-voiceover-regeneration-confirm-modal.component';
import {LoadingDotsComponent} from 'components/common-layout-directives/common-elements/loading-dots.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {VoiceoverBackendApiService} from 'domain/voiceover/voiceover-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {Voiceover} from 'domain/exploration/voiceover.model';

describe('Automatic Voiceover Regeneration Confirmation Modal', () => {
  let fixture: ComponentFixture<AutomaticVoiceoverRegenerationConfirmModalComponent>;
  let componentInstance: AutomaticVoiceoverRegenerationConfirmModalComponent;
  let ngbActiveModal: NgbActiveModal;
  let alertsService: AlertsService;
  let voiceoverBackendApiService: VoiceoverBackendApiService;
  let closeSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MatTooltipModule, HttpClientTestingModule],
      declarations: [
        AutomaticVoiceoverRegenerationConfirmModalComponent,
        LoadingDotsComponent,
      ],
      providers: [NgbActiveModal],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      AutomaticVoiceoverRegenerationConfirmModalComponent
    );
    componentInstance = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    voiceoverBackendApiService = TestBed.inject(VoiceoverBackendApiService);
    alertsService = TestBed.inject(AlertsService);
    closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should be able to regenerate automatic voiceovers', fakeAsync(() => {
    componentInstance.explorationId = 'exp_1';
    componentInstance.explorationVersion = 1;
    componentInstance.stateName = 'State1';
    componentInstance.contentId = 'content0';
    componentInstance.languageAccentCode = 'en-US';
    const sentenceTokenWithDurations = [
      {token: 'This', audioOffsetMsecs: 0.0},
      {token: 'is', audioOffsetMsecs: 100.0},
      {token: 'a', audioOffsetMsecs: 200.0},
      {token: 'text', audioOffsetMsecs: 300.0},
    ];

    let response = {
      filename: 'filename.mp3',
      durationSecs: 10.0,
      fileSizeBytes: 200000,
      needsUpdate: false,
      sentenceTokenWithDurations: sentenceTokenWithDurations,
    };

    spyOn(
      voiceoverBackendApiService,
      'generateAutomaticVoiceoverAsync'
    ).and.returnValue(Promise.resolve(response));

    componentInstance.regenerateAndClose();
    tick(1000);
    expect(closeSpy).toHaveBeenCalledWith({
      voiceover: new Voiceover('filename.mp3', 200000, false, 10.0),
      sentenceTokenWithDurations: sentenceTokenWithDurations,
    });
  }));

  it('should not be able to regenerate automatic voiceovers if any error is raised', fakeAsync(() => {
    componentInstance.explorationId = 'exp_1';
    componentInstance.explorationVersion = 1;
    componentInstance.stateName = 'State1';
    componentInstance.contentId = 'content0';
    componentInstance.languageAccentCode = 'en-US';

    spyOn(
      voiceoverBackendApiService,
      'generateAutomaticVoiceoverAsync'
    ).and.returnValue(Promise.reject({error: 'Voiceover regeneration failed'}));
    const alertSpy = spyOn(alertsService, 'addWarning').and.callThrough();

    componentInstance.regenerateAndClose();
    tick(1000);

    expect(alertSpy).toHaveBeenCalled();
  }));

  it('should be able to dismiss the modal', () => {
    spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    componentInstance.cancel();
    expect(ngbActiveModal.dismiss).toHaveBeenCalled();
  });

  it('should set the correct modal header', () => {
    componentInstance.isAutomaticVoiceoverPresent = true;
    componentInstance.ngOnInit();
    expect(componentInstance.modalHeader).toBe(
      'Are you sure you want to regenerate voiceover?'
    );

    componentInstance.isAutomaticVoiceoverPresent = false;
    componentInstance.ngOnInit();
    expect(componentInstance.modalHeader).toBe(
      'Are you sure you want to generate voiceover?'
    );
  });
});
