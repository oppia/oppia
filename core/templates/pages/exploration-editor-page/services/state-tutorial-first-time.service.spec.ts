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
 * @fileoverview Unit tests for StateTutorialFirstTimeService
 */

import {EventEmitter} from '@angular/core';
import {TestBed} from '@angular/core/testing';

import {EditorFirstTimeEventsService} from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {StateTutorialFirstTimeService} from 'pages/exploration-editor-page/services/state-tutorial-first-time.service';
import {TutorialEventsBackendApiService} from 'pages/exploration-editor-page/services/tutorial-events-backend-api.service';

describe('State Tutorial First Time Service', () => {
  let stft: StateTutorialFirstTimeService;
  let eftes: EditorFirstTimeEventsService;
  let tebas: TutorialEventsBackendApiService;
  let mockEmitter: EventEmitter<void>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    mockEmitter = new EventEmitter();
    stft = TestBed.inject(StateTutorialFirstTimeService);
    eftes = TestBed.inject(EditorFirstTimeEventsService);
    tebas = TestBed.inject(TutorialEventsBackendApiService);
  });

  it('should check the initialisation of the EventEmitters', () => {
    expect(stft.onEnterEditorForTheFirstTime).toEqual(mockEmitter);
    expect(stft.onEnterTranslationForTheFirstTime).toEqual(mockEmitter);
  });

  it('should fetch enterEditorForTheFirstTime EventEmitter', () => {
    expect(stft.onEnterEditorForTheFirstTime).toEqual(mockEmitter);
  });

  it('should fetch enterTranslationForTheFirstTime EventEmitter', () => {
    expect(stft.onEnterTranslationForTheFirstTime).toEqual(mockEmitter);
  });

  it('should fetch openEditorTutorial EventEmitter', () => {
    expect(stft.onOpenEditorTutorial).toEqual(mockEmitter);
  });

  it('should fetch openPostTutorialHelpPopover EventEmitter', () => {
    expect(stft.onOpenPostTutorialHelpPopover).toEqual(mockEmitter);
  });

  it('should fetch openTranslationTutorial EventEmitter', () => {
    expect(stft.onOpenTranslationTutorial).toEqual(mockEmitter);
  });

  it('should initialise the Editor', () => {
    spyOn(eftes, 'initRegisterEvents');
    spyOn(stft.onEnterEditorForTheFirstTime, 'emit');
    spyOn(tebas, 'recordStartedEditorTutorialEventAsync').and.returnValue(
      Promise.resolve({})
    );
    const errorLog = spyOn(console, 'error').and.callThrough();
    const expId = 'abc';
    stft.initEditor(true, expId);
    expect(eftes.initRegisterEvents).toHaveBeenCalled();
    expect(stft.onEnterEditorForTheFirstTime.emit).toHaveBeenCalled();
    expect(errorLog).not.toHaveBeenCalledWith(
      'Warning: could not record editor tutorial start event.'
    );
    expect(tebas.recordStartedEditorTutorialEventAsync).toHaveBeenCalled();
  });

  it('should not initialise the Editor', () => {
    spyOn(eftes, 'initRegisterEvents');
    spyOn(stft.onEnterEditorForTheFirstTime, 'emit');
    spyOn(tebas, 'recordStartedEditorTutorialEventAsync').and.returnValue(
      Promise.resolve({})
    );
    const errorLog = spyOn(console, 'error').and.callThrough();
    const expId = 'abc';
    stft.markEditorTutorialFinished();
    stft.initEditor(false, expId);
    expect(eftes.initRegisterEvents).not.toHaveBeenCalled();
    expect(stft.onEnterEditorForTheFirstTime.emit).not.toHaveBeenCalled();
    expect(errorLog).not.toHaveBeenCalledWith(
      'Warning: could not record editor tutorial start event.'
    );
    expect(tebas.recordStartedEditorTutorialEventAsync).not.toHaveBeenCalled();
  });

  it('should finish the editorTutorial', () => {
    spyOn(eftes, 'registerEditorFirstEntryEvent');
    stft.markEditorTutorialFinished();
    expect(eftes.registerEditorFirstEntryEvent).toHaveBeenCalled();
  });

  it('should test the promise rejection for Editor', () => {
    spyOn(tebas, 'recordStartedEditorTutorialEventAsync').and.returnValue(
      Promise.reject()
    );
    const errorLog = spyOn(console, 'error').and.callThrough();
    const expId = 'abc';
    stft.initEditor(true, expId);
    expect(errorLog).not.toHaveBeenCalledWith(
      'Warning: could not record translation tutorial start event.'
    );
    expect(tebas.recordStartedEditorTutorialEventAsync).toHaveBeenCalled();
  });

  it('should initialise the translation', () => {
    spyOn(eftes, 'initRegisterEvents');
    spyOn(stft.onEnterTranslationForTheFirstTime, 'emit');
    spyOn(tebas, 'recordStartedTranslationTutorialEventAsync').and.returnValue(
      Promise.resolve({})
    );
    const errorLog = spyOn(console, 'error').and.callThrough();
    const expId = 'abc';
    stft.initTranslation(expId);
    expect(eftes.initRegisterEvents).not.toHaveBeenCalled();
    expect(stft.onEnterTranslationForTheFirstTime.emit).not.toHaveBeenCalled();
    expect(errorLog).not.toHaveBeenCalledWith(
      'Warning: could not record translation tutorial start event.'
    );
    expect(
      tebas.recordStartedTranslationTutorialEventAsync
    ).not.toHaveBeenCalled();
  });

  it('should not initialise the translation', () => {
    spyOn(eftes, 'initRegisterEvents');
    spyOn(stft.onEnterTranslationForTheFirstTime, 'emit');
    spyOn(tebas, 'recordStartedTranslationTutorialEventAsync').and.returnValue(
      Promise.resolve({})
    );
    const errorLog = spyOn(console, 'error').and.callThrough();
    const expId = 'abc';
    stft.markTranslationTutorialNotSeenBefore();
    stft.initTranslation(expId);
    expect(eftes.initRegisterEvents).toHaveBeenCalled();
    expect(stft.onEnterTranslationForTheFirstTime.emit).toHaveBeenCalled();
    expect(errorLog).not.toHaveBeenCalledWith(
      'Warning: could not record translation tutorial start event.'
    );
    expect(tebas.recordStartedTranslationTutorialEventAsync).toHaveBeenCalled();
  });

  it('should finish the translation', () => {
    spyOn(eftes, 'registerEditorFirstEntryEvent');
    stft.markTranslationTutorialFinished();
    expect(eftes.registerEditorFirstEntryEvent).toHaveBeenCalled();
  });

  it('should test the promise rejection for Translator', () => {
    spyOn(tebas, 'recordStartedTranslationTutorialEventAsync').and.returnValue(
      Promise.reject()
    );
    const errorLog = spyOn(console, 'error').and.callThrough();
    const expId = 'abc';
    stft.markTranslationTutorialNotSeenBefore();
    stft.initTranslation(expId);
    expect(errorLog).not.toHaveBeenCalledWith(
      'Warning: could not record translation tutorial start event.'
    );
    expect(tebas.recordStartedTranslationTutorialEventAsync).toHaveBeenCalled();
  });
});
