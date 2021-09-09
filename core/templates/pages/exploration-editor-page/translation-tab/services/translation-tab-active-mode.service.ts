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
 * @fileoverview Service to change and validate active mode in the translation
 *      tab.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { ExplorationEditorPageConstants } from
  'pages/exploration-editor-page/exploration-editor-page.constants';

@Injectable({
  providedIn: 'root'
})
export class TranslationTabActiveModeService {
  private activeMode!: string;

  activateVoiceoverMode(): void {
    this.activeMode = ExplorationEditorPageConstants.VOICEOVER_MODE;
  }

  activateTranslationMode(): void {
    this.activeMode = ExplorationEditorPageConstants.TRANSLATION_MODE;
  }

  isTranslationModeActive(): boolean {
    return this.activeMode === ExplorationEditorPageConstants.TRANSLATION_MODE;
  }

  isVoiceoverModeActive(): boolean {
    return this.activeMode === ExplorationEditorPageConstants.VOICEOVER_MODE;
  }
}

angular.module('oppia').factory(
  'TranslationTabActiveModeService',
  downgradeInjectable(TranslationTabActiveModeService));
