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
 * @fileoverview Tests for language accent add modal.
 */

import {
  discardPeriodicTasks,
  ComponentFixture,
  TestBed,
  fakeAsync,
  flush,
  waitForAsync,
  tick,
} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AddAccentToVoiceoverLanguageModalComponent} from './add-accent-to-voiceover-language-modal.component';
import {AudioPlayerService} from 'services/audio-player.service';
import {MatTableModule} from '@angular/material/table';
import {MaterialModule} from 'modules/material.module';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {VoiceoverBackendApiService} from 'domain/voiceover/voiceover-backend-api.service';

describe('Add accent to voiceover', () => {
  let fixture: ComponentFixture<AddAccentToVoiceoverLanguageModalComponent>;
  let componentInstance: AddAccentToVoiceoverLanguageModalComponent;
  let voiceoverBackendApiService: VoiceoverBackendApiService;
  let closeSpy: jasmine.Spy;
  let dismissSpy: jasmine.Spy;
  let ngbActiveModal: NgbActiveModal;
  let audioPlayerService: AudioPlayerService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatTableModule,
        MaterialModule,
        FormsModule,
        HttpClientTestingModule,
      ],
      declarations: [AddAccentToVoiceoverLanguageModalComponent],
      providers: [
        VoiceoverBackendApiService,
        AudioPlayerService,
        NgbActiveModal,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      AddAccentToVoiceoverLanguageModalComponent
    );
    componentInstance = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    audioPlayerService = TestBed.inject(AudioPlayerService);
    voiceoverBackendApiService = TestBed.inject(VoiceoverBackendApiService);
  });

  it('should initialize component', fakeAsync(() => {
    let explorationIdToFilenames = {
      expId: ['filename1.mp3', 'filename2.mp3'],
    };
    spyOn(
      voiceoverBackendApiService,
      'fetchFilenamesForVoiceArtistAsync'
    ).and.returnValue(Promise.resolve(explorationIdToFilenames));
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(true);

    componentInstance.ngOnInit();
    tick(3000);

    expect(
      voiceoverBackendApiService.fetchFilenamesForVoiceArtistAsync
    ).toHaveBeenCalled();

    flush();
    discardPeriodicTasks();
  }));

  it('should be able to close modal', () => {
    componentInstance.cancel();
    expect(dismissSpy).toHaveBeenCalled();
  });

  it('should be able to update language accent code', () => {
    let languageAccentCode = 'en-US';
    componentInstance.languageAccentCode = languageAccentCode;
    componentInstance.update();
    expect(closeSpy).toHaveBeenCalledWith(languageAccentCode);
  });

  it('should be able to remove language accent code', () => {
    componentInstance.languageAccentCode = 'en-US';
    componentInstance.removeSelectedAccent();
    expect(componentInstance.languageAccentCode).toEqual('');
  });

  it('should be able to add language accent code', () => {
    componentInstance.languageAccentCode = 'en-US';
    let updatedLanguageAccentCode = 'en-IN';

    componentInstance.addLanguageAccentCodeSupport(updatedLanguageAccentCode);

    expect(componentInstance.languageAccentCode).toEqual(
      updatedLanguageAccentCode
    );
  });

  it('should be able to play audio', () => {
    spyOn(audioPlayerService, 'loadAsync').and.returnValue(Promise.resolve());
    componentInstance.playAudio('filename', 'explorationID');

    expect(audioPlayerService.loadAsync).toHaveBeenCalled();
  });

  it('should remove current filename when audio is not playing', fakeAsync(() => {
    let explorationIdToFilenames = {
      expId: ['filename1.mp3', 'filename2.mp3'],
    };
    spyOn(audioPlayerService, 'isPlaying').and.returnValue(false);
    spyOn(
      voiceoverBackendApiService,
      'fetchFilenamesForVoiceArtistAsync'
    ).and.returnValue(Promise.resolve(explorationIdToFilenames));
    componentInstance.currentFilename = 'random.mp3';

    componentInstance.ngOnInit();
    tick(3000);

    expect(componentInstance.currentFilename).toEqual('');

    flush();
    discardPeriodicTasks();
  }));
});
