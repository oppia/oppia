// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Reusable lesson language selector UI.
 */

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {LanguageUtilService} from 'domain/utilities/language-util.service';

import './language-selector.component.css';

@Component({
  selector: 'topic-lesson-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.css'],
})
export class LanguageSelectorComponent implements OnChanges {
  @Input() availableTextLanguageCodes: string[] = [];
  @Input() availableVoiceoverLanguageCodes: string[] = [];
  @Input() voiceoverLanguageAccentDescriptions: {[accentCode: string]: string} =
    {};
  @Input() selectedTextLanguageCode: string | null = null;
  @Input() selectedVoiceoverLanguageCode: string | null = null;
  @Input() showValidationError: boolean = false;

  @Output() selectedTextLanguageCodeChange = new EventEmitter<string | null>();
  @Output() selectedVoiceoverLanguageCodeChange = new EventEmitter<
    string | null
  >();

  filteredVoiceoverLanguageCodes: string[] = [];

  constructor(
    private languageUtilService: LanguageUtilService,
    private translateService: TranslateService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.availableVoiceoverLanguageCodes ||
      changes.selectedTextLanguageCode
    ) {
      this.recomputeFilteredVoiceoverLanguageCodes();
    }
  }

  onTextLanguageChange(newLanguageCode: string): void {
    this.selectedTextLanguageCode = newLanguageCode || null;
    this.selectedTextLanguageCodeChange.emit(this.selectedTextLanguageCode);
    this.recomputeFilteredVoiceoverLanguageCodes();
    this.clearSelectedVoiceoverLanguageIfInvalid();
  }

  onVoiceoverLanguageChange(newLanguageCode: string): void {
    this.selectedVoiceoverLanguageCode = newLanguageCode || null;
    this.selectedVoiceoverLanguageCodeChange.emit(
      this.selectedVoiceoverLanguageCode
    );
  }

  hasVoiceoverLanguageOptions(): boolean {
    return this.filteredVoiceoverLanguageCodes.length > 0;
  }

  private recomputeFilteredVoiceoverLanguageCodes(): void {
    if (!this.selectedTextLanguageCode) {
      this.filteredVoiceoverLanguageCodes = [];
      return;
    }

    const textRootCode = this.getLanguageRootCode(
      this.selectedTextLanguageCode
    );

    this.filteredVoiceoverLanguageCodes =
      this.availableVoiceoverLanguageCodes.filter(voiceoverCode => {
        if (this.getLanguageRootCode(voiceoverCode) === textRootCode) {
          return true;
        }

        const relatedCodes =
          this.getRelatedLanguageCodesForAudioCode(voiceoverCode);
        return (
          relatedCodes !== undefined && relatedCodes.includes(textRootCode)
        );
      });
  }

  getValidSelectedVoiceoverLanguageCode(): string | null {
    if (
      this.selectedVoiceoverLanguageCode &&
      this.filteredVoiceoverLanguageCodes.includes(
        this.selectedVoiceoverLanguageCode
      )
    ) {
      return this.selectedVoiceoverLanguageCode;
    }

    return null;
  }

  getSelectedVoiceoverLanguageLabel(): string {
    const selectedVoiceoverLanguageCode =
      this.getValidSelectedVoiceoverLanguageCode();

    if (selectedVoiceoverLanguageCode) {
      return this.getLanguageDescription(selectedVoiceoverLanguageCode);
    }

    return this.hasVoiceoverLanguageOptions()
      ? this.translateService.instant('I18N_LANGUAGE_SELECTOR_SELECT')
      : this.translateService.instant(
          'I18N_LANGUAGE_SELECTOR_NO_ACCENTS_MESSAGE'
        );
  }

  shouldShowNoAccentsMessage(): boolean {
    return !this.hasVoiceoverLanguageOptions();
  }

  shouldShowTextLanguageValidationError(): boolean {
    return this.showValidationError && !this.selectedTextLanguageCode;
  }

  getLanguageDescription(languageCode: string): string {
    const voiceoverAccentDescription =
      this.voiceoverLanguageAccentDescriptions[languageCode];
    if (voiceoverAccentDescription) {
      return voiceoverAccentDescription;
    }

    const contentLanguageDescription =
      this.languageUtilService.getContentLanguageDescription(languageCode);
    if (contentLanguageDescription) {
      return contentLanguageDescription;
    }

    try {
      const audioLanguageDescription =
        this.languageUtilService.getAudioLanguageDescription(languageCode);
      if (audioLanguageDescription) {
        return audioLanguageDescription;
      }
    } catch {
      // Some exploration-specific accent codes may not be in global constants.
      // In those cases, fall back to showing the raw code.
    }

    return languageCode;
  }

  private getRelatedLanguageCodesForAudioCode(
    audioLanguageCode: string
  ): readonly string[] | undefined {
    try {
      return this.languageUtilService
        .getLanguageCodesRelatedToAudioLanguageCode(audioLanguageCode)
        .map(code => this.getLanguageRootCode(code));
    } catch {
      return undefined;
    }
  }

  private clearSelectedVoiceoverLanguageIfInvalid(): void {
    if (
      this.selectedVoiceoverLanguageCode &&
      !this.filteredVoiceoverLanguageCodes.includes(
        this.selectedVoiceoverLanguageCode
      )
    ) {
      this.selectedVoiceoverLanguageCode = null;
      this.selectedVoiceoverLanguageCodeChange.emit(null);
    }
  }

  private getLanguageRootCode(languageCode: string): string {
    return languageCode.split(/[-_]/)[0].toLowerCase();
  }
}
