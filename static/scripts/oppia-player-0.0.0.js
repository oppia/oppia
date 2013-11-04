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
    var iframeNode = document.getElementById(evt.data.sourceTagId);

    switch(evt.data.title) {
      case 'heightChange':
        // TODO(sll): Validate that evt.data.payload is a dict with one field
        // whose key is 'height' and whose value is a positive integer.
        // TODO(sll): These should pass the iframe source, too (in case there are
        // multiple oppia iframes on a page).
        window.OPPIA_PLAYER.onHeightChange(iframeNode, evt.data.payload.height);
        break;
      case 'explorationCompleted':
        window.OPPIA_PLAYER.onExplorationCompleted(iframeNode);
        break;
      default:
        console.log('Error: event ' + evt.data.title + 'not recognized.');
    }
  }
}, false);

function generateNewRandomId() {
  while (true) {
    var ID_LENGTH = 12;
    var generatedId = '';
    for (var i = 0; i < ID_LENGTH; i++) {
      generatedId += String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }
    if (!document.getElementById(generatedId)) {
      return generatedId;
    }
  }
}

function getOppiaTagList() {
  return document.getElementsByTagName('oppia');
}

/**
 * Transforms an <oppia/> tag into an iframe that embeds an Oppia exploration.
 * @param {object} oppiaNode The DOM node that corresponds to the <oppia/> tag.
 */
function reloadOppiaTag(oppiaNode) {
  // TODO(sll): Add error handling here if required attrs are not
  // present. Show an error message in the iframe if anything 
  // fails to load.
  if (!oppiaNode.getAttribute('oppia-id')) {
    console.log('Error: oppia node has no id.');
    return;
  }

  var iframe = document.createElement('iframe');

  var currLoc = window.location.protocol + '//' + window.location.host;
  var language = oppiaNode.getAttribute('language') || 'en';
  var height = oppiaNode.getAttribute('height');
  var width = oppiaNode.getAttribute('width');
  var fixedHeight = 'false';
  var fixedWidth = 'false';
  var tagId = oppiaNode.getAttribute('id') || generateNewRandomId();

  if (!height || height == 'auto') {
    // The default height is 700px.
    height = '700px';
  } else {
    fixedHeight = 'true';
  }

  if (!width || width == 'auto') {
    // The default width is 100%.
    width = '100%';
  } else {
    fixedWidth = 'true';
  }

  // TODO(sll): Properly handle the case where ids are manually set, but are
  // not unique.
  iframe.setAttribute('id', tagId);
  iframe.setAttribute(
    'src',
    (oppiaNode.getAttribute('src') || currLoc) +
        '/learn/' + oppiaNode.getAttribute('oppia-id') +
        '?iframed=true&language=en' +
        '#' + tagId + '&' + OPPIA_EMBED_GLOBALS.version);
  iframe.setAttribute('seamless', 'seamless');
  iframe.setAttribute('height', height);
  iframe.setAttribute('width', width);
  iframe.setAttribute('fixedheight', fixedHeight);
  iframe.setAttribute('fixedwidth', fixedWidth);
  iframe.setAttribute('frameborder', 0);
  iframe.setAttribute('style', 'margin: 10px;');
  iframe.setAttribute('class', 'oppia-no-scroll');

  oppiaNode.parentNode.replaceChild(iframe, oppiaNode);
}

window.onload = function() {
  var oppiaTagList = getOppiaTagList();
  for (var i = 0; i < oppiaTagList.length; i++) {
    reloadOppiaTag(oppiaTagList[i]);
  }
};

window.OPPIA_PLAYER = {
  /**
   * Called when the height of the embedded iframe is changed.
   * @param {object} iframeNode The iframe node that is the source of the
   *     postMessage call.
   * @param {int} newHeight The new height of the embedded iframe.
   */
  onHeightChange: function(iframeNode, newHeight) {
    console.log('onHeightChange event triggered on ' + iframeNode + '.');

    if (iframeNode.fixedHeight === 'false') {
      iframeNode.height = parseInt(newHeight, 10) + 'px';
    }

    window.OPPIA_PLAYER.onHeightChangePostHook(iframeNode, newHeight);
  }
};

/**
 * Called after the height of the embedded iframe is changed and the iframe has
 * been appropriately resized.
 * @param {object} iframeNode The iframe node that is the source of the
 *     postMessage call.
 * @param {int} newHeight The new height of the embedded iframe.
 */
window.OPPIA_PLAYER.onHeightChangePostHook = function(iframeNode, newHeight) {
  // FIXME: This function can be overwritten.
  console.log('onHeightChangePostHook event triggered on ' + iframeNode + '.');
};

/**
 * Called when the exploration is completed.
 * @param {object} iframeNode The iframe node that is the source of the
 *     postMessage call.
 */
window.OPPIA_PLAYER.onExplorationCompleted = function(iframeNode) {
  // FIXME: This function can be overwritten.
  console.log('onExplorationCompleted event triggered on ' + iframeNode + '.');
};
