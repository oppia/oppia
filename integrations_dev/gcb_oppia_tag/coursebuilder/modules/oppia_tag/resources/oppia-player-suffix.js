// Copyright 2013 Google Inc. All Rights Reserved.
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
 * Custom suffix script for integrating Oppia with Course Builder.
 */

/**
 * Called when the exploration is loaded.
 * @param {object} iframeNode The iframe node that is the source of the
 *     postMessage call.
 */
window.OPPIA_PLAYER.onExplorationLoadedPostHook = function(iframeNode) {
  window.gcbTagEventAudit({
    'instanceid': iframeNode.parentNode.getAttribute('gcb-instance-id'),
    'oppia-src': iframeNode.getAttribute('src')
  }, 'oppia-exploration-loaded');
};

/**
 * Called when a new state is encountered.
 * @param {object} iframeNode The iframe node that is the source of the
 *     postMessage call.
 * @param {string} oldStateName The name of the previous state.
 * @param {string} jsonAnswer A JSON representation of the reader's answer.
 * @param {string} newStateName The name of the destination state.
 */
window.OPPIA_PLAYER.onStateTransitionPostHook = function(
    iframeNode, oldStateName, jsonAnswer, newStateName) {
  window.gcbTagEventAudit({
    'instanceid': iframeNode.parentNode.getAttribute('gcb-instance-id'),
    'oppia-src': iframeNode.getAttribute('src'),
    'old-state-name': oldStateName,
    'json-answer': jsonAnswer,
    'new-state-name': newStateName
  }, 'oppia-state-transition');
};

/**
 * Called when the exploration is reset.
 * @param {object} iframeNode The iframe node that is the source of the
 *     postMessage call.
 * @param {string} stateName The reader's current state, before the reset.
 */
window.OPPIA_PLAYER.onExplorationResetPostHook = function(iframeNode, stateName) {
  window.gcbTagEventAudit({
    'instanceid': iframeNode.parentNode.getAttribute('gcb-instance-id'),
    'oppia-src': iframeNode.getAttribute('src'),
    'state-name': stateName
  }, 'oppia-exploration-reset');
};

/**
 * Called when the exploration is completed.
 * @param {object} iframeNode The iframe node that is the source of the
 *     postMessage call.
 */
window.OPPIA_PLAYER.onExplorationCompletedPostHook = function(iframeNode) {
  window.gcbTagEventAudit({
    'instanceid': iframeNode.parentNode.getAttribute('gcb-instance-id'),
    'oppia-src': iframeNode.getAttribute('src')
  }, 'oppia-exploration-completed');
};
