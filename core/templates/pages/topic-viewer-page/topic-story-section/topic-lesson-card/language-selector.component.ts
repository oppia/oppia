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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {LanguageUtilService} from 'domain/utilities/language-util.service';

import './language-selector.component.css';

@Component({
  selector: 'topic-lesson-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.css'],
})
export class LanguageSelectorComponent {
  @Input() availableTextLanguageCodes: string[] = [];
  @Input() availableVoiceoverLanguageCodes: string[] = [];
  @Input() selectedTextLanguageCode: string | null = null;
  @Input() selectedVoiceoverLanguageCode: string | null = null;
  @Input() showValidationError: boolean = false;

  @Output() selectedTextLanguageCodeChange = new EventEmitter<string | null>();
  @Output() selectedVoiceoverLanguageCodeChange = new EventEmitter<
    string | null
  >();

  constructor(private languageUtilService: LanguageUtilService) {}

  onTextLanguageChange(newLanguageCode: string): void {
    this.selectedTextLanguageCode = newLanguageCode || null;
    this.selectedTextLanguageCodeChange.emit(this.selectedTextLanguageCode);
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

  get filteredVoiceoverLanguageCodes(): string[] {
    if (!this.selectedTextLanguageCode) {
      return [];
    }

    const selectedTextLanguageRootCode = this.getLanguageRootCode(
      this.selectedTextLanguageCode
    );

    return this.availableVoiceoverLanguageCodes.filter(
      voiceoverLanguageCode =>
        this.getLanguageRootCode(voiceoverLanguageCode) ===
        selectedTextLanguageRootCode
    );
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
      ? 'Select'
      : 'No accents available';
  }

  shouldShowNoAccentsMessage(): boolean {
    return !this.hasVoiceoverLanguageOptions();
  }

  shouldShowTextLanguageValidationError(): boolean {
    return this.showValidationError && !this.selectedTextLanguageCode;
  }

  getLanguageDescription(languageCode: string): string {
    return (
      this.languageUtilService.getContentLanguageDescription(languageCode) ||
      this.languageUtilService.getAudioLanguageDescription(languageCode) ||
      languageCode
    );
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
    return languageCode.split('-')[0].toLowerCase();
  }
}
