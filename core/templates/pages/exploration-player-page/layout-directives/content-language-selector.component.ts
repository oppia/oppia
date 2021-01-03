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
 * @fileoverview Component for the content language selector displayed when
 * playing an exploration.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { ContentTranslationLanguageService } from
  'pages/exploration-player-page/services/content-translation-language.service';
import { ExplorationLanguageInfo } from
  'pages/exploration-player-page/services/audio-translation-language.service';
import { ContentTranslationManagerService } from
  'pages/exploration-player-page/services/content-translation-manager.service';

@Component({
  selector: 'content-language-selector',
  templateUrl: './content-language-selector.component.html',
  styleUrls: []
})
export class ContentLanguageSelectorComponent implements OnInit {
  constructor(
    private contentTranslationLanguageService:
      ContentTranslationLanguageService,
    private contentTranslationManagerService: ContentTranslationManagerService
  ) {}

  selectedLanguageCode: string;
  languageOptions: ExplorationLanguageInfo[];

  ngOnInit(): void {
    this.selectedLanguageCode = (
      this.contentTranslationLanguageService.getCurrentContentLanguageCode());
    this.languageOptions = (
      this.contentTranslationLanguageService.getLanguageOptionsForDropdown());
  }

  onSelectLanguage(newLanguageCode: string): void {
    this.contentTranslationLanguageService.setCurrentContentLanguageCode(
      newLanguageCode);
    this.contentTranslationManagerService.displayTranslations(newLanguageCode);
    this.selectedLanguageCode = newLanguageCode;
  }
}

angular.module('oppia').directive(
  'contentLanguageSelector',
  downgradeComponent({component: ContentLanguageSelectorComponent}));
