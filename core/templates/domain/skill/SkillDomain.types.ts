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
 * @fileoverview Contains types for objects in the Skill Domain
 */

// TODO(#7165): Replace any with exact type.
export interface EditableSkillResponseConfig {
    skill?: any;
    skills?: any;
    // eslint-disable-next-line camelcase
    grouped_skill_summaries?: any;
}

export interface ChangeList {
  cmd?: string;
  // eslint-disable-next-line camelcase
  property_name?: string;
  // eslint-disable-next-line camelcase
  old_value?: string;
  // eslint-disable-next-line camelcase
  new_value?: string;
}

export interface UpdateSkillPayload {
  version?: number,
  // eslint-disable-next-line camelcase
  commit_message?: string,
  // eslint-disable-next-line camelcase
  change_dicts?: Array<ChangeList>;
}
