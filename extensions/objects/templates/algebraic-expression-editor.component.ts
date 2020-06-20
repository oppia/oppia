// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for algebraic expression editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

var nerdamer = require('nerdamer');

angular.module('oppia').component('algebraicExpressionEditor', {
  bindings: {
    value: '='
  },
  template: require('./algebraic-expression-editor.component.html'),
  controller: ['$scope', function($scope) {
    const ctrl = this;
    ctrl.hasBeenTouched = false;
    ctrl.warningText = '';

    ctrl.initializeGuppy = function() {
      var guppyDivs = document.querySelectorAll('.guppy-div-creator');
      var divId, guppyInstance, guppyInstances = [];
      ctrl.hasBeenTouched = false;
      for (var i = 0; i < guppyDivs.length; i++) {
        divId = 'guppy_' + Math.floor(Math.random() * 100000000);
        // Dynamically assigns a unique id to the guppy div.
        guppyDivs[i].setAttribute('id', divId);
        // Create a new guppy instance for that div.
        guppyInstance = new Guppy(divId, {});
        guppyInstances.push([divId, guppyInstance]);
      }
      return guppyInstances;
    };

    var cleanErrorMessage = function(errorMessage) {
      // The error thrown by nerdamer includes the index of the violation which
      // starts with a colon. That part needs to be removed before displaying
      // the error to the end user. Same rationale applies for stripping the
      // error message from 'at', since some errors from nerdamer use 'at' to
      // to show the location.
      var colonIndex = errorMessage.indexOf(':');
      if (colonIndex !== -1) {
        errorMessage = errorMessage.slice(0, colonIndex);
      }
      var atColonIndex = errorMessage.indexOf(' at ');
      if (atColonIndex !== -1) {
        errorMessage = errorMessage.slice(0, atColonIndex);
      }
      if (errorMessage[errorMessage.length - 1] !== '.') {
        errorMessage += '.';
      }
      return errorMessage;
    };

    ctrl.isCurrentAnswerValid = function() {
      if (ctrl.hasBeenTouched) {
        var expression;
        try {
          expression = nerdamer(ctrl.value);
        } catch (err) {
          ctrl.warningText = cleanErrorMessage(err.message);
          return false;
        }
        if (ctrl.value.length === 0) {
          ctrl.warningText = 'Please enter a non-empty answer.';
          return false;
        } else if (ctrl.value.indexOf('=') !== -1 || ctrl.value.indexOf(
          '<') !== -1 || ctrl.value.indexOf('>') !== -1) {
          ctrl.warningText = 'It looks like you have entered an ' +
            'equation/inequality. Please enter an algebraic ' +
            'expression instead.';
          return false;
        } else if (expression.variables().length === 0) {
          ctrl.warningText = 'It looks like you have entered only ' +
            'numbers. Make sure to include the necessary variables' +
            ' mentioned in the question.';
          return false;
        }
      }
      ctrl.warningText = '';
      return true;
    };

    ctrl.$onInit = function() {
      ctrl.alwaysEditable = true;
      if (ctrl.value === null) {
        ctrl.value = '';
      }
      var guppyInstances = ctrl.initializeGuppy();
      Guppy.event('change', () => {
        var activeId = $('.guppy_active').attr('id');
        for (var guppyInstance of guppyInstances) {
          if (guppyInstance[0] === activeId) {
            ctrl.value = guppyInstance[1].asciimath();
            break;
          }
        }
      });
    };
  }]
});
