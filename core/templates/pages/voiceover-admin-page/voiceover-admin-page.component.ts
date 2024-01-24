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
 * @fileoverview Voiceover admin component.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { VoiceoverBackendApiService, LanguageAccentToDescription, LanguageCodesMapping, LanguageAccentMasterList } from 'domain/voiceover/voiceover-backend-api.service';
import { typeOf } from 'mathjs';

interface LanguageAccentCodeToLanguageCode {
  [languageAccentCode: string]: string;
}

@Component({
  selector: 'oppia-voiceover-admin-page',
  templateUrl: './voiceover-admin-page.component.html',
})
export class VoiceoverAdminPageComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  constructor(
    private voiceoverBackendApiService: VoiceoverBackendApiService,
  ) {}

  languageAccentCodeToLanguageCode!: LanguageAccentCodeToLanguageCode;
  supportedLanguageAccentCodesToDescriptions!: LanguageAccentToDescription;
  availableLanguageAccentCodesToDescriptions!: LanguageAccentToDescription;
  languageCodesMapping!: LanguageCodesMapping;
  pageIsInitialized: boolean = false;
  languageAccentListIsModified: boolean = false;

  ngOnInit(): void {
    this.voiceoverBackendApiService.fetchVoiceoverAdminDataAsync().then(
      response => {
        this.languageCodesMapping = response.languageCodesMapping;
        this.languageAccentCodeToLanguageCode = {};
        this.supportedLanguageAccentCodesToDescriptions = {};
        this.availableLanguageAccentCodesToDescriptions = {};
        this.initializeLanguageAccentCodesFields(
          response.languageAccentMasterList);
        this.pageIsInitialized = true;
      }
    );
  }

  initializeLanguageAccentCodesFields(
      languageAccentMasterList: LanguageAccentMasterList): void {
    for (let languageCode in languageAccentMasterList) {
      const languageAccentCodesToDescriptions = (
        languageAccentMasterList[languageCode]);
      for (let languageAccentCode in languageAccentCodesToDescriptions) {
        this.languageAccentCodeToLanguageCode[
          languageAccentCode] = languageCode;
      }
      this.availableLanguageAccentCodesToDescriptions = {
        ...this.availableLanguageAccentCodesToDescriptions,
        ...languageAccentCodesToDescriptions
      };
    }

    for (const languageCode in this.languageCodesMapping) {
      const languageAccentCodesToSupportsAutogeneration = (
        this.languageCodesMapping[languageCode]);

      for (const languageAccentCode of Object.keys(
        languageAccentCodesToSupportsAutogeneration)) {
        const languageDescription = (
          this.availableLanguageAccentCodesToDescriptions[languageAccentCode]);
        this.supportedLanguageAccentCodesToDescriptions[
          languageAccentCode] = languageDescription;
      }
    }
  }


  addLanguageAccentCodeSupport(languageAccentCodeWithIndex): void {
    // check this and remove.
    console.log(typeOf(languageAccentCodeWithIndex));
    const languageAccentCodeToAdd = (
      languageAccentCodeWithIndex.split(':')[1].trim());

    const languageDescription = (
      this.availableLanguageAccentCodesToDescriptions[languageAccentCodeToAdd]);
    this.supportedLanguageAccentCodesToDescriptions[
      languageAccentCodeToAdd] = languageDescription;

    const languageCode = (
      this.languageAccentCodeToLanguageCode[languageAccentCodeToAdd]);
    if (!(languageCode in this.languageCodesMapping)) {
      this.languageCodesMapping[languageCode] = {};
    }
    this.languageCodesMapping[languageCode][languageAccentCodeToAdd] = false;

    this.languageAccentListIsModified = true;
  }

  removeLanguageAccentCodeSupport(languageAccentCodeToRemove: string): void {
    delete this.supportedLanguageAccentCodesToDescriptions[
      languageAccentCodeToRemove];

    const languageCode = (
      this.languageAccentCodeToLanguageCode[languageAccentCodeToRemove]);
    delete this.languageCodesMapping[languageCode][languageAccentCodeToRemove];

    if (Object.keys(this.languageCodesMapping[languageCode]).length === 0) {
      delete this.languageCodesMapping[languageCode];
    }

    this.languageAccentListIsModified = true;
  }

  saveUpdatedLanguageAccentSupport(): void {
    this.languageAccentListIsModified = false;
  }
}

angular.module('oppia').directive(
  'oppiaVoiceoverAdminPage', downgradeComponent(
    {component: VoiceoverAdminPageComponent}));
