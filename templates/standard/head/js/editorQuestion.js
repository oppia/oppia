// Copyright 2012 Google Inc. All Rights Reserved.
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
 * @fileoverview Angular controllers for elements on an editor's question page.
 *
 * @author sll@google.com (Sean Lip)
 */

var END_DEST = '-1';
var QN_DEST_PREFIX = 'q-';
// TODO(sll): Internationalize these.
var END_STRING = 'END';
var NEW_QUESTION_STRING = 'New question';

// TODO(sll): Move all strings to the top of the file, particularly
// warning messages and $scope.currentActiveInput.
// TODO(sll): console.log is not supported in IE. Fix before launch.
// TODO(sll): CSS3 selectors of the form [..] aren't supported in all browsers.

var DEFAULT_CATEGORY_NAME = 'All other inputs';
var DEFAULT_DESTS = {
    'finite': [],
    'none': [{'category': '', 'dest': END_DEST}],
    'numeric': [{'category': 'All other inputs', 'dest': END_DEST}],
    'set': [{'category': 'All other inputs', 'dest': END_DEST}],
    'text': [{'category': 'All other inputs', 'dest': END_DEST}]
};
// The following list maps input views to classifiers.
var CLASSIFIER_MAPPING = {
    'int': 'numeric',
    'multiple_choice': 'finite',
    'none': 'none',
    'set': 'set',
    'text': 'text'
};
var HUMAN_READABLE_INPUT_TYPE_MAPPING = {
    'int': 'Numeric',
    'multiple_choice': 'Multiple choice',
    'none': 'none',
    'set': 'Set',
    'text': 'Free text'
};

var ctx = document.getElementById('dummyCanvas').getContext('2d');
// This should match the font type in main.css.
ctx.font = '11pt Open Sans';
var SEP_LENGTH = ctx.measureText(': ').width;
var MAX_TREE_WIDTH = 400;

// Filter that truncates long descriptors.
// TODO(sll): Strip out HTML tags before truncating.
oppia.filter('truncate', function() {
  return function(input, length, suffix) {
    if (!input)
      return '';
    if (isNaN(length))
      length = 50;
    if (suffix === undefined)
      suffix = '...';
    if (input.length <= length || input.length - suffix.length <= length)
      return input;
    else
      return String(input).substring(0, length - suffix.length) + suffix;
  }
});

// Receive events from the iframed widget repository.
oppia.run(function($rootScope) {
  window.addEventListener('message', function(event) {
    console.log(event);
    $rootScope.$broadcast('message', event);
  });
});

oppia.directive('imageupload', function($exceptionHandler) {
  return {
    compile: function(tplElm, tplAttr) {
      return function(scope, elm, attr) {
        var input = angular.element(elm[0]);

        // evaluate the expression when file changed (user selects a file)
        input.bind('change', function() {
          try {
            scope.$eval(attr.openFiles, {$files: input[0].files});
            scope.setActiveImage(input[0].files[0]);
          } catch (e) {
            $exceptionHandler(e);
          }
        });
      };
    }
  };
});

oppia.directive('unfocusStateText', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attribs) {
      element[0].focus();
      element.bind('blur', function() {
        scope.stateText[scope.$index] = scope.item;
        scope.$apply(attribs['unfocusStateText']);
        scope.saveStateChange('stateText');
        scope.currentActiveInput = '';
      });
    }
  };
});

// Makes the palette icons draggable.
oppia.directive('paletteIcon', function($compile) {
  return {
    restrict: 'C',
    link: function(scope, element, attrs) {
      $(element).draggable({
        containment: 'window',
        helper: 'clone',
        revert: 'invalid',
        start: function(event, ui) {
          scope.clearActiveInputs();
          scope.$apply();
        },
        zIndex: 3000
      });
    }
  };
});

// Allows palette icons to be dropped.
oppia.directive('paletteDroppable', function($compile) {
  return {
    restrict: 'C',
    link: function(scope, element, attrs) {
      $(element).droppable({
        accept: '.palette-icon',
        activeClass: 'droppable-active',
        drop: function(event, ui) {
          if ($(ui.draggable).hasClass('palette-text')) {
            scope.currentActiveInput = 'stateText.' + scope.stateText.length;
            scope.stateText.push({type: 'text', value: ''});
          } else if ($(ui.draggable).hasClass('palette-image')) {
            scope.stateText.push({type: 'image', value: ''});
          } else if ($(ui.draggable).hasClass('palette-video')) {
            scope.stateText.push({type: 'video', value: ''});
          } else if ($(ui.draggable).hasClass('palette-widget')) {
            scope.stateText.push({type: 'widget', value: ''});
            scope.resetWidgetDisplay();
          } else {
            scope.addWarning('Unknown palette icon.');
            console.log('ERROR: Unknown palette icon:');
            console.log(ui);
            return;
          }
          scope.$apply();
        }
      });
    }
  };
});

// Allows stateText items to be trashed.
oppia.directive('itemDroppable', function($compile) {
  return {
    restrict: 'C',
    link: function(scope, element, attrs) {
      $(element).droppable({
        accept: '.state-text-item',
        hoverClass: 'droppable-trash-active',
        drop: function(event, ui) {
          for (var i = 0; i < scope.stateText.length; ++i) {
            if ($(ui.draggable).hasClass('item-' + i)) {
              // TODO(sll): Using just scope.stateText.splice(i, 1) doesn't
              // work, because the other objects in the array get randomly
              // arranged. Find out why, or refactor the following into a
              // different splice() method and use that throughout.
              var tempStateText = [];
              for (var j = 0; j < scope.stateText.length; ++j) {
                if (i != j) {
                  tempStateText.push(scope.stateText[j]);
                }
              }
              scope.stateText = tempStateText;
              return;
            }
          }
        },
        tolerance: 'touch'
      });
    }
  };
});

