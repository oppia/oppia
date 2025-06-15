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

/**
 * @fileoverview Component that enables the user to upload audio files.
 */

import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {AppConstants} from 'app.constants';

@Component({
  selector: 'oppia-audio-file-uploader',
  templateUrl: './audio-file-uploader.component.html',
})
export class AudioFileUploaderComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() droppedFile!: FileList;
  @Output() fileChange: EventEmitter<File> = new EventEmitter<File>();
  @Output() fileClear: EventEmitter<void> = new EventEmitter<void>();
  // The following properties are used in function 'addAudio' which cannot
  // be called until the input form and file input views are initialized.
  @ViewChild('fileInput') fileInputRef!: ElementRef;
  @ViewChild('inputForm') inputFormRef!: ElementRef;
  ALLOWED_AUDIO_FILE_TYPES = ['audio/mp3', 'audio/mpeg'];
  // 'null' implies not displaying an error message.
  errorMessage: string | null = null;
  licenseUrl = AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LICENSE.ROUTE;

  // Returns 'null' when the uploaded file is valid.
  validateUploadedFile(file: File): string | null {
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
    let file = this.fileInputRef.nativeElement.files[0];
    if (!file) {
      this.fileClear.emit();
      return;
    }
    this.errorMessage = this.validateUploadedFile(file);
    if (!this.errorMessage) {
      // Only fire this event if validations pass.
      this.fileChange.emit(file);
    } else {
      this.inputFormRef.nativeElement.reset();
      this.fileClear.emit();
    }
  }
}
