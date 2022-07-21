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
 * @fileoverview Component for the learner group syllabus.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';

import './learner-group-syllabus.component.css';


@Component({
  selector: 'oppia-learner-group-syllabus',
  templateUrl: './learner-group-syllabus.component.html'
})
export class LearnerGroupSyllabusComponent {
  @Input() learnerGroup: LearnerGroupData;

  constructor() {}

  ngOnInit() {
    
  }
}

angular.module('oppia').directive(
  'oppiaLearnerGroupSyllabus',
  downgradeComponent({component: LearnerGroupSyllabusComponent}));