// Makes the corresponding elements sortable.
// TODO(sll): This directive doesn't actually update the underlying array,
// so ui-sortable still needs to be used. Try and fix this.
oppia.directive('sortable', function($compile) {
  return {
    restrict: 'C',
    link: function(scope, element, attrs) {
      $(element).sortable({
        scroll: false,
        stop: function(event, ui) {
          if ($(ui.item).hasClass('state-text-item')) {
            // This prevents a collision with the itemDroppable trashing.
            for (var i = 0; i < scope.stateText.length; ++i) {
              if (scope.stateText[i] == undefined) {
                scope.stateText.splice(i, 1);
                --i;
              }
            }
            scope.saveStateChange('stateText');
            scope.$apply();
          }
        }
      });
    }
  };
});


function QuestionEditor($scope, $http, $timeout) {
  window.addEventListener('popstate', function(e) {
    if (e.state) {
      $scope.stateId = e.state;
      $scope.getStateDataFromBackend($scope.stateId);
    }
  });

  // Initialize data associated with the current state.
  $scope.clearStateVariables = function() {
    $scope.stateId = '';
    $scope.stateName = '';
    $scope.stateText = [];
    $scope.inputType = '';
    $scope.classifier = '';
    $scope.console = '';
    $scope.widgetCode = '';
    $scope.widgetDisplay = 'code';
    $scope.optionalActions = [];
  };

  $scope.clearStateVariables();

  // The pathname should be: .../editor/{story_id}/{question_id}[/{state_id}]
  var pathnameArray = window.location.pathname.split('/');
  $scope.story = { id: pathnameArray[2] };
  $scope.chapter = { id: pathnameArray[4] };
  $scope.question = { id: pathnameArray[5] };
  $scope.chapterUrl = '/editor/' + $scope.story.id + '/qneditor/' +
      $scope.chapter.id;
  $scope.questionUrl = '/editor/' + $scope.story.id + '/qneditor/' +
      $scope.chapter.id + '/' + $scope.question.id;

  // Initializes the question page using data from the backend.
  $http.get($scope.questionUrl + '/data').success(function(data) {
    console.log('Data for question page:');
    console.log(data);
    $scope.story.desc = data.story_name;
    $scope.question.desc = data.question_name;
    $scope.states = data.state_list;
    $scope.questions = data.question_list;
    $scope.initStateId = data.init_state_id;
    $scope.stateId = pathnameArray[6] || $scope.initStateId;
    initJsPlumb();
    drawStateGraph($scope.states);
    $scope.getStateDataFromBackend($scope.stateId);
  }).error(function(data) {
    $scope.addWarning(data.error || 'Error: Could not load question page.');
  });

  // Clears modal window data when it is closed.
  $scope.closeModalWindow = function() {
    $scope.isModalWindowActive = false;
    $scope.activeModalCategoryId = '';
    $scope.textData = '';
  };

  $scope.closeModalWindow();

  // There are many input fields in the view that get displayed when a button
  // is clicked, and we want only one of these to be active at a time. The
  // following variable stores the name of the field that is currently active.
  // TODO(sll): on-blur, this value should revert to '' unless the user has
  // clicked inside another input box.
  $scope.currentActiveInput = '';

  $scope.initializeNewActiveInput = function(newActiveInput) {
    // TODO(sll): Rework this so that in general it saves the current active
    // input, if any, first. If it is bad input, display a warning and cancel
    // the effects of the old change. But, for now, each case is handled
    // specially.
    console.log('Current Active Input: ' + $scope.currentActiveInput);
    console.log($scope.stateId);
    if ($scope.currentActiveInput == 'stateName') {
      $scope.saveStateName();
    } else if ($scope.currentActiveInput == 'questionName') {
      $scope.saveQuestionName();
    }

    var inputArray = newActiveInput.split('.');
    // The format of the array is [CLASSIFIER_TYPE, CATEGORY_ID, ACTION_TYPE]
    // if the newActiveInput is a category/dest input field.
    if (inputArray.length == 3 && inputArray[1] != 'dummy') {
      var dests = $scope.states[$scope.stateId]['dests'];
      var categoryId = Number(inputArray[1]);
      if (inputArray[0] != 'none' && inputArray[0] != 'finite' &&
          inputArray[2] == 'category' &&
          dests[categoryId]['category'] == DEFAULT_CATEGORY_NAME) {
        // If the newActiveInput is a non-editable category, do not proceed.
        return;
      }
    }

    $scope.currentActiveInput = (newActiveInput || '');
    // TODO(sll): Initialize the newly displayed field.
  };

  $scope.clearActiveInputs = function() {
    $scope.currentActiveInput = '';
  };

  /**
   * Checks if a new user-entered field is a duplicate of one that already
   * exists in a given object.
   * @param {object} object The object to be iterated over.
   * @param {string} field The variable name corresponding to the field that
   *     will store the new input.
   * @param {string} currentKey The value of the key for which a new input is
   *     being given.
   * @param {string} newInput The new input whose existence in the object is
   *     being checked.
   * @return {bool} true if the input is already in the list under a key that is
   *     not currentKey; false otherwise.
   */
  $scope.isDuplicateInput = function(object, field, currentKey, newInput) {
    for (var key in object) {
      if (key != currentKey && object[key][field] == newInput) {
        return true;
      }
    }
    return false;
  };

  /**
   * Checks if a new user-entered field is a duplicate of one that already
   * exists a given array.
   * @param {array} array The array to be iterated over.
   * @param {string} field The variable name corresponding to the field that
   *     will store the new input.
   * @param {string} index The index for which a new input is being given.
   * @param {string} newInput The new input whose existence in the array is
   *     being checked.
   * @return {bool} true if the input is already in the list under a key that is
   *     not index; false otherwise.
   */
  $scope.isDuplicateArrayInput = function(array, field, index, newInput) {
    for (var i = 0; i < array.length; ++i) {
      if (i != index && array[i][field] == newInput) {
        $scope.addWarning(
            'The name \'' + String(newInput) + '\' is already in use.');
        return true;
      }
    }
    return false;
  };

  // Adds a new state to the list of states, and updates the backend.
  $scope.addState = function(newStateName, changeIsInline, categoryId) {
    if (!$scope.isValidEntityName(newStateName))
      return;
    // States may not start with '[', since that label is reserved for
    // '[Chapter]', '[Question]', etc.
    if (newStateName && newStateName[0] == '[') {
      $scope.addWarning('State names may not start with \'[\'.');
      return;
    }
    if (newStateName.toUpperCase() == 'END') {
      $scope.addWarning('Please choose a state name that is not \'END\'.');
      return;
    }
    for (var id in $scope.states) {
      if (id != $scope.stateId && $scope.states[id]['desc'] == newStateName) {
        $scope.getStateDataFromBackend(id);
        return;
      }
    }

    $scope.addStateLoading = true;
    $http.post(
        $scope.questionUrl,
        'state_name=' + newStateName,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              $scope.addStateLoading = false;
              // The 'slice' below is needed because it's necessary to clone the
              // array.
              $scope.states[data.stateId] = {
                  desc: data.stateName, dests: DEFAULT_DESTS['none'].slice()};
              $scope.saveStateChange('states');
              $scope.newStateDesc = '';
              if (changeIsInline) {
                $scope.inlineNewNoneStateDesc = '';
                $scope.inlineNewFiniteStateDesc = '';
                $scope.inlineNewNumericStateDesc = '';
                $scope.inlineNewSetStateDesc = '';
                $scope.inlineNewTextStateDesc = '';
                $scope.closeModalWindow();
                $scope.clearActiveInputs();

                var oldDest =
                    $scope.states[$scope.stateId].dests[categoryId].dest;

                if (categoryId < $scope.states[$scope.stateId].dests.length) {
                  $scope.states[$scope.stateId].dests[categoryId].dest =
                      data.stateId;
                } else {
                  console.log(
                      'ERROR: Invalid category id ' + String(categoryId));
                  return;
                }
                $scope.saveStateChange('states');
              } else {
                // The content creator added a state from the state list.
                $scope.initializeEditorWindow(data);
              }
            }).error(function(data) {
              $scope.addStateLoading = false;
              $scope.addWarning(
                  'Server error when adding state: ' + data.error);
            });
  };

  /**
   * Gets the data needed to populate the editor of a particular state.
   * @param {string} stateId The id of the state to get the data for.
   */
  $scope.getStateDataFromBackend = function(stateId) {
    console.log('Getting state data');
    $http.post(
        $scope.questionUrl + '/' + stateId, '',
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success($scope.initializeEditorWindow).
            error(function(data) {
              $scope.addWarning('Server error: ' + data.error);
            });
  };

  /**
   * Sets up the state editor, given its data from the backend.
   * @param {Object} data Data received from the backend about the state.
   */
  $scope.initializeEditorWindow = function(data) {
    var prevStateId = $scope.stateId;
    $scope.closeModalWindow();
    $scope.stateId = data.stateId;
    var prefix = $scope.stateId + '.';
    var variableList = ['stateName', 'stateText', 'inputType', 'classifier',
                        'optionalActions', 'states'];
    for (var i = 0; i < variableList.length; ++i) {
      // Exclude 'states', because it is not returned from the backend.
      if (variableList[i] != 'states') {
        $scope[variableList[i]] = data[variableList[i]];
      }
    }

    console.log(data);
    if (!prevStateId || prevStateId == $scope.stateId) {
      window.history.replaceState(
          $scope.stateId, null, $scope.questionUrl + '/' + $scope.stateId);
    } else {
      window.history.pushState(
          $scope.stateId, null, $scope.questionUrl + '/' + $scope.stateId);
    }

    // If a widget exists, show its compiled version and populate the widget
    // view fields.
    for (var i = 0; i < $scope.stateText.length; ++i) {
      if ($scope.stateText[i].type == 'widget') {
        $scope.widgetDisplay = 'compiled';
        // Get the widget with id $scope.stateText[i].value
        $http.get('/widgets/' + $scope.stateText[i].value).
            success(function(data) {
              console.log(data);
              $scope.widgetCode = data.raw;
              $scope.loadJsWidget(data.js, data.html);
            }).error(function(data) {
              $scope.addWarning(
                  'Widget could not be loaded: ' + String(data.error));
            });
      }
    }

    // Changes the active node in the graph.
    drawStateGraph($scope.states);
  };

  $scope.resetWidgetDisplay = function() {
    $scope.widgetDisplay = 'code';
  };

  $scope.saveQuestionName = function() {
    if (!$scope.isValidEntityName($scope.question.desc))
      return;
    if ($scope.isDuplicateInput($scope.questions, 'desc',
            $scope.question.id, $scope.question.desc)) {
      $scope.addWarning('The name \'' + $scope.question.desc +
                        '\' is already in use.');
      return;
    }

    // Note that the change is already saved in $scope.question.desc
    // by virtue of Angular JS magic.

    // Send this change directly to the backend (don't save in local storage).
    $scope.saveQuestionNameLoading = true;
    $http.put(
        $scope.questionUrl + '/data/',
        'question_name=' + encodeURIComponent($scope.question.desc),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(data) {
      $scope.saveQuestionNameLoading = false;
    }).error(function(data) {
      $scope.saveQuestionNameLoading = false;
      $scope.addWarning(data.error || 'Error updating question.');
    });

    $scope.clearActiveInputs();
  };

  $scope.saveStateName = function() {
    if (!$scope.isValidEntityName($scope.stateName))
      return;
    if ($scope.isDuplicateInput(
            $scope.states, 'desc', $scope.stateId, $scope.stateName)) {
      $scope.addWarning(
          'The name \'' + $scope.stateName + '\' is already in use.');
      return;
    }

    $scope.states[$scope.stateId].desc = $scope.stateName;
    editStateVertexName($scope.stateId, $scope.stateName);
    $scope.saveStateChange('states');
    $scope.saveStateChange('stateName');
    $scope.clearActiveInputs();
  };

  $scope.deleteCategory = function(categoryId) {
    // TODO(wilsonhong): Modify the following to remove the edge corresponding
    // to the specific category ID from the graph (rather than a generic edge
    // from the start node to the destination node).
    $scope.optionalActions.splice(categoryId, 1);
    $scope.states[$scope.stateId]['dests'].splice(categoryId, 1);
    $scope.saveStateChange('states');
    drawStateGraph($scope.states);
  };

  $scope.showEditorModal = function(actionType, categoryId) {
    // TODO(sll): Get this modal dialog to show up next to the button that was
    // clicked. Do this by getting the DOM object, and the clicked position
    // from it using $(buttonElement).position().left,
    // $(buttonElement).position().top.

    $scope.isModalWindowActive = true;
    $('.editorInput').hide();
    $('#' + actionType + 'Input').show();
    $('.firstInputField').focus();

    if (actionType != 'view') {
      $scope.activeModalCategoryId = categoryId;
      if ($scope.optionalActions[categoryId][actionType]) {
        if (actionType === 'text') {
          $scope[actionType + 'Data'] =
              $scope.optionalActions[categoryId][actionType];
        }
      }
    }
  };

  $scope.getTextDescription = function(text) {
    return text ? 'Feedback: ' + text : '';
  };

  $scope.getMetricDescription = function(metric, delta) {
    delta = Number(delta);
    if (typeof delta === 'number') {
      if (delta > 0)
        return metric ? 'Increase ' + metric + ' by ' + delta : '';
      else if (delta < 0)
        return metric ? 'Decrease ' + metric + ' by ' + (-delta) : '';
    }
    return '';
  };

  $scope.getDestDescription = function(dest) {
    if (!dest) {
      return 'Error: unspecified destination';
    } else if (dest == END_DEST) {
      return 'Destination: END';
    } else if (dest in $scope.states) {
      return 'Destination: ' + $scope.states[dest].desc;
    } else if (dest.indexOf(QN_DEST_PREFIX) == 0 &&
               dest.substring(2) in $scope.questions) {
      return 'Destination question: ' +
          $scope.questions[dest.substring(2)].desc;
    } else {
      return '[Error: invalid destination]';
    }
  };

  /**
   * Displays the 'Add metric' box.
   * @param {int} categoryId The id of the category containing the metric.
   */
  $scope.initializeMetricAdder = function(categoryId) {
    $scope.initializeNewActiveInput(
        $scope.classifier + '.' + categoryId + '.metrics.add');
    $scope.newMetricKey = '';
    $scope.newMetricValue = 1;
  };

  /**
   * Adds a metric.
   * @param {int} categoryId The id of the category containing the metric.
   * @param {string} key The name of the metric to be changed.
   * @param {float} value The value to change the metric by.
   */
  $scope.addMetric = function(categoryId, key, value) {
    value = Number(value);
    if (!value || typeof value !== 'number' || value == 0) {
      $scope.addWarning('Changing a metric by 0 doesn\'t do anything!');
      $scope.clearActiveInputs();
      return;
    }
    for (var i = 0; i < $scope.optionalActions[categoryId]['metrics'].length;
        ++i) {
      if ($scope.optionalActions[categoryId]['metrics'][i].key == key) {
        $scope.addWarning('This metric has already been changed.');
        return;
      }
    }

    $scope.optionalActions[categoryId]['metrics'].push(
        {'key': key, 'value': value});
    $scope.newMetricKey = '';
    $scope.newMetricValue = 0;
    $scope.saveStateChange('states');
    $scope.clearActiveInputs();
  };

  /**
   * Displays the 'edit metric' box.
   * @param {int} categoryId The id of the category containing the metric.
   * @param {string} key The name of the metric to be changed.
   * @param {float} value The current value of the metric.
   */
  $scope.editMetric = function(categoryId, key, value) {
    $scope.initializeNewActiveInput(
        $scope.classifier + '.' + categoryId + '.metrics.edit');
    $scope.newMetricKey = key;
    $scope.newMetricValue = value;
  };

  $scope.getCategoryClass = function(categoryName) {
    return categoryName != DEFAULT_CATEGORY_NAME ? 'category-name' : '';
  };

  $scope.saveText = function() {
    var categoryId = $scope.activeModalCategoryId;
    $scope.optionalActions[categoryId]['text'] = $scope.textData;
    $scope.saveStateChange('states');
    $scope.closeModalWindow();
  };

  /**
   * Saves the change to a metric.
   * @param {int} categoryId The id of the category containing the metric.
   * @param {string} key The name of the metric to be changed.
   * @param {float} value The value that the metric should be changed to.
   */
  $scope.saveMetric = function(categoryId, key, value) {
    if (typeof value !== 'number') {
      $scope.addWarning('Invalid value for metric change: ' + value);
      $scope.clearActiveInputs();
      return;
    }
    for (var i = 0; i < $scope.optionalActions[categoryId]['metrics'].length;
        ++i) {
      if ($scope.optionalActions[categoryId]['metrics'][i].key == key) {
        value ?
            $scope.optionalActions[categoryId]['metrics'][i].value = value :
            $scope.optionalActions[categoryId]['metrics'].splice(i, 1);
        $scope.newMetricKey = '';
        $scope.newMetricValue = 0;
        $scope.saveStateChange('states');
        $scope.clearActiveInputs();
        return;
      }
    }
  };

  $scope.saveDest = function(categoryId, destName) {
    if (!destName) {
      $scope.addWarning('Please choose a destination.');
      return;
    }

    var oldDest = $scope.states[$scope.stateId]['dests'][categoryId].dest;

    var found = false;
    if (destName.toUpperCase() == 'END') {
      found = true;
      $scope.states[$scope.stateId]['dests'][categoryId].dest = END_DEST;
    }
    // If destName is a question, find the id in questions.
    if (destName.indexOf('[Question] ') == 0) {
      destName = destName.substring(11);
      for (var id in $scope.questions) {
        if ($scope.questions[id].desc == destName) {
          found = true;
          $scope.states[$scope.stateId]['dests'][categoryId].dest = 'q-' + id;
          break;
        }
      }
    }
    // Otherwise, find the id in states.
    if (!found) {
      for (var id in $scope.states) {
        if ($scope.states[id].desc == destName) {
          found = true;
          $scope.states[$scope.stateId]['dests'][categoryId].dest = id;
          break;
        }
      }
    }

    if (!found) {
      $scope.addState(destName, true, categoryId);
      return;
    }

    $scope.saveStateChange('states');
    $scope.clearActiveInputs();
    drawStateGraph($scope.states);
  };

  /**
   * Saves a change to a state property.
   * @param {String} property The state property to be saved.
   */
  $scope.saveStateChange = function(property) {
    if (!$scope.stateId)
      return;
    $scope.clearActiveInputs();

    var requestParameters = {state_id: $scope.stateId};

    if (property == 'stateName') {
      requestParameters['state_name'] = $scope.stateName;
    } else if (property == 'stateText') {
      // Remove null values from $scope.stateText.
      $scope.tempStateText = [];
      for (var i = 0; i < $scope.stateText.length; ++i) {
        if ($scope.stateText[i]['value'])
          $scope.tempStateText.push($scope.stateText[i]);
      }
      requestParameters['state_text'] = JSON.stringify($scope.tempStateText);
    } else if (property == 'inputType' || property == 'states' ||
        property == 'optionalActions') {
      requestParameters['input_type'] = $scope.inputType;
      if ($scope.classifier != 'none' &&
          $scope.states[$scope.stateId]['dests'].length == 0) {
        $scope.addWarning(
            'Interactive questions should have at least one category.');
        $scope.changeInputType('none');
        return;
      }

      var actionsForBackend = $scope.optionalActions;
      console.log(actionsForBackend);
      for (var ind = 0;
           ind < $scope.states[$scope.stateId]['dests'].length; ++ind) {
        actionsForBackend[ind]['category'] =
            $scope.states[$scope.stateId]['dests'][ind].category;
        actionsForBackend[ind]['dest'] =
            $scope.states[$scope.stateId]['dests'][ind].dest;
      }
      requestParameters['actions'] = JSON.stringify(actionsForBackend);
    }

    var request = $.param(requestParameters, true);
    console.log('REQUEST');
    console.log(request);

    $http.put(
        $scope.questionUrl + '/' + $scope.stateId + '/data',
        request,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(data) {
      console.log('Changes saved successfully.');
      drawStateGraph($scope.states);
    }).error(function(data) {
      $scope.addWarning(data.error || 'Error communicating with server.');
    });
  };

  $scope.getReadableInputType = function(inputType) {
    return HUMAN_READABLE_INPUT_TYPE_MAPPING[inputType];
  };

  /**
   * Triggered when the content creator changes the input type.
   * @param {string} newInputType The input type specified by the content
   *     creator.
   */
  $scope.changeInputType = function(newInputType) {
    $scope.closeModalWindow();
    $scope.inputType = newInputType;
    if (!$scope.inputType) {
      $scope.inputType = 'none';
    }
    if ($scope.inputType == 'none') {
      $scope.newInputType = '';
    }

    $scope.classifier = CLASSIFIER_MAPPING[$scope.inputType];
    if (!$scope.classifier) {
      $scope.addWarning('Invalid input type: ' + $scope.inputType);
      $scope.classifier = 'none';
    }

    console.log($scope.states[$scope.stateId]);
    // Change $scope.states to the default for the new classifier type.
    $scope.states[$scope.stateId]['dests'] =
        DEFAULT_DESTS[$scope.classifier].slice();
    // Update $scope.optionalActions.
    $scope.optionalActions = [];

    for (var i = 0; i < $scope.states[$scope.stateId]['dests'].length; ++i) {
      $scope.optionalActions.push({});
    }
    if ($scope.classifier != 'finite') {
      $scope.saveStateChange('states');
    }
    // Update the graph.
    drawStateGraph($scope.states);
  };

  $scope.closeEditorWindow = function() {
    window.history.replaceState(
        $scope.stateId, null, $scope.questionUrl + '/' + $scope.stateId);
    window.history.pushState('', null, $scope.questionUrl);
    $scope.stateId = '';
  };

  $scope.hideVideoInputDialog = function(videoLink, index) {
    if (videoLink) {
      // The content creator has added a new video link. Extract its ID.
      if (videoLink.indexOf('http://') == 0)
        videoLink = videoLink.substring(7);
      if (videoLink.indexOf('https://') == 0)
        videoLink = videoLink.substring(8);
      if (videoLink.indexOf('www.') == 0)
        videoLink = videoLink.substring(4);

      // Note that the second group of each regex must be the videoId in order
      // for the following code to work.
      // TODO(sll): Check these regexes carefully (or simplify the logic).
      var videoRegexp1 = new RegExp(
          '^youtube\.com\/watch\\?(.*&)?v=([A-Za-z0-9-_]+)(&.*)?$');
      var videoRegexp2 = new RegExp(
          '^(you)tube\.com\/embed\/([A-Za-z0-9-_]+)/?$');
      var videoRegexp3 = new RegExp('^(you)tu\.be\/([A-Za-z0-9-_]+)/?$');

      var videoId = (videoRegexp1.exec(videoLink) ||
                     videoRegexp2.exec(videoLink) ||
                     videoRegexp3.exec(videoLink));
      if (!videoId) {
        $scope.addWarning(
            'Could not parse this video link. Please use a YouTube video.');
        return;
      }

      // The following validation method is the one described in
      // stackoverflow.com/questions/2742813/how-to-validate-youtube-video-ids
      $http.get('http://gdata.youtube.com/feeds/api/videos/' + videoId[2], '').
          success(function(data) {
            $scope.stateText[index].value = videoId[2];
            $scope.saveStateChange('stateText');
          }).error(function(data) {
            $scope.addWarning('This is not a valid YouTube video id.');
          });
    }
    $scope.clearActiveInputs();
  };

  $scope.deleteVideo = function(index) {
    $scope.stateText[index].value = '';
    $scope.saveStateChange('stateText');
  };

  $scope.setActiveImage = function(image) {
    $scope.image = image;
  };

  $scope.saveImage = function(index) {
    $('#newImageForm')[0].reset();
    $scope.clearActiveInputs();
    image = $scope.image;

    if (!image || !image.type.match('image.*')) {
      $scope.addWarning('This file is not recognized as an image.');
      return;
    }

    $('#uploadImageLoading').show();
    // The content creator has uploaded an image.
    var form = new FormData();
    form.append('image', image);

    $.ajax({
        url: '/editor/images/',
        data: form,
        processData: false,
        contentType: false,
        type: 'POST',
        datatype: 'json',
        success: function(data) {
          data = jQuery.parseJSON(data);
          if (data.image_id) {
            $scope.$apply(function() {
              $scope.stateText[index].value = data.image_id;
              $scope.saveStateChange('stateText');
            });
          } else {
            $scope.addWarning(
                'There was an error saving your image. Please retry later.');
          }
          $('#uploadImageLoading').hide();
        },
        error: function(data) {
          $scope.addWarning(data.error || 'Error communicating with server.');
          $('#uploadImageLoading').hide();
        }
    });
  };

  $scope.deleteImage = function(index) {
    // TODO(sll): Send a delete request to the backend datastore.
    $scope.stateText[index].value = '';
    $scope.saveStateChange('stateText');
  };

  /**
   * Initializes a Caja frame for the cajoled widget.
   * @param {string} js The cajoled JavaScript.
   * @param {string} html The cajoled HTML.
   */
  $scope.loadJsWidget = function(js, html) {
    console.log('Cajoled code:');
    console.log(js);
    console.log(html);
    caja.load(document.getElementById('widgetCompiled'),
        caja.policy.net.NO_NETWORK,
        function(frame) {
          frame.cajoled('https://fake.url', js, html).run();
        });
  };

  // Receive messages from the widget repository.
  $scope.$on('message', function(event, arg) {
    console.log(arg);
    console.log(arg.origin);
    console.log(arg.data);
    // Save the code. TODO(sll): fix this, the $scope is wrong.
    $scope.widgetDisplay = 'compiled';
    $scope.$apply();
  });

  $scope.saveWidget = function(widgetCode, index) {
    var cajaRestEndpoint = 'https://caja.appspot.com/cajole' +
        '?url=' + encodeURIComponent('https://fake.url/') +
        '&input-mime-type=' + encodeURIComponent('text/html') +
        '&transform=CAJOLE';

    // TODO(sll): Escape widgetCode first!
    // TODO(sll): Need to ensure that anything stored server-side cannot lead
    //     to malicious behavior (e.g. the user could do his/her own POST
    //     request). Get a security review done on this feature.
    $http.post(cajaRestEndpoint, widgetCode,
        {headers: {'Content-Type': 'text/html', 'X-Requested-With': ''}}
    ).success(function(data) {
      console.log(data.html);
      console.log(data.js);
      console.log(data.messages);

      var requestParameters = {
        'html': JSON.stringify(data.html),
        'js': JSON.stringify(data.js),
        'raw': JSON.stringify(widgetCode)
      };
      var request = $.param(requestParameters, true);
      console.log('REQUEST');
      console.log(request);
      var widgetId = $scope.stateText[index].value || '';

      $http.post(
        '/widgets/' + widgetId,
        request,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
      ).success(function(widgetData) {
        // Check that the data has been saved correctly.
        if (widgetData.js != data.js || widgetData.html != data.html) {
          console.log('widgetData changed');
          console.log(widgetData);
          console.log(data);
        }

        $scope.stateText[index].value = widgetData.widgetId;
        $scope.saveStateChange('stateText');
        $('#widgetCompiled').html('');
        // TODO(sll): This should probably change later to accept multiple
        // widget div's.
        $scope.loadJsWidget(widgetData.js, widgetData.html);
        $scope.clearActiveInputs();
        $scope.widgetDisplay = 'compiled';
        console.log($scope.stateText);
      });
    });
  };

  $scope.isWidgetInStateText = function() {
    for (var i = 0; i < $scope.stateText.length; ++i) {
      if ($scope.stateText[i] && $scope.stateText[i]['type'] == 'widget') {
        return true;
      }
    }
    return false;
  };

  // Deletes the state with id stateId. This action cannot be undone.
  // TODO(sll): Add an 'Are you sure?' prompt. Later, allow undoing of the
  // deletion.
  $scope.deleteState = function(stateId) {
    if (stateId == $scope.initStateId) {
      $scope.addWarning('Deleting the initial state of a question is not ' +
          'supported. Perhaps edit it instead?');
      return;
    }

    // TODO(sll): Figure out if the next line messes up the browser history.
    $scope.closeEditorWindow();
    $scope.clearStateVariables();

    $http.delete(
        $scope.questionUrl + '/' + stateId + '/data', '',
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(data) {
      var edgesDeleted = 0;
      // Remove incoming edges from other states to this state. This must be
      // done to ensure that $scope.states stays up to date.
      for (var id in $scope.states) {
        for (var categoryIndex = 0;
             categoryIndex < $scope.states[id].dests.length;
             ++categoryIndex) {
          if ($scope.states[id].dests[categoryIndex].dest == stateId) {
            $scope.states[id].dests[categoryIndex].dest = id;
            edgesDeleted++;
          }
        }
      }
      if (edgesDeleted) {
        $scope.addWarning(
            'The categories of some states now no longer have destinations.');
      }

      delete $scope.states[stateId];
      $scope.saveStateChange('states');
      drawStateGraph($scope.states);
    }).error(function(data) {
      $scope.addWarning(data.error || 'Error communicating with server.');
    });
  };


  var stateCanvas = $('#state-graph-canvas');
  var vertexIds = [];
  var clickDelay = 500;
  // Depth of each node in the graph.
  var levelMap = {};
  // Maximum depth of a node in the graph.
  var maxLevel = 0;
  // Number of nodes already in a given row.
  var rowCount = {};

  initJsPlumb = function() {
    jsPlumb.Defaults.PaintStyle = {
      lineWidth: 2,
      strokeStyle: 'red'
    };
  };

  /**
   * Draws the graph of states.
   * @param {Object} states An object containing all the data (destinations
   *     and category names) needed to draw the state graph.
   */
  drawStateGraph = function(states) {
    // Clear the canvas.
    jsPlumb.reset();
    stateCanvas.html('');
    // Determine positions of the state vertices using breadth-first search.
    vertexIds = [];
    levelMap = {};
    levelMap[$scope.initStateId] = 0;
    maxLevel = 0;
    var seenNodes = [$scope.initStateId];
    var queue = [$scope.initStateId];
    while (queue.length > 0) {
      var currNode = queue[0];
      queue.shift();
      if (currNode in states) {
        for (var i = 0; i < states[currNode].dests.length; i++) {
          // Assign levels to nodes only when they are first encountered.
          if (seenNodes.indexOf(states[currNode].dests[i].dest) == -1) {
            seenNodes.push(states[currNode].dests[i].dest);
            levelMap[states[currNode].dests[i].dest] = levelMap[currNode] + 1;
            maxLevel = Math.max(maxLevel, levelMap[currNode] + 1);
            queue.push(states[currNode].dests[i].dest);
          }
        }
      }
    }
    console.log(levelMap);
    // Initialize rowCount.
    for (var i = 0; i <= maxLevel + 1; ++i) {
      rowCount[i] = 0;
    }
    // Create State vertices
    for (var id in states) {
      createStateVertex(id, states[id].desc);
    }
    // Add edges for each vertex
    for (var id in states) {
      createEdgesForStateVertex(id, states[id].dests);
    }
  };

  /**
   * Creates a new 'ordinary' state node (i.e., not an END or question node) in
   * the graph.
   * @param {string} stateId The id of the node to be created.
   * @param {string} title The text to be displayed in this node.
   */
  createStateVertex = function(stateId, title) {
    var color = 'whitesmoke';
    if (!(stateId in levelMap)) {
      // This state is not reachable from the initial state.
      color = '#FEEFB3';
    }
    createVertex(stateId,
      title,
      color,
      function() {
        $scope.getStateDataFromBackend(stateId);
      },
      function() {
        $scope.deleteState(stateId);
      }
    );
  };

  /**
   * Creates a new graph node with a given color and on-click action.
   * @param {string} id The id of the node to be created.
   * @param {string} title The text to be displayed in this node.
   * @param {string} color The color of the node to be created.
   * @param {function} clickCallback The method that should be called when the
   *     graph node is clicked.
   * @param {function} deleteCallback The method that should be called when
   *     the graph node is deleted.
   */
  createVertex = function(id, title, color, clickCallback, deleteCallback) {
    var last, diff, moved;
    var canEdit = (id != END_DEST);
    var canDelete = canEdit && (id.toString().indexOf(QN_DEST_PREFIX) != 0 &&
        id != $scope.initStateId);

    var vertexId = getVertexId(id);
    if (vertexIds.indexOf(vertexId) != -1) {
      // Vertex already existed
      console.log('Vertex exist! ' + id);
      return;
    }

    var $del = $('<div/>')
    .addClass('state-graph-vertex-delete')
    .html('&times;')
    .click(function() {
      if (deleteCallback) {
        deleteCallback();
      }
    });

    var $info = $('<div/>')
    .addClass('state-graph-vertex-info')
    .html('<p>' + title + '</p>');
    if (canEdit) {
      $info
      .addClass('state-graph-vertex-info-editable')
      .click(function() {
        if (!moved && diff < clickDelay) {
          if (clickCallback) {
            clickCallback();
          }
        }
      });
    }

    var vertexIndex = vertexIds.length;
    var depth = id in levelMap ? levelMap[id] : maxLevel + 1;
    var $vertex = $('<div/>', {id: vertexId})
    .css({
      'background-color': color,
      'border': '2px solid black',
      'border-radius': '50%',
      'left': (80 * rowCount[depth]) + 'px',
      'opacity': 0.8,
      'padding': '8px',
      'position': 'absolute', // Necessary to make div draggable
      'top': (140 * depth) + 'px',
      'z-index': 2 // Yeah! its a magic number I know ;)
    })
    .bind('mousedown', function(e) {
      last = e.timeStamp;
      moved = false;
    })
    .bind('mouseup mousemove', function(e) {
      if (e.type == 'mousemove') {
        moved = true;
        return;
      }
      diff = e.timeStamp - last;
    })
    .prepend($info)
    .prepend(canDelete ? $del : null)
    .appendTo(stateCanvas);

    // Highlight unreachable nodes, the starting node, and the current node.
    if (!(id in levelMap)) {
      $vertex.attr('title', 'This node is unreachable from the start node.');
    }
    if (id == $scope.initStateId) {
      $vertex.attr('title', 'This is the starting node.');
      $vertex.css('border-radius', '20%');
    }
    if (id == $scope.stateId) {
      $vertex.css('border', '5px solid blue');
    }

    rowCount[depth]++;
    jsPlumb.draggable($vertex);

    vertexIds.push(vertexId);
  };

  /**
   * Modifies the name of a graph node.
   * @param {string} stateId The id of the node whose name is to be modified.
   * @param {string} stateName The new text that should be shown in this node.
   */
  editStateVertexName = function(stateId, stateName) {
    $('#' + getVertexId(stateId)).html('<p>' + stateName + '</p>');
  };

  createEdgesForStateVertex = function(stateId, dests) {
    for (var i = 0; i < dests.length; ++i) {
      createEdge(stateId, dests[i].dest, dests[i].category);
    }
  };

  createEdge = function(srcId, destId, label) {
    var srcVertexId = getVertexId(srcId);
    if (vertexIds.indexOf(srcVertexId) == -1) {
      console.log('Edge source should be create first! ' + srcId);
      return;
    }

    var destVertexId = getVertexId(destId);
    if (vertexIds.indexOf(destVertexId) == -1) {
      if (destId.indexOf(QN_DEST_PREFIX) === 0) {
        var questionId = destId.substring(2);
        createVertex(destId,
            '<a>[Question] ' + $scope.questions[questionId].desc + '</a>',
            'lightblue',
            function() {
              window.location = $scope.chapterUrl + '/' + questionId;
            },
            null);
      } else if (destId == END_DEST) {
        createVertex(END_DEST, END_STRING, 'olive', null, null);
      } else {
        console.log('Edge destination is invalid! ' + destId);
        return;
      }
    }

    var srcIndex = vertexIds.indexOf(srcVertexId);
    var destIndex = vertexIds.indexOf(destVertexId);

    var connectInfo = {
      source: $('#' + srcVertexId),
      target: $('#' + destVertexId),
      connector: ['StateMachine', {'curviness': 0}],
      endpoint: ['Dot', {radius: 2}],
      anchor: 'Continuous',
      overlays: [
        ['Arrow', {
          location: 1,
          length: 14,
          foldback: 0.8}],
        ['Label', {label: label, location: 0.35 }]
      ]
    };

    jsPlumb.connect(connectInfo).setDetachable(true);
  };

  getVertexId = function(id) {
    return 'vertexID' + id;
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
QuestionEditor.$inject = ['$scope', '$http', '$timeout'];
