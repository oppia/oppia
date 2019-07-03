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
 * @fileoverview Primary controller for the skill editor page.
 */

import { NgModule } from '@angular/core';

import { QuestionsTabModule } from
  'pages/skill-editor-page/questions-tab/questions-tab.module.ts';
import { SkillEditorMainTabModule } from
  'pages/skill-editor-page/editor-tab/skill-editor-main-tab.module.ts';
import { SkillEditorNavbarModule } from
  'pages/skill-editor-page/navbar/skill-editor-navbar.module.ts';

@NgModule({
  imports: [
    QuestionsTabModule,
    SkillEditorMainTabModule,
    SkillEditorNavbarModule
  ]
})
export class SkillEditorPageModule {}

require('pages/skill-editor-page/editor-tab/skill-editor-main-tab.module.ts');
require('pages/skill-editor-page/questions-tab/questions-tab.module.ts');
require('pages/skill-editor-page/navbar/skill-editor-navbar.module.ts');

angular.module('skillEditorPageModule', [
  'questionsTabModule',
  'skillEditorMainTabModule',
  'skillEditorNavbarModule'
]);
