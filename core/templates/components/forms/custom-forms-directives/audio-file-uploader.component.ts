// Copyright 2021 The Oppia Authors. All Rights Reserved.
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

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { IdGenerationService } from 'services/id-generation.service';

/**
 * @fileoverview Directive that enables the user to upload audio files.
 */

@Component({
  selector: 'audio-file-uploader',
  templateUrl: './audio-file-uploader.component.html',
  styleUrls: []
})
export class AudioFileUploaderComponent implements OnInit {
  @Input() droppedFile?: FileList;
  @Output() onFileChanged: EventEmitter<File> = new EventEmitter<File>();
  @Output() onFileCleared: EventEmitter<void> = new EventEmitter<void>();
  ALLOWED_AUDIO_FILE_TYPES = ['audio/mp3', 'audio/mpeg'];
  inputFieldClassName?: string;
  inputFieldFormId?: string;
  errorMessage?: string;

  constructor(
    private idGenerationService: IdGenerationService
  ) { }

  ngOnInit(): void {
    // We generate a random class name to distinguish this input from
    // others in the DOM.
    this.inputFieldClassName = (
      'audio-file-uploader-input' + this.idGenerationService.generateNewId());
    this.inputFieldFormId = (
      'audio-file-uploader-form' + this.idGenerationService.generateNewId());
  }

  validateUploadedFile(file: File): string {
    if (!file) {
      return 'No audio file was uploaded.';
    }

    if (!file.size || !file.type.match('audio.*')) {
      return 'This file is not recognized as an audio file.';
    }

    if (this.ALLOWED_AUDIO_FILE_TYPES.indexOf(file.type) === -1) {
      return 'Only the MP3 audio format is currently supported.';
    }

    if (!file.name) {
      return 'Filename must not be empty.';
    }

    if (!file.name.match(/\.mp3$/)) {
      return 'This audio format does not match the filename extension.';
    }

    return null;
  }

  addAudio(evt: Event): void {
    var file = (<HTMLInputElement>evt.currentTarget).files[0];
    if (!file) {
      this.onFileCleared.emit();
      return;
    }

    this.errorMessage = this.validateUploadedFile(file);
    if (!this.errorMessage) {
      // Only fire this event if validations pass.
      this.onFileChanged.emit(file);
    } else {
      (<HTMLFormElement>document.getElementById(
        this.inputFieldFormId)).val('');
      this.onFileCleared.emit();
    }
  }
}

angular.module('oppia').directive(
  'audioFileUploader',
  downgradeComponent(
    { component: AudioFileUploaderComponent,
      inputs: ['droppedFile'], outputs: ['onFileChanged', 'onFileCleared'] })
);
