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

angular.module('oppia').factory('VoiceoverRecordingService', [
  '$log', '$q', '$window', function($log, $q, $window) {
    var audioContextAvailable = null,
      defer = null,
      definedAudioContext = null, // Will be defined audio context
      isAvailable = null,
      isRecording = false,
      microphone = null,
      microphoneStream = null,
      mp3Worker = null,
      processor = null;


    var _initWorker = function() {
      if (!$window.Worker) {
        $log.warn('Worker API not supported in this browser.');
        return;
      }
      if (mp3Worker === null) {
        var lameWorkerFileUrl = '/third_party/static/lamejs-1.2.0/' +
          'worker-example/worker-realtime.js';
        // Config the mp3 encoding worker.
        var config = {sampleRate: 44100, bitRate: 128};
        mp3Worker = new Worker(lameWorkerFileUrl);
        mp3Worker.onmessage = function(e) {
          // Async data flow
          defer.resolve(e.data.buf);
        };
        mp3Worker.postMessage({cmd: 'init', config: config});
      }
    };

    var _postMessage = function(buffer) {
      // Ensure the mp3Worker is available when this is run.
      if (mp3Worker) {
        mp3Worker.postMessage({cmd: 'encode', buf: buffer});
      }
    };

    var _stopWorker = function() {
      if (mp3Worker) {
        mp3Worker.terminate();
        $log.log('Ending mp3 worker');
        mp3Worker = null;
      }
    };

    var _initRecorder = function() {
      // Browser agnostic AudioContext API check.
      audioContextAvailable = $window.AudioContext ||
        $window.webkitAudioContext;
      if (audioContextAvailable) {
        // Promise required because angular is async with worker.
        defer = $q.defer();
        isAvailable = true;
        _initWorker();
      } else {
        isAvailable = false;
      }
    };


    // Setup microphone inputs for mp3 audio processing.
    var _processMicAudio = function(stream) {
      definedAudioContext = new audioContextAvailable();
      // Settings a bufferSize of 0 instructs the browser
      // to choose the best bufferSize.
      processor = definedAudioContext.createScriptProcessor(0, 1, 1);
      // Process microphone to mp3 encoding.
      processor.onaudioprocess = _onAudioProcess;

      microphone = definedAudioContext.createMediaStreamSource(stream);
      // Connect custom processor to microphone.
      microphone.connect(processor);
      // Connect to speakers as destination.
      processor.connect(definedAudioContext.destination);
    };

    // Convert directly from mic input to mp3.
    var _onAudioProcess = function(event) {
      var array = event.inputBuffer.getChannelData(0);
      _postMessage(array);
    };

    var _startMicrophone = function() {
      return navigator.mediaDevices.getUserMedia({audio: true, video: false});
    };

    var _stopRecord = function() {
      if (microphone && processor && mp3Worker) {
        // Disconnect mic and processor and stop processing.
        microphone.disconnect();
        processor.disconnect();
        processor.onaudioprocess = null;
        // Issue command to retrieve converted audio.
        mp3Worker.postMessage({cmd: 'finish'});
        // Stop microphone stream.
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
      startRecording: function() {
        // If worker is not available then do not start recording.
        if (mp3Worker === null) {
          return null;
        }
        var navigator = _startMicrophone();
        navigator.then(function(stream) {
          isRecording = true;
          // Set microphone stream will be used for stopping track
          // stream in another function.
          microphoneStream = stream;
          _processMicAudio(stream);
        }, function() {
          $log.warn('Microphone was not started because of' +
          'user denied permission.');
          isRecording = false;
        });

        return navigator;
      },
      stopRecord: function() {
        if (mp3Worker !== null) {
          _stopRecord();
        }
      },
      getMp3Data: function() {
        return defer.promise;
      },
      closeRecorder: function() {
        _closeRecorder();
      }
    };
  }
]);
