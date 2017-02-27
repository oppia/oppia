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
 * @fileoverview Unit tests for the SimpleEditorShimService.js
 */
describe('Simple Editor Shim Service', function() {
  var currentStateName;
  var srv;
  var titleMemento;
  var states;
  var stubs;

  beforeEach(function() {
    currentStateName = 'state1';
    srv = null;
    titleMemento = 'SampleTitle';
    states = {
      state1: {
        name: 'state1',
        content: [
          {
            value: 'introduction HTML for state1'
          }, {
            value: 'st1html1'
          }, {
            value: 'st1html2'
          }
        ]
      },
      state2: {
        name: 'state2',
        content: [
          {
            value: 'introduction HTML for state2'
          }, {
            value: 'st2html1'
          }, {
            value: 'st2html2'
          }
        ]
      }
    };

    stubs = {
      explorationTitleService: {
        savedMemento: titleMemento,
        displayed: titleMemento,
        saveDisplayedValue: function() { }
      },
      explorationInitStateNameService: {
        savedMemento: currentStateName
      },
      explorationStatesService: {
        getState: function(stateName) {
          return states[stateName];
        },
        getStates: function() {
          return states;
        },
        saveStateContent: function() { },
        saveInteractionId: function() { },
        saveInteractionCustomizationArgs: function() { },
        saveInteractionAnswerGroups: function() { },
        saveInteractionDefaultOutcome: function() { },
        addState: function() { }
      }
    };

    module('oppia');
    module(function($provide) {
      $provide.value('explorationTitleService', stubs.explorationTitleService);
      $provide.value(
        'explorationInitStateNameService',
        stubs.explorationInitStateNameService);
      $provide.value('explorationStatesService',
        stubs.explorationStatesService);
    });
  });

  beforeEach(inject(function($injector) {
    srv = $injector.get('SimpleEditorShimService');
  }));

  beforeEach(function() {
    spyOn(stubs.explorationTitleService, 'saveDisplayedValue');
    spyOn(stubs.explorationStatesService, 'saveStateContent');
    spyOn(stubs.explorationStatesService, 'saveInteractionId');
    spyOn(stubs.explorationStatesService, 'saveInteractionCustomizationArgs');
    spyOn(stubs.explorationStatesService, 'saveInteractionAnswerGroups');
    spyOn(stubs.explorationStatesService, 'saveInteractionDefaultOutcome');
    spyOn(stubs.explorationStatesService, 'addState');
  });

  it('should return title', function() {
    var title = srv.getTitle();
    expect(title).toEqual(titleMemento);
  });

  it('should return Introduction HTML', function() {
    var html = srv.getIntroductionHtml();
    expect(html).toEqual(states[currentStateName].content[0].value);
  });

  it('should return current State Name', function() {
    var name = srv.getInitStateName();
    expect(name).toEqual(currentStateName);
  });

  it('should return all state names', function() {
    var names = srv.getAllStateNames();
    expect(names).toEqual(Object.keys(states));
  });

  it('should return the given state', function() {
    var givenState = currentStateName;
    var state = srv.getState(givenState);
    expect(state).toEqual(states[givenState]);
  });

  it('should return Content HTML for given state', function() {
    var givenState = currentStateName;
    var html = srv.getContentHtml(givenState);
    expect(html).toEqual(states[givenState].content[0].value);
  });

  it('should change the displayed title and should save it', function() {
    var newTitle = 'NewTitle';
    srv.saveTitle(newTitle);
    expect(stubs.explorationTitleService.displayed).toEqual(newTitle);
    expect(stubs.explorationTitleService.saveDisplayedValue)
      .toHaveBeenCalled();
  });

  it('should save the introduction HTML', function() {
    var newIntroductionHtml = 'This is the new Introduction HTML';
    var stateNewContent = [{
      type: 'text',
      value: newIntroductionHtml
    }];
    srv.saveIntroductionHtml(newIntroductionHtml);
    expect(stubs.explorationStatesService.saveStateContent)
      .toHaveBeenCalledWith(currentStateName, stateNewContent);
  });

  it('should save the interaction ID', function() {
    var newInteractionID = 'MultipleChoiceInput';
    var stateName = currentStateName;
    srv.saveInteractionId(stateName, newInteractionID);
    expect(stubs.explorationStatesService.saveInteractionId)
      .toHaveBeenCalledWith(stateName, newInteractionID);
  });

  it('should save the Customization Args', function() {
    var newCustomizationArgs = {
      choices: {
        value: ['<p>Option 1</p>', '<p>Option 1</p>']
      }
    };
    var stateName = currentStateName;
    srv.saveCustomizationArgs(stateName, newCustomizationArgs);
    expect(stubs.explorationStatesService.saveInteractionCustomizationArgs)
      .toHaveBeenCalledWith(stateName, newCustomizationArgs);
  });

  it('should save the Answer Groups', function() {
    var newAnswerGroups = [{
      outcome: {
        dest: 'Question 2',
        feedback: ['<p>6 is 3 times 2</p>'],
        param_changes: []
      },
      rule_specs: [{
        inputs: {
          x: 0
        },
        rule_type: 'Equals'
      }]
    }];
    var stateName = currentStateName;
    srv.saveAnswerGroups(stateName, newAnswerGroups);
    expect(stubs.explorationStatesService.saveInteractionAnswerGroups)
      .toHaveBeenCalledWith(stateName, newAnswerGroups);
  });

  it('should save the Default Outcome', function() {
    var newDefaultOutcome = {
      dest: 'Question 1',
      feedback: ['<p>7 is not 3 times 2</p>'],
      param_changes: []
    };
    var stateName = currentStateName;
    srv.saveDefaultOutcome(stateName, newDefaultOutcome);
    expect(stubs.explorationStatesService.saveInteractionDefaultOutcome)
      .toHaveBeenCalledWith(stateName, newDefaultOutcome);
  });

  it('should save the Bridge HTML', function() {
    var newHtml = 'This is the new HTML';
    var bridgeNewContent = [{
      type: 'text',
      value: newHtml
    }];
    var stateName = currentStateName;
    srv.saveBridgeHtml(stateName, newHtml);
    expect(stubs.explorationStatesService.saveStateContent)
      .toHaveBeenCalledWith(stateName, bridgeNewContent);
  });

  it('should add new state', function() {
    var newStateName = 'newState';
    srv.addState(newStateName);
    expect(stubs.explorationStatesService.addState)
      .toHaveBeenCalledWith(newStateName);
  });
});
