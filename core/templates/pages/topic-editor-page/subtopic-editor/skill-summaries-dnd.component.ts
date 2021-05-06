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
 * @fileoverview Drag and drop component for the summary list in the subtopic
 * editor tab component.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'oppia-skill-summaries-dnd',
  templateUrl: './skill-summaries-dnd.component.html'
})

export class SkillSummariesDndComponent implements OnInit {
  constructor() { }
  @Input() subtopicEditorCtrl;
  ngOnInit(): void { }
}

angular.module('oppia').directive('oppiaSkillSummariesDnd', downgradeComponent({
  component: SkillSummariesDndComponent
}) as angular.IDirectiveFactory);
