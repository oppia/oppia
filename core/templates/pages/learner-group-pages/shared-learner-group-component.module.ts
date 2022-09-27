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
 * @fileoverview Module for the shared learner group components.
 */

import { NgModule } from '@angular/core';
import { BrowserModule } from
  '@angular/platform-browser';
import { SharedComponentsModule } from 'components/shared-component.module';


import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { AddSyllabusItemsComponent } from './create-group/add-syllabus-items.component';
import { InviteLearnersComponent } from './create-group/invite-learners.component';
import { LearnerGroupDetailsComponent } from './create-group/learner-group-details.component';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    SharedComponentsModule
  ],
  declarations: [
    LearnerGroupDetailsComponent,
    AddSyllabusItemsComponent,
    InviteLearnersComponent
  ],
  entryComponents: [
    LearnerGroupDetailsComponent,
    AddSyllabusItemsComponent,
    InviteLearnersComponent
  ],
  exports: [
    LearnerGroupDetailsComponent,
    AddSyllabusItemsComponent,
    InviteLearnersComponent
  ]
})
export class SharedLearnerGroupComponentsModule {}
