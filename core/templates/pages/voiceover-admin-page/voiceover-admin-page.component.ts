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
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { VoiceoverRemovalConfirmModalComponent } from
  './modals/language-accent-removal-confirm-modal.component';
import {
  VoiceoverBackendApiService, LanguageAccentToDescription,
  LanguageCodesMapping, LanguageAccentMasterList
} from 'domain/voiceover/voiceover-backend-api.service';


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
    private ngbModal: NgbModal,
    private voiceoverBackendApiService: VoiceoverBackendApiService,
  ) {}

  languageAccentCodeToLanguageCode!: LanguageAccentCodeToLanguageCode;
  supportedLanguageAccentCodesToDescriptions!: LanguageAccentToDescription;
  availableLanguageAccentCodesToDescriptions!: LanguageAccentToDescription;
  languageAccentCodesToDescriptionsMasterList!: LanguageAccentToDescription;
  languageCodesMapping!: LanguageCodesMapping;
  pageIsInitialized: boolean = false;
  languageAccentDropdownIsShown: boolean = false;
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
        const languageAccentDescription = (
          languageAccentCodesToDescriptions[languageAccentCode]);

        this.languageAccentCodeToLanguageCode[
          languageAccentCode] = languageCode;

        this.languageAccentCodesToDescriptionsMasterList[
          languageAccentCode] = languageAccentDescription;
      }
    }

    for (let languageCode in this.languageCodesMapping) {
      const languageAccentToSupportsAutogeneration = (
        this.languageCodesMapping[languageCode]);

      for (let languageAccentCode in languageAccentToSupportsAutogeneration) {
        const languageAccentDescription = (
          this.languageAccentCodesToDescriptionsMasterList[languageAccentCode]);

        this.supportedLanguageAccentCodesToDescriptions[
          languageAccentCode] = languageAccentDescription;
      }
    }

    for (let languageAccentCode in
      this.languageAccentCodesToDescriptionsMasterList) {
      const languageAccentDescription = (
        this.languageAccentCodesToDescriptionsMasterList[languageAccentCode]);

      if (!(languageAccentCode in
        this.supportedLanguageAccentCodesToDescriptions)) {
        this.availableLanguageAccentCodesToDescriptions[
          languageAccentCode] = languageAccentDescription;
      }
    }

    this.languageAccentCodeIsPresent = (Object.keys(
      this.supportedLanguageAccentCodesToDescriptions).length !== 0);
  }

  addLanguageAccentCodeSupport(languageAccentCodeToAdd: string): void {
    const languageCode = (
      this.languageAccentCodeToLanguageCode[languageAccentCodeToAdd]);
    const languageAccentDescription = (
      this.languageAccentCodesToDescriptionsMasterList[
        languageAccentCodeToAdd]);

    this.supportedLanguageAccentCodesToDescriptions[
      languageAccentCodeToAdd] = languageAccentDescription;
    delete this.availableLanguageAccentCodesToDescriptions[
      languageAccentCodeToAdd];

    if (!(languageCode in this.languageCodesMapping)) {
      this.languageCodesMapping[languageCode] = {};
    }
    this.languageCodesMapping[languageCode][languageAccentCodeToAdd] = false;

    this.languageAccentCodeIsPresent = (Object.keys(
      this.supportedLanguageAccentCodesToDescriptions).length !== 0);
    this.removeLanguageAccentDropdown();
    this.saveUpdatedLanguageAccentSupport();
  }

  removeLanguageAccentCodeSupport(languageAccentCodeToRemove: string): void {
    const languageCode = (
      this.languageAccentCodeToLanguageCode[languageAccentCodeToRemove]);
    const languageAccentDescription = (
      this.languageAccentCodesToDescriptionsMasterList[
        languageAccentCodeToRemove]);

    let modalRef: NgbModalRef = this.ngbModal.
      open(VoiceoverRemovalConfirmModalComponent, {
        backdrop: 'static'
      });

    modalRef.componentInstance.languageAccentDescription = (
      languageAccentDescription);

    modalRef.result.then(() => {
      delete this.supportedLanguageAccentCodesToDescriptions[
        languageAccentCodeToRemove];
      this.availableLanguageAccentCodesToDescriptions[
        languageAccentCodeToRemove] = languageAccentDescription;

      delete this.languageCodesMapping[
        languageCode][languageAccentCodeToRemove];

      if (Object.keys(this.languageCodesMapping[languageCode]).length === 0) {
        delete this.languageCodesMapping[languageCode];
      }

      this.languageAccentCodeIsPresent = (Object.keys(
        this.supportedLanguageAccentCodesToDescriptions).length !== 0);
      this.saveUpdatedLanguageAccentSupport();
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is
      // clicked. No further action is needed.
    });
  }

  saveUpdatedLanguageAccentSupport(): void {
    this.voiceoverBackendApiService.updateVoiceoverLanguageCodesMappingAsync(
      this.languageCodesMapping).then(() => {
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
