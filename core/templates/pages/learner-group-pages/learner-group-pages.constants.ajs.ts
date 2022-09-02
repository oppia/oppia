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
 * @fileoverview Constants for the Learner group pages.
 */

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { LearnerGroupPagesConstants } from './learner-group-pages.constants';

angular.module('oppia').constant(
  'LEARNER_GROUP_CREATION_SECTION_I18N_IDS',
  LearnerGroupPagesConstants.LEARNER_GROUP_CREATION_SECTION_I18N_IDS);

angular.module('oppia').constant(
  'CREATE_LEARNER_GROUP_PAGE_URL',
  LearnerGroupPagesConstants.CREATE_LEARNER_GROUP_PAGE_URL);

angular.module('oppia').constant(
  'EDIT_LEARNER_GROUP_PAGE_URL',
  LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_PAGE_URL);

angular.module('oppia').constant(
  'EDIT_LEARNER_GROUP_TABS',
  LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_TABS);

angular.module('oppia').constant(
  'EDIT_LEARNER_GROUP_PREFERENCES_SECTIONS',
  LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_PREFERENCES_SECTIONS);

angular.module('oppia').constant(
  'EDIT_LEARNER_GROUP_OVERVIEW_SECTIONS',
  LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_OVERVIEW_SECTIONS);
