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
 * @fileoverview Constants for question domain.
 */

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { QuestionDomainConstants } from
  'domain/question/question-domain.constants';

angular.module('oppia').constant(
  'EDITABLE_QUESTION_DATA_URL_TEMPLATE',
  QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE);
angular.module('oppia').constant(
  'QUESTION_CREATION_URL',
  QuestionDomainConstants.QUESTION_CREATION_URL);
angular.module('oppia').constant(
  'QUESTION_SKILL_LINK_URL_TEMPLATE',
  QuestionDomainConstants.QUESTION_SKILL_LINK_URL_TEMPLATE);

angular.module('oppia').constant(
  'PRETEST_QUESTIONS_URL_TEMPLATE',
  QuestionDomainConstants.PRETEST_QUESTIONS_URL_TEMPLATE);

angular.module('oppia').constant(
  'QUESTION_PLAYER_URL_TEMPLATE',
  QuestionDomainConstants.QUESTION_PLAYER_URL_TEMPLATE);

angular.module('oppia').constant(
  'QUESTIONS_LIST_URL_TEMPLATE',
  QuestionDomainConstants.QUESTIONS_LIST_URL_TEMPLATE);

angular.module('oppia').constant(
  'QUESTION_PROPERTY_LANGUAGE_CODE',
  QuestionDomainConstants.QUESTION_PROPERTY_LANGUAGE_CODE);
angular.module('oppia').constant(
  'QUESTION_PROPERTY_QUESTION_STATE_DATA',
  QuestionDomainConstants.QUESTION_PROPERTY_QUESTION_STATE_DATA);

angular.module('oppia').constant(
  'QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS',
  // eslint-disable-next-line max-len
  QuestionDomainConstants.QUESTION_PROPERTY_INAPPLICABLE_SKILL_MISCONCEPTION_IDS);

angular.module('oppia').constant(
  'QUESTION_PROPERTY_NEXT_CONTENT_ID_INDEX',
  QuestionDomainConstants.QUESTION_PROPERTY_NEXT_CONTENT_ID_INDEX);

angular.module('oppia').constant(
  'CMD_UPDATE_QUESTION_PROPERTY',
  QuestionDomainConstants.CMD_UPDATE_QUESTION_PROPERTY);
