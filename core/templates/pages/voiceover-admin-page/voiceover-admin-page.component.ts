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

import {Component, OnInit} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {
  VoiceoverBackendApiService,
  LanguageAccentToDescription,
  LanguageCodesMapping,
  LanguageAccentMasterList,
  VoiceArtistIdToLanguageMapping,
  VoiceArtistIdToVoiceArtistName,
} from 'domain/voiceover/voiceover-backend-api.service';
import {VoiceoverRemovalConfirmModalComponent} from './modals/language-accent-removal-confirm-modal.component';
import {VoiceArtistLanguageMapping} from './voice-artist-language-mapping.model';
import {AddAccentToVoiceoverLanguageModalComponent} from './modals/add-accent-to-voiceover-language-modal.component';
import {PlatformFeatureService} from 'services/platform-feature.service';

interface LanguageAccentCodeToLanguageCode {
  [languageAccentCode: string]: string;
}

export interface LanguageAccentDescriptionToCode {
  [languageAccentDescription: string]: string;
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
    private platformFeatureService: PlatformFeatureService
  ) {}

  languageAccentCodeToLanguageCode!: LanguageAccentCodeToLanguageCode;
  supportedLanguageAccentCodesToDescriptions!: LanguageAccentToDescription;
  availableLanguageAccentDescriptionsToCodes!: LanguageAccentDescriptionToCode;
  languageAccentCodesToDescriptionsMasterList!: LanguageAccentToDescription;
  languageCodesMapping!: LanguageCodesMapping;
  pageIsInitialized: boolean = false;
  languageAccentDropdownIsShown: boolean = false;
  languageAccentCodeIsPresent: boolean = false;
  voiceArtistIdToLanguageMappingList!: VoiceArtistLanguageMapping[];
  voiceArtistIdToLanguageMapping!: VoiceArtistIdToLanguageMapping;
  voiceArtistIdToVoiceArtistName!: VoiceArtistIdToVoiceArtistName;
  languageAccentMasterList!: LanguageAccentMasterList;
  columnsToDisplay: string[] = [
    'voiceArtist',
    'languageCode',
    'languageAccentCode',
    'languageAccentCodeModify',
  ];

  voiceArtistsDataCount: number = 0;

  ngOnInit(): void {
    this.voiceoverBackendApiService
      .fetchVoiceoverAdminDataAsync()
      .then(response => {
        this.languageCodesMapping = response.languageCodesMapping;
        this.languageAccentCodeToLanguageCode = {};
        this.supportedLanguageAccentCodesToDescriptions = {};
        this.languageAccentCodesToDescriptionsMasterList = {};
        this.availableLanguageAccentDescriptionsToCodes = {};
        this.initializeLanguageAccentCodesFields(
          response.languageAccentMasterList
        );
        this.languageAccentMasterList = response.languageAccentMasterList;
        this.pageIsInitialized = true;
      });
    this.voiceoverBackendApiService
      .fetchVoiceArtistMetadataAsync()
      .then(response => {
        this.voiceArtistIdToLanguageMapping =
          response.voiceArtistIdToLanguageMapping;
        this.voiceArtistIdToLanguageMappingList =
          VoiceArtistLanguageMapping.createVoiceArtistLanguageMappingList(
            this.voiceArtistIdToLanguageMapping
          );
        this.voiceArtistsDataCount =
          this.voiceArtistIdToLanguageMappingList.length;
        this.voiceArtistIdToVoiceArtistName =
          response.voiceArtistIdToVoiceArtistName;
      });
  }

  isLabelingVoiceArtistFeatureEnabled(): boolean {
    return this.platformFeatureService.status.LabelAccentToVoiceArtist
      .isEnabled;
  }

  addLanguageAccentForVoiceArtist(
    voiceArtistId: string,
    languageCode: string
  ): void {
    let languageAccentCodes = this.languageAccentMasterList[languageCode];
    let modalRef: NgbModalRef = this.ngbModal.open(
      AddAccentToVoiceoverLanguageModalComponent,
      {
        backdrop: 'static',
      }
    );
    let currentLanguageAccentCode =
      this.voiceArtistIdToLanguageMapping[voiceArtistId][languageCode];

    modalRef.componentInstance.languageCode = languageCode;
    modalRef.componentInstance.voiceArtistId = voiceArtistId;
    modalRef.componentInstance.voiceArtistName =
      this.voiceArtistIdToVoiceArtistName[voiceArtistId];
    modalRef.componentInstance.languageAccentCode = currentLanguageAccentCode;
    modalRef.componentInstance.languageAccentCodes = languageAccentCodes;

    modalRef.result.then(
      languageAccentCode => {
        this.voiceArtistIdToLanguageMapping[voiceArtistId][languageCode] =
          languageAccentCode;
        this.voiceArtistIdToLanguageMappingList =
          VoiceArtistLanguageMapping.createVoiceArtistLanguageMappingList(
            this.voiceArtistIdToLanguageMapping
          );
        this.voiceoverBackendApiService.updateVoiceArtistToLanguageAccentAsync(
          voiceArtistId,
          languageCode,
          languageAccentCode
        );
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is
        // clicked. No further action is needed.
      }
    );
  }

  initializeLanguageAccentCodesFields(
    languageAccentMasterList: LanguageAccentMasterList
  ): void {
    for (let languageCode in languageAccentMasterList) {
      const languageAccentCodesToDescriptions =
        languageAccentMasterList[languageCode];

      for (let languageAccentCode in languageAccentCodesToDescriptions) {
        const languageAccentDescription =
          languageAccentCodesToDescriptions[languageAccentCode];

        this.languageAccentCodeToLanguageCode[languageAccentCode] =
          languageCode;

        this.languageAccentCodesToDescriptionsMasterList[languageAccentCode] =
          languageAccentDescription;
      }
    }

    for (let languageCode in this.languageCodesMapping) {
      const languageAccentToSupportsAutogeneration =
        this.languageCodesMapping[languageCode];

      for (let languageAccentCode in languageAccentToSupportsAutogeneration) {
        const languageAccentDescription =
          this.languageAccentCodesToDescriptionsMasterList[languageAccentCode];

        this.supportedLanguageAccentCodesToDescriptions[languageAccentCode] =
          languageAccentDescription;
      }
    }

    for (let languageAccentCode in this
      .languageAccentCodesToDescriptionsMasterList) {
      const languageAccentDescription =
        this.languageAccentCodesToDescriptionsMasterList[languageAccentCode];

      if (
        !(languageAccentCode in this.supportedLanguageAccentCodesToDescriptions)
      ) {
        this.availableLanguageAccentDescriptionsToCodes[
          languageAccentDescription
        ] = languageAccentCode;
      }
    }

    this.languageAccentCodeIsPresent =
      Object.keys(this.supportedLanguageAccentCodesToDescriptions).length !== 0;
  }

  addLanguageAccentCodeSupport(languageAccentCodeToAdd: string): void {
    const languageCode =
      this.languageAccentCodeToLanguageCode[languageAccentCodeToAdd];
    const languageAccentDescription =
      this.languageAccentCodesToDescriptionsMasterList[languageAccentCodeToAdd];

    this.supportedLanguageAccentCodesToDescriptions[languageAccentCodeToAdd] =
      languageAccentDescription;
    delete this.availableLanguageAccentDescriptionsToCodes[
      languageAccentDescription
    ];

    if (!(languageCode in this.languageCodesMapping)) {
      this.languageCodesMapping[languageCode] = {};
    }
    this.languageCodesMapping[languageCode][languageAccentCodeToAdd] = false;

    this.languageAccentCodeIsPresent =
      Object.keys(this.supportedLanguageAccentCodesToDescriptions).length !== 0;
    this.removeLanguageAccentDropdown();
    this.saveUpdatedLanguageAccentSupport();
  }

  removeLanguageAccentCodeSupport(languageAccentCodeToRemove: string): void {
    const languageCode =
      this.languageAccentCodeToLanguageCode[languageAccentCodeToRemove];
    const languageAccentDescription =
      this.languageAccentCodesToDescriptionsMasterList[
        languageAccentCodeToRemove
      ];

    let modalRef: NgbModalRef = this.ngbModal.open(
      VoiceoverRemovalConfirmModalComponent,
      {
        backdrop: 'static',
      }
    );

    modalRef.componentInstance.languageAccentDescription =
      languageAccentDescription;

    modalRef.result.then(
      () => {
        delete this.supportedLanguageAccentCodesToDescriptions[
          languageAccentCodeToRemove
        ];
        this.availableLanguageAccentDescriptionsToCodes[
          languageAccentDescription
        ] = languageAccentCodeToRemove;

        delete this.languageCodesMapping[languageCode][
          languageAccentCodeToRemove
        ];

        if (Object.keys(this.languageCodesMapping[languageCode]).length === 0) {
          delete this.languageCodesMapping[languageCode];
        }

        this.languageAccentCodeIsPresent =
          Object.keys(this.supportedLanguageAccentCodesToDescriptions)
            .length !== 0;
        this.saveUpdatedLanguageAccentSupport();
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is
        // clicked. No further action is needed.
      }
    );
  }

  saveUpdatedLanguageAccentSupport(): void {
    this.voiceoverBackendApiService
      .updateVoiceoverLanguageCodesMappingAsync(this.languageCodesMapping)
      .then(() => {
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
