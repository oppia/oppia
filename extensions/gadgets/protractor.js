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
 * @fileoverview Clearing-house for protractor test utilities for gadgets.
 *
 * @author Michael Anuzis (anuzis@gmail.com)
 */

/* Each gadgets's protractor file must implement the following:
 * customizeGadget: a function that receives an element containing the
 *   gadget editor followed by some number of arguments used to customize the
 *   gadget in question (e.g options for the ScoreBar).
 * expectGadgetDetailsToMatch: a function that receives arguments
 *   describing the way the gadget is expected to look, and is run in the
 *   player to verify the gadget actually looks this way.
 */

var GADGETS = {
  AdviceBar: require('./AdviceBar/protractor.js'),
  ScoreBar: require('./ScoreBar/protractor.js'),
};

var getGadget = function(gadgetType) {
  if (GADGETS.hasOwnProperty(gadgetType)) {
    return GADGETS[gadgetType];
  } else {
    throw Error('Unknown gadget: ' + gadgetType);
  }
};

exports.GADGETS = GADGETS;
exports.getGadget = getGadget;
