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
 * @fileoverview Component for the navbar breadcrumb of the skill editor.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';

@Component({
  selector: 'oppia-skill-editor-navbar-breadcrumb',
  templateUrl: './skill-editor-navbar-breadcrumb.component.html',
  styleUrls: []
})
export class SkillEditorNavbarBreadcrumbComponent {
  constructor(
    private skillEditorStateService: SkillEditorStateService) {}

  getTruncatedDescription(): string {
    const skill = this.skillEditorStateService.getSkill();
    let truncatedDescription = skill.getDescription().substr(0, 35);
    if (skill.getDescription().length > 35) {
      truncatedDescription += '...';
    }
    return truncatedDescription;
  }
}

angular.module('oppia').directive(
  'oppiaSkillEditorNavbarBreadcrumb', downgradeComponent(
    {component: SkillEditorNavbarBreadcrumbComponent}));
