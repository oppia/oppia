// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for AddAudioTranslationModalComponent.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';
import { AddAudioTranslationModalComponent } from './add-audio-translation-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Add Audio Translation Modal component', () => {
  let component: AddAudioTranslationModalComponent;
  let fixture: ComponentFixture<AddAudioTranslationModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let assetsBackendApiService: AssetsBackendApiService;
  let contextService: ContextService;

  let audioFile = new File([], '');
  let generatedFilename = 'new_audio_file.mp3';
  let isAudioAvailable = true;
  let languageCode = 'en';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        AddAudioTranslationModalComponent
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

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAudioTranslationModalComponent);
    component = fixture.componentInstance;

    ngbActiveModal = TestBed.inject(NgbActiveModal);
    contextService = TestBed.inject(ContextService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);

    spyOn(ngbActiveModal, 'close');
    spyOn(ngbActiveModal, 'dismiss');

    component.audioFile = audioFile;
    component.generatedFilename = generatedFilename;
    component.isAudioAvailable = isAudioAvailable;
    component.languageCode = languageCode;

    fixture.detectChanges();
  });

  it('should initialize component properties after component is initialized',
    () => {
      expect(component.saveButtonText).toBe('Save');
      expect(component.saveInProgress).toBe(false);
      expect(component.isAudioAvailable).toBe(isAudioAvailable);
      expect(component.droppedFile).toBe(audioFile);
    });

  it('should save audio successfully then close the modal', fakeAsync(() => {
    let file = {
      size: 1000
    };
    component.updateUploadedFile(file as Blob);

    spyOn(contextService, 'getExplorationId').and.returnValue('exp1');

    let response = {
      filename: 'filename',
      duration_secs: 10
    };

    spyOn(assetsBackendApiService, 'saveAudio').and.returnValue(
      Promise.resolve(response));

    component.confirm();
    tick();

    expect(component.saveButtonText).toBe('Saving...');
    expect(component.saveInProgress).toBe(true);
    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      languageCode: languageCode,
      filename: generatedFilename,
      fileSizeBytes: file.size,
      durationSecs: response.duration_secs
    });
  }));

  it('should use reject handler when trying to save audio fails',
    fakeAsync(() => {
      let file = {
        size: 1000
      };
      component.updateUploadedFile(file as Blob);

      spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
      spyOn(assetsBackendApiService, 'saveAudio')
        .and.returnValue(Promise.reject({}));

      component.confirm();

      expect(component.saveButtonText).toBe('Saving...');
      expect(component.saveInProgress).toBe(true);

      tick();

      expect(component.errorMessage).toBe(
        'There was an error uploading the audio file.');
      expect(component.saveButtonText).toBe('Save');
      expect(component.saveInProgress).toBe(false);
      expect(ngbActiveModal.close).not.toHaveBeenCalled();

      component.clearUploadedFile();
      expect(component.errorMessage).toBe(null);
    }));
});
