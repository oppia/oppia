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

export class QuestionPlayerConstants {
  public static HASH_PARAM = 'question-player-result=';
  public static MAX_SCORE_PER_QUESTION = 1.0;

  public static MAX_MASTERY_GAIN_PER_QUESTION = 0.1;
  public static MAX_MASTERY_LOSS_PER_QUESTION = -0.1;

  public static COLORS_FOR_PASS_FAIL_MODE = {
    // color orange
    FAILED_COLOR: 'rgb(217, 92, 12)',
    // color shallow orange
    FAILED_COLOR_OUTER: 'rgb(244, 206, 186)',
    // color green
    PASSED_COLOR: 'rgb(0, 150, 136)',
    // color shallow green
    PASSED_COLOR_OUTER: 'rgb(143, 217, 209)'
  };

  public static QUESTION_PLAYER_MODE = {
    PASS_FAIL_MODE: 'PASS_FAIL'
  };

  public static VIEW_HINT_PENALTY = 0.1;

  public static VIEW_HINT_PENALTY_FOR_MASTERY = 0.02;

  public static WRONG_ANSWER_PENALTY_FOR_MASTERY = 0.05;

  public static WRONG_ANSWER_PENALTY = 0.1;
}
