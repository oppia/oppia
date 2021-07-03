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
 * @fileoverview Unit test for the Translation tab active mode service.
 */

import { TestBed } from '@angular/core/testing';
import { TranslationTabActiveModeService } from 'pages/exploration-editor-page/translation-tab/services/translation-tab-active-mode.service';

describe('Translation tab active mode service', () => {
  let translationTabActiveModeService: TranslationTabActiveModeService;

  beforeEach(()=> {
    translationTabActiveModeService = TestBed.get(
      TranslationTabActiveModeService);
  });

  it('should correctly activate translation mode', () => {
    expect(
      translationTabActiveModeService.isTranslationModeActive()).toBeFalsy();
    translationTabActiveModeService.activateTranslationMode();
    expect(
      translationTabActiveModeService.isTranslationModeActive()).toBeTruthy();
  });

  it('should correctly activate voiceover mode', () => {
    expect(
      translationTabActiveModeService.isVoiceoverModeActive()).toBeFalsy();
    translationTabActiveModeService.activateVoiceoverMode();
    expect(
      translationTabActiveModeService.isVoiceoverModeActive()).toBeTruthy();
  });

  it('should correctly report the active mode', () => {
    expect(
      translationTabActiveModeService.isVoiceoverModeActive()).toBeFalsy();
    expect(
      translationTabActiveModeService.isTranslationModeActive()).toBeFalsy();

    translationTabActiveModeService.activateVoiceoverMode();

    expect(
      translationTabActiveModeService.isVoiceoverModeActive()).toBeTruthy();
    expect(
      translationTabActiveModeService.isTranslationModeActive()).toBeFalsy();

    translationTabActiveModeService.activateTranslationMode();

    expect(
      translationTabActiveModeService.isVoiceoverModeActive()).toBeFalsy();
    expect(
      translationTabActiveModeService.isTranslationModeActive()).toBeTruthy();
  });
});
