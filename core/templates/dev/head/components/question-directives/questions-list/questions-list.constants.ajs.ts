// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Constants for the question player directive.
 */

import { QuestionsListConstants } from
  'components/question-directives/questions-list/questions-list.constants';

angular.module('oppia').constant(
  'DEFAULT_SKILL_DIFFICULTY', QuestionsListConstants.DEFAULT_SKILL_DIFFICULTY);
angular.module('oppia').constant(
  'MODE_SELECT_DIFFICULTY', QuestionsListConstants.MODE_SELECT_DIFFICULTY);
angular.module('oppia').constant(
  'MODE_SELECT_SKILL', QuestionsListConstants.MODE_SELECT_SKILL);
