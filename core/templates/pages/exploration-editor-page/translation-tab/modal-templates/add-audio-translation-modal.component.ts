// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for add audio translation modal.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { ContextService } from 'services/context.service';

@Component({
  selector: 'oppia-add-audio-translation-modal',
  templateUrl: './add-audio-translation-modal.component.html'
})
export class AddAudioTranslationModalComponent
   extends ConfirmOrCancelModal implements OnInit {
   @Input() audioFile: File;
   @Input() generatedFilename: string;
   @Input() isAudioAvailable: boolean;
   @Input() languageCode: string;

   uploadedFile: Blob;
   droppedFile: File;
   saveButtonText: string;
   saveInProgress: boolean;
   errorMessage: string;
   BUTTON_TEXT_SAVE: string = 'Save';
   BUTTON_TEXT_SAVING: string = 'Saving...';
   ERROR_MESSAGE_BAD_FILE_UPLOAD: string = (
     'There was an error uploading the audio file.');

   constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private contextService: ContextService,
    private ngbActiveModal: NgbActiveModal,
   ) {
     super(ngbActiveModal);
   }

   isAudioTranslationValid(): boolean {
     return (
       this.uploadedFile &&
       this.uploadedFile !== null &&
       this.uploadedFile.size !== null &&
       this.uploadedFile.size > 0);
   }

   updateUploadedFile(file: Blob): void {
     this.errorMessage = null;
     this.uploadedFile = file;
   }

   clearUploadedFile(): void {
     this.errorMessage = null;
     this.uploadedFile = null;
   }

   confirm(): void {
     if (this.isAudioTranslationValid()) {
       this.saveButtonText = this.BUTTON_TEXT_SAVING;
       this.saveInProgress = true;
       let explorationId = (
         this.contextService.getExplorationId());

       Promise.resolve(
         this.assetsBackendApiService.saveAudio(
           explorationId, this.generatedFilename, this.uploadedFile)
       ).then((response) => {
         this.ngbActiveModal.close({
           languageCode: this.languageCode,
           filename: this.generatedFilename,
           fileSizeBytes: this.uploadedFile.size,
           durationSecs: response.duration_secs
         });
       }, (errorResponse) => {
         this.errorMessage = (
           errorResponse.error || this.ERROR_MESSAGE_BAD_FILE_UPLOAD);
         this.uploadedFile = null;
         this.saveButtonText = this.BUTTON_TEXT_SAVE;
         this.saveInProgress = false;
       });
     }
   }

   ngOnInit(): void {
     // Whether there was an error uploading the audio file.
     this.saveButtonText = this.BUTTON_TEXT_SAVE;
     this.saveInProgress = false;
     this.droppedFile = this.audioFile;
   }
}

angular.module('oppia').directive('oppiaAddAudioTranslationModal',
   downgradeComponent({
     component: AddAudioTranslationModalComponent
   }) as angular.IDirectiveFactory);
