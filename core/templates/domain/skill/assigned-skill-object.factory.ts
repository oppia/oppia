// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Frontend domain object factory for assigned skill.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export interface AssignedSkillBackendDict {
  'topic_id': string;
  'topic_name': string;
  'topic_version': number;
  'subtopic_id': number;
}

export class AssignedSkill {
  constructor(
    public topicId: string,
    public topicName: string,
    public topicVersion: number,
    public subtopicId: number) {}
}

@Injectable({
  providedIn: 'root'
})
export class AssignedSkillObjectFactory {
  createFromBackendDict(
      backendDict: AssignedSkillBackendDict): AssignedSkill {
    return new AssignedSkill(
      backendDict.topic_id,
      backendDict.topic_name,
      backendDict.topic_version,
      backendDict.subtopic_id);
  }
}

angular.module('oppia').factory(
  'AssignedSkillObjectFactory',
  downgradeInjectable(AssignedSkillObjectFactory));
