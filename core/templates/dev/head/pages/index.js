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
 * @author sll@google.com (Sean Lip)
 */

window.addEventListener('message', function(evt) {
  if (evt.origin == 'https://oppiaserver.appspot.com' ||
      evt.origin == window.location.protocol + '//' + window.location.host) {
    if (event.data.hasOwnProperty('explorationHeight')) {
      console.log('Received iframe height from embedded oppia exploration: ' + event.data.explorationHeight);

      // Change the height of the included iframe.
      var iframe = document.getElementById('demoExploration');
      iframe.height = parseInt(event.data.explorationHeight, 10) + 'px';

      var targetFrame = $('#demoExploration')[0];
      targetFrame.contentWindow.postMessage('heightAdjustedExternally', '*');

      setTimeout(function () {
        $('#buttons').show();
      }, 2000);
    }
  }
}, false);

var currSource = window.location.protocol + '//' + window.location.host;
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
  iframe.setAttribute(
    'src',
    (oppiaNode.getAttribute('src') || currSource) +
        '/learn/' + oppiaNode.getAttribute('oppia-id') + '?iframed=true');
  iframe.setAttribute('seamless', 'seamless');
  iframe.setAttribute(
    'height', oppiaNode.getAttribute('height') || '700px');
  iframe.setAttribute('width', oppiaNode.getAttribute('width') || '100%');
  iframe.setAttribute('frameborder', 0);
  iframe.setAttribute('style', 'margin: 10px;');
  iframe.setAttribute('class', 'oppia-no-scroll');

  oppiaNode.parentNode.replaceChild(iframe, oppiaNode);
}
