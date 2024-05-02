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
 * Insert this script at the bottom of your web page. It will take all the
 * <oppia> tags and render them as iframes to Oppia explorations.
 *
 * @author sll@google.com (Sean Lip)
 */


(function() {
  var OPPIA_EMBED_GLOBALS = {
    version: '0.0.0'
  };

  /**
   * Logs a message in the console only if the embedding page is on localhost.
   * @param {string} The message to log.
   */
  function _log(message) {
    if (window.location.host.indexOf('localhost') !== -1) {
      console.log(message);
    }
  }

  var alphanumericChars = (
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  var SECRET_LENGTH = 64;

  // A random string used to verify messages sent from the iframed window.
  var secret = '';
  for (var i = 0; i < SECRET_LENGTH; i++) {
    secret += alphanumericChars.charAt(
      Math.floor(Math.random() * alphanumericChars.length));
  }

  /**
   * [THIS SPECIFICATION IS ONLY VALID FOR VERSION 0.0.0 OF THIS SCRIPT]
   *
   * Receives JSON-encoded messages from embedded Oppia iframes. Each message
   * has a title and a payload. The structure of the payload depends on what
   * the title is:
   *   - 'heightChange': The payload is an Object with the following fields:
   *         height: a positive integer, and
   *         scroll: boolean -- scroll down to bottom if true.
   *   - 'explorationLoaded': The payload is an empty Object.
   *   - 'stateTransition': The payload is an Object with three keys:
   *         'oldStateName', 'jsonAnswer' and 'newStateName'. All three of
   *         these have values of type String.
   *   - 'explorationReset': The payload is an Object with a single key-value
   *         pair. The key is 'stateName', and the value is of type String.
   *   - 'explorationCompleted': The payload is an empty Object.
   */
  window.addEventListener('message', function(evt) {
    try {
      var data = JSON.parse(evt.data);
    } catch(error) {
      return;
    }

    // Verify that the message comes from the created iframe.
    if (!data.secret || data.secret !== secret) {
      return;
    }

    _log(data);
    var iframeNode = document.getElementById(data.sourceTagId);

    switch(data.title) {
      case 'heightChange':
        window.OPPIA_PLAYER.onHeightChange(
          iframeNode, data.payload.height, data.payload.scroll);
        break;
      case 'explorationLoaded':
        window.OPPIA_PLAYER.onExplorationLoaded(iframeNode);
        break;
      case 'stateTransition':
        window.OPPIA_PLAYER.onStateTransition(
          iframeNode, data.payload.oldStateName, data.payload.jsonAnswer,
          data.payload.newStateName);
        break;
      case 'explorationReset':
        // This needs to be set in order to allow the scrollHeight of the
        // iframe content to be calculated accurately within the iframe's JS.
        iframeNode.style.height = 'auto';
        window.OPPIA_PLAYER.onExplorationReset(
          iframeNode, data.payload.stateName);
        break;
      case 'explorationCompleted':
        window.OPPIA_PLAYER.onExplorationCompleted(iframeNode);
        break;
      default:
        if (console) {
          console.log('Error: event ' + data.title + ' not recognized.');
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

  // Maps Oppia iframe ids to loading div ids.
  var oppiaNodeIdsToLoadingDivIds = {};

  /**
   * Transforms an <oppia/> tag into an iframe that embeds an Oppia exploration.
   * The following attributes on the tag are recognized:
   *   - oppia-id (mandatory): The id of the Oppia exploration to embed.
   *   - src: The server hosting the Oppia exploration. Defaults to the current
   *       server.
   *   - locale: The preferred locale. Defaults to 'en' (which is the only one
   *       that is currently implemented).
   *   - height: The non-changing height of the iframe (can be specified as
   *       standard CSS). If not set, defaults to an initial height of 700px
   *       and is allowed to change when the iframe content changes.
   *   - width: The non-changing width of the iframe (can be specified as
   *       standard CSS). If not set, defaults to an initial width of 700px and
   *       is allowed to change when the iframe content changes.
   *   - exploration-version: The version number of the exploration. Currently
   *       this field is ignored and the latest version is used. We expect to
   *       change this.
   *   - autoload: If true, loads the exploration automatically, otherwise
   *       prompts the user before loading the exploration.
   *
   * @param {DOMNode} oppiaNode The DOM node that corresponds to the <oppia/>
   *       tag.
   */
  function reloadOppiaTag(oppiaNode) {
    if (!oppiaNode.getAttribute('oppia-id')) {
      if (console) {
        console.log('Error: oppia node has no id.');
      }

      var div = document.createElement('div');

      var strongTag = document.createElement('strong');
      strongTag.textContent = 'Warning: ';
      div.appendChild(strongTag);

      var spanTag = document.createElement('span');
      spanTag.textContent = (
          'This Oppia exploration could not be loaded because no ' +
          'oppia-id attribute was specified in the HTML tag.');
      div.appendChild(spanTag);

      var divStyles = [
        'background-color: #eee',
        'border-radius: 5px',
        'font-size: 1.2em',
        'margin: 10px',
        'padding: 10px',
        'width: 70%'
      ];
      div.setAttribute('style', divStyles.join('; ') + ';');
      oppiaNode.parentNode.replaceChild(div, oppiaNode);
      return;
    }

    var autoload = oppiaNode.getAttribute('autoload') || true;
    if (autoload && autoload === 'false') {
      // Do not load the exploration automatically.
      var button = document.createElement('button');
      button.textContent = 'Load Oppia Exploration';
      button.setAttribute('onclick', 'reloadParentOppiaTag(this)');
      var buttonStyles = [
        'background-color: green',
        'border-radius: 5px',
        'color: white',
        'font-size: 1.2em',
        'height: 50px',
        'margin: 10px',
        'padding: 10px',
        'width: 50%'
      ];
      button.setAttribute('style', buttonStyles.join('; ') + ';');
      oppiaNode.appendChild(button);

      // Set autoload to true so that the frame actually does load the next time
      // reloadOppiaTag() is called on this node.
      oppiaNode.setAttribute('autoload', 'true');
      return;
    }

    var iframe = document.createElement('iframe');

    var currLoc = window.location.protocol + '//' + window.location.host;
    var locale = oppiaNode.getAttribute('locale') || 'en';
    var height = oppiaNode.getAttribute('height');
    var width = oppiaNode.getAttribute('width');
    var fixedHeight = 'false';
    var fixedWidth = 'false';
    var explorationVersion = oppiaNode.getAttribute('exploration-version') || '';

    var tagId = oppiaNode.getAttribute('id') || generateNewRandomId();

    if (!height || height == 'auto') {
      // The default height is 700px.
      height = '700px';
    } else {
      fixedHeight = 'true';
    }

    if (!width || width == 'auto') {
      // The default width is 98%. This leaves room for the vert scrollbar
      // (otherwise we get a horiz scrollbar when there's a vert scrollbar).
      width = '98%';
    } else {
      fixedWidth = 'true';
    }

    var TAG_ID_KEY = 'tagid=';
    var VERSION_KEY = 'version=';
    var SECRET_KEY = 'secret=';

    iframe.setAttribute('id', tagId);
    var versionString = explorationVersion ? '&v=' + explorationVersion : '';
    iframe.setAttribute('src', encodeURI(
      (oppiaNode.getAttribute('src') || currLoc) +
      '/explore/' + oppiaNode.getAttribute('oppia-id') +
      '?iframed=true&locale=en' + versionString +
      '#' + TAG_ID_KEY + tagId +
      '&' + VERSION_KEY + OPPIA_EMBED_GLOBALS.version +
      '&' + SECRET_KEY + secret));
    iframe.setAttribute('seamless', 'seamless');
    iframe.setAttribute('height', height);
    iframe.setAttribute('width', width);
    iframe.setAttribute('fixedheight', fixedHeight);
    iframe.setAttribute('fixedwidth', fixedWidth);
    iframe.setAttribute('frameborder', 0);
    iframe.setAttribute('style', 'margin: 10px;');

    // Hide the iframe first so that autofocus will not scroll the page.
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.visibility = 'hidden';

    oppiaNode.parentNode.replaceChild(iframe, oppiaNode);

    // Create a div with a loading message.
    var loadingDivId = tagId + '-loading';

    var loadingDiv = document.createElement('div');
    loadingDiv.setAttribute('id', loadingDivId);
    var loadingMessageContainer = document.createElement('center');
    var loadingMessageSpan = document.createElement('span');
    loadingMessageSpan.style.fontSize = 'larger';
    loadingMessageSpan.textContent = 'Loading...';

    iframe.parentNode.appendChild(loadingDiv);
    loadingDiv.appendChild(loadingMessageContainer);
    loadingDiv.appendChild(document.createElement('br'));
    loadingDiv.appendChild(document.createElement('br'));
    loadingMessageContainer.appendChild(loadingMessageSpan);

    oppiaNodeIdsToLoadingDivIds[tagId] = loadingDivId;
  }

  function reloadParentOppiaTag(buttonNode) {
    reloadOppiaTag(buttonNode.parentNode);
  }

  window.onload = function() {
    // Note that document.getElementsByTagName() is a live view of the DOM and
    // will change in response to DOM multations.
    while (document.getElementsByTagName('oppia').length > 0) {
      reloadOppiaTag(document.getElementsByTagName('oppia')[0]);
    }
  };

  window.OPPIA_PLAYER = {
    /**
     * Called when the height of the embedded iframe is changed.
     * @param {object} iframeNode The iframe node that is the source of the
     *     postMessage call.
     * @param {int} newHeight The new height of the embedded iframe.
     * @param {boolean} doScroll Scroll down to show the bottom of iframe after
     *     changing the height.
     */
    onHeightChange: function(iframeNode, newHeight, doScroll) {
      _log('onHeightChange event triggered on ' + iframeNode + ' for ' + newHeight);

      // This is set to 'auto' when the exploration is reset. If this is not
      // removed, the iframe height will not change even if iframeNode.height
      // is set.
      iframeNode.style.height = '';

      if (iframeNode.getAttribute('fixedheight') === 'false') {
        iframeNode.height = newHeight + 'px';
      }
      if (doScroll) {
        iframeNode.scrollIntoView(false);
      }

      window.OPPIA_PLAYER.onHeightChangePostHook(iframeNode, newHeight);
    },
    onExplorationLoaded: function(iframeNode) {
      // Remove the loading-message div.
      var nodeId = iframeNode.getAttribute('id');
      var nodeToRemove = document.getElementById(
        oppiaNodeIdsToLoadingDivIds[nodeId]);
      if (nodeToRemove) {
        nodeToRemove.parentNode.removeChild(nodeToRemove);
      }

      setTimeout(function() {
        // Show the oppia contents after making sure the rendering happened.
        iframeNode.style.position = 'inherit';
        iframeNode.style.visibility = 'inherit';
        iframeNode.style.top = 'inherit';
      }, 0);
      window.OPPIA_PLAYER.onExplorationLoadedPostHook(iframeNode);
    },
    onStateTransition: function(iframeNode, oldStateName, jsonAnswer, newStateName) {
      window.OPPIA_PLAYER.onStateTransitionPostHook(
        iframeNode, oldStateName, jsonAnswer, newStateName);
    },
    onExplorationReset: function(iframeNode, stateName) {
      window.OPPIA_PLAYER.onExplorationResetPostHook(iframeNode, stateName);
    },
    onExplorationCompleted: function(iframeNode) {
      window.OPPIA_PLAYER.onExplorationCompletedPostHook(iframeNode);
    }
  };
}(window, document));



/**
 * Called after the height of the embedded iframe is changed and the iframe has
 * been appropriately resized.
 * @param {object} iframeNode The iframe node that is the source of the
 *     postMessage call.
 * @param {int} newHeight The new height of the embedded iframe.
 */
window.OPPIA_PLAYER.onHeightChangePostHook = function(iframeNode, newHeight) {
  // FIXME: This function can be overwritten.
  if (console && window.location.host.indexOf('localhost') !== -1) {
    console.log(
      'onHeightChangePostHook event triggered on ' + iframeNode + '.');
    console.log(newHeight);
  }
};

/**
 * Called when the exploration is loaded.
 * @param {object} iframeNode The iframe node that is the source of the
 *     postMessage call.
 */
window.OPPIA_PLAYER.onExplorationLoadedPostHook = function(iframeNode) {
  // FIXME: This function can be overwritten.
  if (console && window.location.host.indexOf('localhost') !== -1) {
    console.log('onExplorationLoaded event triggered on ' + iframeNode + '.');
  }
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
  // FIXME: This function can be overwritten.
  if (console && window.location.host.indexOf('localhost') !== -1) {
    console.log('onStateTransition event triggered on ' + iframeNode + '.');
    console.log(oldStateName);
    console.log(jsonAnswer);
    console.log(newStateName);
  }
};

/**
 * Called when the exploration is reset.
 * @param {object} iframeNode The iframe node that is the source of the
 *     postMessage call.
 * @param {string} stateName The reader's current state, before the reset.
 */
window.OPPIA_PLAYER.onExplorationResetPostHook = function(iframeNode, stateName) {
  // FIXME: This function can be overwritten.
  if (console && window.location.host.indexOf('localhost') !== -1) {
    console.log('onExplorationReset event triggered on ' + iframeNode + '.');
    console.log(stateName);
  }
};

/**
 * Called when the exploration is completed.
 * @param {object} iframeNode The iframe node that is the source of the
 *     postMessage call.
 */
window.OPPIA_PLAYER.onExplorationCompletedPostHook = function(iframeNode) {
  // FIXME: This function can be overwritten.
  if (console && window.location.host.indexOf('localhost') !== -1) {
    console.log(
      'onExplorationCompleted event triggered on ' + iframeNode + '.');
  }
};
