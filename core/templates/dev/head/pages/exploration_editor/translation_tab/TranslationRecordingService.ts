// Copyright 2019 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Service for handling microphone data and mp3 audio processing.
 */

oppia.factory('TranslationRecordingService', ['$q', '$window',
  function($q, $window) {
    var AudioContext = null,
      defer = null,
      definedAudioContext = null, // will be defined audio context
      isAvailable = null,
      isRecording = false,
      microphone = null,
      microphoneStream = null,
      mp3Worker = null,
      processor = null;


    var _initWorker = function() {
      if (!$window.Worker) {
        console.warn('Worker API not supported in this browser.');
        return;
      }
      if (mp3Worker === null) {
        var url = '/templates/dev/head/pages/exploration_editor/' +
          'translation_tab/mp3Converter.js';
        mp3Worker = new Worker(url);
        mp3Worker.onmessage = function(e) {
          switch (e.data.cmd) {
            case 'end':
              // async data flow
              defer.resolve(e.data.buf);
              break;
            default :
              console.warn('Unexpected command and data type from worker.');
              // console.warn(e);
          }
        };
        mp3Worker.postMessage({cmd: 'init'});
      }
    };

    var _postMessage = function(buffer) {
      mp3Worker.postMessage({cmd: 'encode', buf: buffer});
    };

    var _stopWorker = function() {
      if (mp3Worker) {
        mp3Worker.terminate();
        console.warn('Ending mp3 worker');
        mp3Worker = null;
      }
    };

    var _initRecorder = function() {
      // promise required because angular is async with worker
      AudioContext = $window.AudioContext || $window.webkitAudioContext;
      if (AudioContext) {
        defer = $q.defer();
        isAvailable = true;
        _initWorker();
      } else {
        isAvailable = false;
      }
    };



    var _processMicAudio = function(stream) {
      definedAudioContext = new AudioContext();
      // Settings a bufferSize of 0 instructs the browser
      // to choose the best bufferSize
      processor = definedAudioContext.createScriptProcessor(0, 1, 1);
      // process microphone to mp3 encoding
      processor.onaudioprocess = _onAudioProcess;

      microphone = definedAudioContext.createMediaStreamSource(stream);
      // connect custom processor to microphone;
      microphone.connect(processor);
      // connect to speakers as destination
      processor.connect(definedAudioContext.destination);
    };

    // convert directly from mic to mp3
    var _onAudioProcess = function(event) {
      var array = event.inputBuffer.getChannelData(0);
      _postMessage(array);
    };

    var _startMicrophone = function() {
      return navigator.mediaDevices.getUserMedia({audio: true, video: false});
    };

    var _stopRecord = function() {
      if (microphone && processor) {
        // disconnect mic and processor and stop processing
        microphone.disconnect();
        processor.disconnect();
        processor.onaudioprocess = null;
        // issue command to retrieve converted audio
        mp3Worker.postMessage({cmd: 'finish'});
        // stop microphone stream
        microphoneStream.getTracks().forEach(function(track) {
          track.stop();
        });
        isRecording = false;
      }
    };

    var _closeRecorder = function() {
      _stopWorker();
    };

    return {
      initRecorder: function() {
        _initRecorder();
      },
      status: function() {
        return {
          isAvailable: isAvailable,
          isRecording: isRecording
        };
      },
      startRecord: function() {
        var navigator = _startMicrophone();
        navigator.then(function(stream) {
          isRecording = true;
          // set microphone stream will be used for stopping track
          // stream in another function.
          microphoneStream = stream;
          _processMicAudio(stream);
        }, function(error) {
          console.warn('Microphone was not started because of' +
          'user denied permission.');
          isRecording = false;
        });

        return navigator;
      },
      stopRecord: function() {
        _stopRecord();
      },
      getMp3Data: function() {
        return defer.promise;
      },
      closeRecorder: function(onClose) {
        // _stopRecord();
        _closeRecorder();
        if (onClose) {
          onClose();
        }
      }
    };
  }
]);
