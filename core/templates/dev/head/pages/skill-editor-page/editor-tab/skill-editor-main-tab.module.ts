// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the main tab of the skill editor.
 */

import { NgModule } from '@angular/core';

/* eslint-disable max-len */
import { SkillConceptCardEditorModule } from
  'pages/skill-editor-page/editor-tab/skill-concept-card-editor/skill-concept-card-editor.module.ts'
import { SkillDescriptionEditorModule } from
  'pages/skill-editor-page/editor-tab/skill-description-editor/skill-description-editor.module.ts'
import { SkillMisconceptionsEditorModule } from
  'pages/skill-editor-page/editor-tab/skill-misconceptions-editor/skill-misconceptions-editor.module.ts';
/* eslint-enable max-len */

@NgModule({
  imports: [
    SkillConceptCardEditorModule,
    SkillDescriptionEditorModule,
    SkillMisconceptionsEditorModule
  ]
})
export class SkillEditorMainTabModule {}

require(
  'pages/skill-editor-page/editor-tab/skill-concept-card-editor/' +
  'skill-concept-card-editor.module.ts');
require(
  'pages/skill-editor-page/editor-tab/skill-description-editor/' +
  'skill-description-editor.module.ts');
require(
  'pages/skill-editor-page/editor-tab/skill-misconceptions-editor/' +
  'skill-misconceptions-editor.module.ts');

angular.module('skillEditorMainTabModule', [
  'skillConceptCardEditorModule',
  'skillDescriptionEditorModule',
  'skillMisconceptionsEditorModule'
]);
