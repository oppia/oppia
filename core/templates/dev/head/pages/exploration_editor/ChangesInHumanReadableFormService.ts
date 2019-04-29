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
 * @fileoverview Service to get changes in human readable form.
 */

oppia.factory('ChangesInHumanReadableFormService', [
  'UtilsService', function(UtilsService) {
    var CMD_ADD_STATE = 'add_state';
    var CMD_RENAME_STATE = 'rename_state';
    var CMD_DELETE_STATE = 'delete_state';
    var CMD_EDIT_STATE_PROPERTY = 'edit_state_property';

    var makeRulesListHumanReadable = function(answerGroupValue) {
      var rulesList = [];
      answerGroupValue.rules.forEach(function(rule) {
        var ruleElm = angular.element('<li></li>');
        ruleElm.html('<p>Type: ' + rule.type + '</p>');
        ruleElm.append(
          '<p>Value: ' + (
            Object.keys(rule.inputs).map(function(input) {
              return rule.inputs[input];
            })
          ).toString() + '</p>');
        rulesList.push(ruleElm);
      });

      return rulesList;
    };

    // An edit is represented either as an object or an array. If it's an
    // object, then simply return that object. In case of an array, return
    // the last item.
    var getStatePropertyValue = function(statePropertyValue) {
      return angular.isArray(statePropertyValue) ?
        statePropertyValue[statePropertyValue.length - 1] : statePropertyValue;
    };

    // Detects whether an object of the type 'answer_group' or
    // 'default_outcome' has been added, edited or deleted.
    // Returns - 'addded', 'edited' or 'deleted' accordingly.
    var getRelativeChangeToGroups = function(changeObject) {
      var newValue = changeObject.new_value;
      var oldValue = changeObject.old_value;
      var result = '';

      if (angular.isArray(newValue) && angular.isArray(oldValue)) {
        result = (newValue.length > oldValue.length) ?
          'added' : (newValue.length === oldValue.length) ?
            'edited' : 'deleted';
      } else {
        if (!UtilsService.isEmpty(oldValue)) {
          if (!UtilsService.isEmpty(newValue)) {
            result = 'edited';
          } else {
            result = 'deleted';
          }
        } else if (!UtilsService.isEmpty(newValue)) {
          result = 'added';
        }
      }
      return result;
    };

    var makeHumanReadable = function(lostChanges) {
      var outerHtml = angular.element('<ul></ul>');
      var stateWiseEditsMapping = {};
      // The variable stateWiseEditsMapping stores the edits grouped by state.
      // For instance, you made the following edits:
      // 1. Changed content to 'Welcome!' instead of '' in 'Introduction'.
      // 2. Added an interaction in this state.
      // 2. Added a new state 'End'.
      // 3. Ended Exporation from state 'End'.
      // stateWiseEditsMapping will look something like this:
      // - 'Introduction': [
      //   - 'Edited Content: Welcome!',:
      //   - 'Added Interaction: Continue',
      //   - 'Added interaction customizations']
      // - 'End': ['Ended exploration']

      lostChanges.forEach(function(lostChange) {
        switch (lostChange.cmd) {
          case CMD_ADD_STATE:
            outerHtml.append(
              angular.element('<li></li>').html(
                'Added state: ' + lostChange.state_name));
            break;
          case CMD_RENAME_STATE:
            outerHtml.append(
              angular.element('<li></li>').html(
                'Renamed state: ' + lostChange.old_state_name + ' to ' +
                  lostChange.new_state_name));
            break;
          case CMD_DELETE_STATE:
            outerHtml.append(
              angular.element('<li></li>').html(
                'Deleted state: ' + lostChange.state_name));
            break;
          case CMD_EDIT_STATE_PROPERTY:
            var newValue = getStatePropertyValue(lostChange.new_value);
            var oldValue = getStatePropertyValue(lostChange.old_value);
            var stateName = lostChange.state_name;
            if (!stateWiseEditsMapping[stateName]) {
              stateWiseEditsMapping[stateName] = [];
            }

            switch (lostChange.property_name) {
              case 'content':
                if (newValue !== null) {
                  // TODO(sll): Also add display of audio translations here.
                  stateWiseEditsMapping[stateName].push(
                    angular.element('<div></div>').html(
                      '<strong>Edited content: </strong><div class="content">' +
                        newValue.html + '</div>')
                      .addClass('state-edit-desc'));
                }
                break;

              case 'widget_id':
                var lostChangeValue = '';
                if (oldValue === null) {
                  if (newValue !== 'EndExploration') {
                    lostChangeValue = ('<strong>Added Interaction: </strong>' +
                                       newValue);
                  } else {
                    lostChangeValue = 'Ended Exploration';
                  }
                } else {
                  lostChangeValue = ('<strong>Deleted Interaction: </strong>' +
                                     oldValue);
                }
                stateWiseEditsMapping[stateName].push(
                  angular.element('<div></div>').html(lostChangeValue)
                    .addClass('state-edit-desc'));
                break;

              case 'widget_customization_args':
                var lostChangeValue = '';
                if (UtilsService.isEmpty(oldValue)) {
                  lostChangeValue = 'Added Interaction Customizations';
                } else if (UtilsService.isEmpty(newValue)) {
                  lostChangeValue = 'Removed Interaction Customizations';
                } else {
                  lostChangeValue = 'Edited Interaction Customizations';
                }
                stateWiseEditsMapping[stateName].push(
                  angular.element('<div></div>').html(lostChangeValue)
                    .addClass('state-edit-desc'));
                break;

              case 'answer_groups':
                var answerGroupChanges = getRelativeChangeToGroups(lostChange);
                var answerGroupHtml = '';
                if (answerGroupChanges === 'added') {
                  answerGroupHtml += (
                    '<p class="sub-edit"><i>Destination: </i>' +
                      newValue.outcome.dest + '</p>');
                  answerGroupHtml += (
                    '<div class="sub-edit"><i>Feedback: </i>' +
                      '<div class="feedback">' +
                      newValue.outcome.feedback.getHtml() + '</div></div>');
                  var rulesList = makeRulesListHumanReadable(newValue);
                  if (rulesList.length > 0) {
                    answerGroupHtml += '<p class="sub-edit"><i>Rules: </i></p>';
                    var rulesListHtml = (
                      angular.element('<ol></ol>').addClass('rules-list'));
                    for (var rule in rulesList) {
                      rulesListHtml.html(rulesList[rule][0].outerHTML);
                    }
                    answerGroupHtml += rulesListHtml[0].outerHTML;
                  }
                  stateWiseEditsMapping[stateName].push(
                    angular.element('<div><strong>Added answer group: ' +
                                    '</strong></div>')
                      .append(answerGroupHtml)
                      .addClass('state-edit-desc answer-group'));
                } else if (answerGroupChanges === 'edited') {
                  if (newValue.outcome.dest !== oldValue.outcome.dest) {
                    answerGroupHtml += (
                      '<p class="sub-edit"><i>Destination: </i>' +
                        newValue.outcome.dest + '</p>');
                  }
                  if (!angular.equals(
                    newValue.outcome.feedback.getHtml(),
                    oldValue.outcome.feedback.getHtml())) {
                    answerGroupHtml += (
                      '<div class="sub-edit"><i>Feedback: </i>' +
                        '<div class="feedback">' +
                        newValue.outcome.feedback.getHtml() +
                        '</div></div>');
                  }
                  if (!angular.equals(newValue.rules, oldValue.rules)) {
                    var rulesList = makeRulesListHumanReadable(newValue);
                    if (rulesList.length > 0) {
                      answerGroupHtml += (
                        '<p class="sub-edit"><i>Rules: </i></p>');
                      var rulesListHtml = (angular.element('<ol></ol>')
                        .addClass('rules-list'));
                      for (var rule in rulesList) {
                        rulesListHtml.html(rulesList[rule][0].outerHTML);
                      }
                      answerGroupChanges = rulesListHtml[0].outerHTML;
                    }
                  }
                  stateWiseEditsMapping[stateName].push(
                    angular.element(
                      '<div><strong>Edited answer group: <strong>' +
                        '</div>')
                      .append(answerGroupHtml)
                      .addClass('state-edit-desc answer-group'));
                } else if (answerGroupChanges === 'deleted') {
                  stateWiseEditsMapping[stateName].push(
                    angular.element('<div>Deleted answer group</div>')
                      .addClass('state-edit-desc'));
                }
                break;

              case 'default_outcome':
                var defaultOutcomeChanges = getRelativeChangeToGroups(
                  lostChange);
                var defaultOutcomeHtml = '';
                if (defaultOutcomeChanges === 'added') {
                  defaultOutcomeHtml += (
                    '<p class="sub-edit"><i>Destination: </i>' +
                      newValue.dest + '</p>');
                  defaultOutcomeHtml += (
                    '<div class="sub-edit"><i>Feedback: </i>' +
                      '<div class="feedback">' + newValue.feedback.getHtml() +
                      '</div></div>');
                  stateWiseEditsMapping[stateName].push(
                    angular.element('<div>Added default outcome: </div>')
                      .append(defaultOutcomeHtml)
                      .addClass('state-edit-desc default-outcome'));
                } else if (defaultOutcomeChanges === 'edited') {
                  if (newValue.dest !== oldValue.dest) {
                    defaultOutcomeHtml += (
                      '<p class="sub-edit"><i>Destination: </i>' +
                      newValue.dest +
                      '</p>');
                  }
                  if (!angular.equals(newValue.feedback.getHtml(),
                    oldValue.feedback.getHtml())) {
                    defaultOutcomeHtml += (
                      '<div class="sub-edit"><i>Feedback: </i>' +
                        '<div class="feedback">' + newValue.feedback +
                        '</div></div>');
                  }
                  stateWiseEditsMapping[stateName].push(
                    angular.element('<div>Edited default outcome: </div>')
                      .append(defaultOutcomeHtml)
                      .addClass('state-edit-desc default-outcome'));
                } else if (defaultOutcomeChanges === 'deleted') {
                  stateWiseEditsMapping[stateName].push(
                    angular.element('<div>Deleted default outcome</div>')
                      .addClass('state-edit-desc'));
                }
            }
        }
      });

      for (var stateName in stateWiseEditsMapping) {
        var stateChangesEl = angular.element(
          '<li>Edits to state: ' + stateName + '</li>');
        for (var stateEdit in stateWiseEditsMapping[stateName]) {
          stateChangesEl.append(stateWiseEditsMapping[stateName][stateEdit]);
        }
        outerHtml.append(stateChangesEl);
      }

      return outerHtml;
    };

    return {
      makeHumanReadable: function(lostChanges) {
        try {
          return makeHumanReadable(lostChanges);
        } catch (e) {
          return angular.element(
            '<div>Error: Could not recover lost changes.</div>');
        }
      }
    };
  }]
);
