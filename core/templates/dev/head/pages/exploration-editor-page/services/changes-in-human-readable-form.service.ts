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

import { DOCUMENT } from '@angular/common';
import { downgradeInjectable } from '@angular/upgrade/static';
import { Inject, Injectable } from '@angular/core';

import isEqual from 'lodash/isEqual';

import { UtilsService } from 'services/utils.service';

@Injectable({
  providedIn: 'root'
})
export class ChangesInHumanReadableFormService {
  CMD_ADD_STATE = 'add_state';
  CMD_RENAME_STATE = 'rename_state';
  CMD_DELETE_STATE = 'delete_state';
  CMD_EDIT_STATE_PROPERTY = 'edit_state_property';

  constructor(private utilsService: UtilsService,
              @Inject(DOCUMENT) private document: any) {}
  // TODO(#7176): Replace 'any' with the exact type.
  makeRulesListHumanReadable(answerGroupValue: any): Array<HTMLElement> {
    let rulesList = [];
    answerGroupValue.rules.forEach((rule) => {
      let ruleElm = this.document.createElement('<li></li>');
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
  }

  // An edit is represented either as an object or an array. If it's an
  // object, then simply return that object. In case of an array, return
  // the last item.
  // TODO(#7176): Replace 'any' with the exact type.
  getStatePropertyValue(statePropertyValue: Array<string> | Object): any {
    return Array.isArray(statePropertyValue) ?
        statePropertyValue[statePropertyValue.length - 1] : statePropertyValue;
  }

  // Detects whether an object of the type 'answer_group' or
  // 'default_outcome' has been added, edited or deleted.
  // Returns - 'addded', 'edited' or 'deleted' accordingly.
  // TODO(#7176): Replace 'any' with the exact type.
  getRelativeChangeToGroups(changeObject: any): string {
    let newValue = changeObject.new_value;
    let oldValue = changeObject.old_value;
    let result = '';

    if (Array.isArray(newValue) && Array.isArray(oldValue)) {
      result = (newValue.length > oldValue.length) ?
          'added' : (newValue.length === oldValue.length) ?
              'edited' : 'deleted';
    } else {
      if (!this.utilsService.isEmpty(oldValue)) {
        if (!this.utilsService.isEmpty(newValue)) {
          result = 'edited';
        } else {
          result = 'deleted';
        }
      } else if (!this.utilsService.isEmpty(newValue)) {
        result = 'added';
      }
    }
    return result;
  }
  // TODO(#7176): Replace 'any' with the exact type.
  _makeHumanReadable(lostChanges: Array<any>): HTMLElement {
    let outerHtml = this.document.createElement('<ul></ul>');
    let stateWiseEditsMapping = {};
    // The letiable stateWiseEditsMapping stores the edits grouped by state.
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
    // TODO(#7176): Replace 'any' with the exact type.
    lostChanges.forEach((lostChange: any) => {
      switch (lostChange.cmd) {
        case this.CMD_ADD_STATE:
          outerHtml.append(
            this.document.createElement('<li></li>').html(
              'Added state: ' + lostChange.state_name));
          break;
        case this.CMD_RENAME_STATE:
          outerHtml.append(
            this.document.createElement('<li></li>').html(
              'Renamed state: ' + lostChange.old_state_name + ' to ' +
                  lostChange.new_state_name));
          break;
        case this.CMD_DELETE_STATE:
          outerHtml.append(
            this.document.createElement('<li></li>').html(
              'Deleted state: ' + lostChange.state_name));
          break;
        case this.CMD_EDIT_STATE_PROPERTY: {
          let newValue = this.getStatePropertyValue(lostChange.new_value);
          let oldValue = this.getStatePropertyValue(lostChange.old_value);
          let stateName = lostChange.state_name;
          if (!stateWiseEditsMapping[stateName]) {
            stateWiseEditsMapping[stateName] = [];
          }

          switch (lostChange.property_name) {
            case 'content':
              if (newValue !== null) {
                // TODO(sll): Also add display of audio translations here.
                stateWiseEditsMapping[stateName].push(
                  this.document.createElement('<div></div>').html(
                    '<strong>Edited content: </strong><div class="content">' +
                        newValue.html + '</div>')
                    .addClass('state-edit-desc'));
              }
              break;

            case 'widget_id': {
              let lostChangeValue = '';
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
                this.document.createElement('<div></div>').html(lostChangeValue)
                  .addClass('state-edit-desc'));
              break;}

            case 'widget_customization_args': {
              let lostChangeValue = '';
              if (this.utilsService.isEmpty(oldValue)) {
                lostChangeValue = 'Added Interaction Customizations';
              } else if (this.utilsService.isEmpty(newValue)) {
                lostChangeValue = 'Removed Interaction Customizations';
              } else {
                lostChangeValue = 'Edited Interaction Customizations';
              }
              stateWiseEditsMapping[stateName].push(
                this.document.createElement('<div></div>').html(lostChangeValue)
                  .addClass('state-edit-desc'));
              break;
            }

            case 'answer_groups': {
              let answerGroupChanges = this.getRelativeChangeToGroups(
                lostChange);
              let answerGroupHtml = '';
              if (answerGroupChanges === 'added') {
                answerGroupHtml += (
                  '<p class="sub-edit"><i>Destination: </i>' +
                    newValue.outcome.dest + '</p>');
                answerGroupHtml += (
                  '<div class="sub-edit"><i>Feedback: </i>' +
                    '<div class="feedback">' +
                    newValue.outcome.feedback.getHtml() + '</div></div>');
                let rulesList = this.makeRulesListHumanReadable(newValue);
                if (rulesList.length > 0) {
                  answerGroupHtml += '<p class="sub-edit"><i>Rules: </i></p>';
                  let rulesListHtml = (
                    this.document.createElement(
                      '<ol></ol>').addClass('rules-list'));
                  for (let rule in rulesList) {
                    rulesListHtml.html(rulesList[rule][0].outerHTML);
                  }
                  answerGroupHtml += rulesListHtml[0].outerHTML;
                }
                stateWiseEditsMapping[stateName].push(
                  this.document.createElement(
                    '<div><strong>Added answer group: ' + '</strong></div>')
                    .append(answerGroupHtml)
                    .addClass('state-edit-desc answer-group'));
              } else if (answerGroupChanges === 'edited') {
                if (newValue.outcome.dest !== oldValue.outcome.dest) {
                  answerGroupHtml += (
                    '<p class="sub-edit"><i>Destination: </i>' +
                      newValue.outcome.dest + '</p>');
                }
                if (isEqual(
                  newValue.outcome.feedback.getHtml(),
                  oldValue.outcome.feedback.getHtml())) {
                  answerGroupHtml += (
                    '<div class="sub-edit"><i>Feedback: </i>' +
                      '<div class="feedback">' +
                      newValue.outcome.feedback.getHtml() +
                      '</div></div>');
                }
                if (isEqual(newValue.rules, oldValue.rules)) {
                  let rulesList = this.makeRulesListHumanReadable(newValue);
                  if (rulesList.length > 0) {
                    answerGroupHtml += (
                      '<p class="sub-edit"><i>Rules: </i></p>');
                    let rulesListHtml = (this.document.createElement(
                      '<ol></ol>').addClass('rules-list'));
                    for (let rule in rulesList) {
                      rulesListHtml.html(rulesList[rule][0].outerHTML);
                    }
                    answerGroupChanges = rulesListHtml[0].outerHTML;
                  }
                }
                stateWiseEditsMapping[stateName].push(
                  this.document.createElement(
                    '<div><strong>Edited answer group: <strong>' +
                        '</div>')
                    .append(answerGroupHtml)
                    .addClass('state-edit-desc answer-group'));
              } else if (answerGroupChanges === 'deleted') {
                stateWiseEditsMapping[stateName].push(
                  this.document.createElement('<div>Deleted answer group</div>')
                    .addClass('state-edit-desc'));
              }
              break;
            }

            case 'default_outcome': {
              let defaultOutcomeChanges = this.getRelativeChangeToGroups(
                lostChange);
              let defaultOutcomeHtml = '';
              if (defaultOutcomeChanges === 'added') {
                defaultOutcomeHtml += (
                  '<p class="sub-edit"><i>Destination: </i>' +
                    newValue.dest + '</p>');
                defaultOutcomeHtml += (
                  '<div class="sub-edit"><i>Feedback: </i>' +
                    '<div class="feedback">' + newValue.feedback.getHtml() +
                    '</div></div>');
                stateWiseEditsMapping[stateName].push(
                  this.document.createElement(
                    '<div>Added default outcome: </div>')
                    .append(defaultOutcomeHtml)
                    .addClass('state-edit-desc default-outcome'));
              } else if (defaultOutcomeChanges === 'edited') {
                if (newValue.dest !== oldValue.dest) {
                  defaultOutcomeHtml += (
                    '<p class="sub-edit"><i>Destination: </i>' +
                      newValue.dest +
                      '</p>');
                }
                if (isEqual(newValue.feedback.getHtml(),
                  oldValue.feedback.getHtml())) {
                  defaultOutcomeHtml += (
                    '<div class="sub-edit"><i>Feedback: </i>' +
                      '<div class="feedback">' + newValue.feedback +
                      '</div></div>');
                }
                stateWiseEditsMapping[stateName].push(
                  this.document.createElement(
                    '<div>Edited default outcome: </div>')
                    .append(defaultOutcomeHtml)
                    .addClass('state-edit-desc default-outcome'));
              } else if (defaultOutcomeChanges === 'deleted') {
                stateWiseEditsMapping[stateName].push(
                  this.document.createElement(
                    '<div>Deleted default outcome</div>')
                    .addClass('state-edit-desc'));
              }
            }
          }
        }
      }
    });

    for (let stateName in stateWiseEditsMapping) {
      let stateChangesEl = this.document.createElement(
        '<li>Edits to state: ' + stateName + '</li>');
      for (let stateEdit in stateWiseEditsMapping[stateName]) {
        stateChangesEl.append(stateWiseEditsMapping[stateName][stateEdit]);
      }
      outerHtml.append(stateChangesEl);
    }

    return outerHtml;
  }


  makeHumanReadable(lostChanges: Array<any>): HTMLElement {
    try {
      return this._makeHumanReadable(lostChanges);
    } catch (e) {
      return this.document.createElement(
        '<div>Error: Could not recover lost changes.</div>');
    }
  }
}


angular.module('oppia').factory(
  'ChangesInHumanReadableFormService',
  downgradeInjectable(ChangesInHumanReadableFormService));
