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
  languageAccentCodesToDescriptionsMasterList!: LanguageAccentToDescription;
  languageCodesMapping!: LanguageCodesMapping;
  pageIsInitialized: boolean = false;
  languageAccentListIsModified: boolean = false;
  languageAccentDropdownIsShown: boolean = false;
  initialLanguageCodes: string[] = [];
  languageAccentPanelOpenState: boolean = false;
  languageAccentCodeIsPresent: boolean = false;

  ngOnInit(): void {
    this.voiceoverBackendApiService.fetchVoiceoverAdminDataAsync().then(
      response => {
        this.languageCodesMapping = response.languageCodesMapping;
        this.languageAccentCodeToLanguageCode = {};
        this.supportedLanguageAccentCodesToDescriptions = {};
        this.availableLanguageAccentCodesToDescriptions = {};
        this.languageAccentCodesToDescriptionsMasterList = {};
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
      this.languageAccentCodesToDescriptionsMasterList = {
        ...this.languageAccentCodesToDescriptionsMasterList,
        ...languageAccentCodesToDescriptions
      };
    }

    for (const languageCode in this.languageCodesMapping) {
      const languageAccentCodesToSupportsAutogeneration = (
        this.languageCodesMapping[languageCode]);
      for (const languageAccentCode of Object.keys(
        languageAccentCodesToSupportsAutogeneration)) {
        const languageDescription = (
          this.languageAccentCodesToDescriptionsMasterList[languageAccentCode]);
        this.supportedLanguageAccentCodesToDescriptions[
          languageAccentCode] = languageDescription;
      }
    }

    for (let languageAccentCode in
      this.languageAccentCodesToDescriptionsMasterList) {
      let languageAccentDescription = (
        this.languageAccentCodesToDescriptionsMasterList[languageAccentCode]);

      if (!(languageAccentCode in
        this.supportedLanguageAccentCodesToDescriptions)) {
        this.availableLanguageAccentCodesToDescriptions[
          languageAccentCode] = languageAccentDescription;
      }
    }

    this.initialLanguageCodes = Object.keys(
      this.supportedLanguageAccentCodesToDescriptions);

    this.languageAccentCodeIsPresent = (
      Object.keys(
        this.supportedLanguageAccentCodesToDescriptions).length !== 0);
  }

  addLanguageAccentCodeSupport(languageAccentCodeToAdd: string): void {
    const languageDescription = (
      this.languageAccentCodesToDescriptionsMasterList[
        languageAccentCodeToAdd]);
    this.supportedLanguageAccentCodesToDescriptions[
      languageAccentCodeToAdd] = languageDescription;
    delete this.availableLanguageAccentCodesToDescriptions[
      languageAccentCodeToAdd];

    const languageCode = (
      this.languageAccentCodeToLanguageCode[languageAccentCodeToAdd]);
    if (!(languageCode in this.languageCodesMapping)) {
      this.languageCodesMapping[languageCode] = {};
    }
    this.languageCodesMapping[languageCode][languageAccentCodeToAdd] = false;

    let languageCodesAfterAddition = Object.keys(
      this.supportedLanguageAccentCodesToDescriptions);
    if (
      JSON.stringify(this.initialLanguageCodes.sort()) !==
      JSON.stringify(languageCodesAfterAddition.sort())
    ) {
      this.languageAccentListIsModified = true;
    } else {
      this.languageAccentListIsModified = false;
    }

    this.languageAccentCodeIsPresent = (
      Object.keys(
        this.supportedLanguageAccentCodesToDescriptions).length !== 0);
    this.removeLanguageAccentDropdown();
  }

  removeLanguageAccentCodeSupport(languageAccentCodeToRemove: string): void {
    delete this.supportedLanguageAccentCodesToDescriptions[
      languageAccentCodeToRemove];
    this.availableLanguageAccentCodesToDescriptions[
      languageAccentCodeToRemove] = (
      this.languageAccentCodesToDescriptionsMasterList[
        languageAccentCodeToRemove]);

    const languageCode = (
      this.languageAccentCodeToLanguageCode[languageAccentCodeToRemove]);
    delete this.languageCodesMapping[languageCode][languageAccentCodeToRemove];

    if (Object.keys(this.languageCodesMapping[languageCode]).length === 0) {
      delete this.languageCodesMapping[languageCode];
    }

    let languageCodesAfterRemoval = Object.keys(
      this.supportedLanguageAccentCodesToDescriptions);
    if (
      JSON.stringify(this.initialLanguageCodes.sort()) !==
      JSON.stringify(languageCodesAfterRemoval.sort())
    ) {
      this.languageAccentListIsModified = true;
    } else {
      this.languageAccentListIsModified = false;
    }

    this.languageAccentCodeIsPresent = (
      Object.keys(
        this.supportedLanguageAccentCodesToDescriptions).length !== 0);
  }

  saveUpdatedLanguageAccentSupport(): void {
    this.voiceoverBackendApiService.updateVoiceoverLanguageCodesMappingAsync(
      this.languageCodesMapping).then(() => {
      this.languageAccentListIsModified = false;
      this.initialLanguageCodes = Object.keys(
        this.supportedLanguageAccentCodesToDescriptions);
      this.removeLanguageAccentDropdown();
    });
  }

  showLanguageAccentDropdown(): void {
    this.languageAccentDropdownIsShown = true;
  }

  removeLanguageAccentDropdown(): void {
    this.languageAccentDropdownIsShown = false;
  }
}

angular.module('oppia').directive(
  'oppiaVoiceoverAdminPage', downgradeComponent(
    {component: VoiceoverAdminPageComponent}));
