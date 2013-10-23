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
 * Insert this script at the bottom of your web page. It will take all the
 * <oppia> tags and render them as iframes to Oppia explorations.
 *
 * @author sll@google.com (Sean Lip)
 */

window.OPPIA_EMBED_GLOBALS = {
  version: '0.0.0'
};

/**
 * [THIS SPECIFICATION IS ONLY VALID FOR VERSION 0.0.0 OF THIS SCRIPT]
 *
 * Receives messages from embedded Oppia iframes. Each message has a title and
 * a payload. The structure of the payload depends on what the title is:
 *   - 'heightChange': The payload is an Object with a single key-value pair.
 *         The key is 'height', and the value is a positive integer.
 *   - 'explorationCompleted': The payload is an empty Object.
 */
window.addEventListener('message', function(evt) {
  // Allow only requests from oppiaserver or the server that this container is
  // running on.
  if (evt.origin == 'https://oppiaserver.appspot.com' ||
      evt.origin == window.location.protocol + '//' + window.location.host) {
    console.log(evt.data);
    switch(evt.data.title) {
      case 'heightChange':
        // TODO(sll): Validate that evt.data.payload is a dict with one field
        // whose key is 'height' and whose value is a positive integer.
        // TODO(sll): These should pass the iframe source, too (in case there are
        // multiple oppia iframes on a page).
        window.OPPIA_PLAYER.onHeightChange(evt.data.payload.height);
        break;
      case 'explorationCompleted':
        window.OPPIA_PLAYER.onExplorationCompleted();
        break;
      default:
        console.log('Error: event ' + evt.data.title + 'not recognized.');
    }
  }
}, false);

function reloadOppiaTags() {
  var oppiaList = document.getElementsByTagName('oppia');
  for (var i = 0; i < oppiaList.length; i++) {
    var oppiaNode = oppiaList[i];
  
    // TODO(sll): Add error handling here if required attrs are not
    // present. Show an error message in the iframe if anything 
    // fails to load.
    if (!oppiaNode.getAttribute('oppia-id')) {
      console.log('Error: oppia node has no id.');
      continue;
    }

    var iframe = document.createElement('iframe');
    iframe.setAttribute('id', oppiaNode.getAttribute('id'));
    var currLoc = window.location.protocol + '//' + window.location.host;
    iframe.setAttribute(
      'src',
      (oppiaNode.getAttribute('src') || currLoc) +
          '/learn/' + oppiaNode.getAttribute('oppia-id') + '?iframed=true' +
          '#' + OPPIA_EMBED_GLOBALS.version);
    iframe.setAttribute('seamless', 'seamless');
    iframe.setAttribute(
      'height', oppiaNode.getAttribute('height') || '700px');
    iframe.setAttribute('width', oppiaNode.getAttribute('width') || '100%');
    iframe.setAttribute('frameborder', 0);
    iframe.setAttribute('style', 'margin: 10px;');
    iframe.setAttribute('class', 'oppia-no-scroll');

    oppiaNode.parentNode.replaceChild(iframe, oppiaNode);
  }
}

window.onload = function() {
  reloadOppiaTags();
};

window.OPPIA_PLAYER = {};

/**
 * Called when the height of the embedded iframe is changed.
 * @param {int} newHeight The new height of the embedded iframe.
 */
window.OPPIA_PLAYER.onHeightChange = function(newHeight) {
  // FIXME: This function can be overwritten.
  console.log('onHeightChange event triggered.');
};

window.OPPIA_PLAYER.onExplorationCompleted = function() {
  // FIXME: This function can be overwritten.
  console.log('onExplorationCompleted event triggered.');
};
