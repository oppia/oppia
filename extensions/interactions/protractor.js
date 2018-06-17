// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Clearing-house for protractor test utilities for interactions.
 */

/* Each interaction's protractor file must implement the following:
 * customizeInteraction: a function that receives an element containing the
 *   interaction editor followed by some number of arguments used to customize
 *   the interaction in question (e.g options for the MultipleChoiceInput).
 * expectInteractionDetailsToMatch: a function that receives arguments
 *   describing the way the interaction is expected to look, and is run in the
 *   player to verify the interaction actually looks this way.
 * submitAnswer: a function that is sent a single 'answer' argument and should
 *   then use it to answer the interaction in this way, for example by
 *   selecting an option in MultipleChoiceInput.
 * answerObjectType: the name of the type of object returned by the interaction.
 * testSuite: an array of dictionaries each containing:
 * - interactionArguments: an array of arguments that will be splatted and sent
 *   (together with the editor element) to the interaction's
 *   customizeInteraction() function.
 * - ruleArguments: an array of arguments, the first of which should be the
 *   name of the rule to be used and the rest parameters for that rule.
 * - expectedInteractionDetails: an array of arguments that will be splatted and
 *   sent to expectInteractionDetailsToMatch when the interaction is being run
 *   in the player.
 * - wrongAnswers: an array of arguments that will be submitted in sequence via
 *   the interaction's submitAnswer() function; it will be verified that all
 *   these answers fail to satisfy the given rule.
 * - correctAnswers: likewise, but these should satisfy the rule.
 */

var INTERACTIONS = {
  Continue: require('./Continue/protractor.js'),
  FractionInput: require('./FractionInput/protractor.js'),
  MultipleChoiceInput: require('./MultipleChoiceInput/protractor.js'),
  NumericInput: require('./NumericInput/protractor.js'),
  NumberWithUnits: require('./NumberWithUnits/protractor.js'),
  TextInput: require('./TextInput/protractor.js'),
  LogicProof: require('./LogicProof/protractor.js')
};

var getInteraction = function(interactionName) {
  if (INTERACTIONS.hasOwnProperty(interactionName)) {
    return INTERACTIONS[interactionName];
  } else {
    throw Error('Unknown interaction: ' + interactionName);
  }
};

exports.INTERACTIONS = INTERACTIONS;
exports.getInteraction = getInteraction;
