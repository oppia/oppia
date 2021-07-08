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
 * @fileoverview Constants for interactions extensions.
 */

export const InteractionsExtensionsConstants = {
  GRAPH_INPUT_LEFT_MARGIN: 120,

  // Gives the staff-lines human readable values.
  NOTE_NAMES_TO_MIDI_VALUES: {
    A5: 81,
    G5: 79,
    F5: 77,
    E5: 76,
    D5: 74,
    C5: 72,
    B4: 71,
    A4: 69,
    G4: 67,
    F4: 65,
    E4: 64,
    D4: 62,
    C4: 60
  },

  // Minimum confidence required for a predicted answer group to be shown to
  // user. Generally a threshold of 0.7-0.8 is assumed to be a good one in
  // practice, however value need not be in those bounds.
  TEXT_INPUT_PREDICTION_SERVICE_THRESHOLD: 0.7,
} as const;
