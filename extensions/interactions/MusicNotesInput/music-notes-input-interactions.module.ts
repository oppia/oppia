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
 * @fileoverview Module for the music notes input interaction.
 */

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { MaterialModule } from 'modules/material.module';
import { MusicNotesInput } from './directives/oppia-interactive-music-notes-input.component';
import { TranslateModule } from '@ngx-translate/core';
import { SharedPipesModule } from 'filters/shared-pipes.module';
import { ResponseMusicNotesInput } from './directives/oppia-response-music-notes-input.component';
import { ShortResponseMusicNotesInput } from './directives/oppia-short-response-music-notes-input.component';

@NgModule({
  imports: [
    SharedPipesModule,
    BrowserModule,
    MaterialModule,
    TranslateModule
  ],
  declarations: [
    MusicNotesInput,
    ResponseMusicNotesInput,
    ShortResponseMusicNotesInput
  ],
  entryComponents: [
    MusicNotesInput,
    ResponseMusicNotesInput,
    ShortResponseMusicNotesInput
  ],
  exports: [
    MusicNotesInput,
    ResponseMusicNotesInput,
    ShortResponseMusicNotesInput
  ],
})

export class MusicNotesInputModule {}
