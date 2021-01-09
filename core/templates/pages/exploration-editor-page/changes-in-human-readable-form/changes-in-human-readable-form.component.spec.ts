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
 * @fileoverview Unit tests for ChangesInHumanReadableForm directive.
*/

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.
import { TranslatorProviderForTests } from 'tests/test.extras';

// This function is a helper to clean the compiled html for each test, in
// order to make a cleaner assertion.
var cleanCompiledHtml = function(html) {
  return html
    // AngularJS uses comments in some directives in order to figure out
    // where the last element was placed in relation.
    // Ref: https://github.com/angular/angular.js/issues/8722.
    .replace(/<!---->/g, '')
    // Removes all ng-content elements.
    .replace(/<(ng-content|\/ng-content).*>/g, '')
    // Removes all ng-repeat directives that is not the last attribute
    // described in an element.
    .replace(/(ng-repeat=".*"\s)/g, '')
    // Removes all ng-repeat directives that is the last attribute
    // described in an element.
    .replace(/\sng-repeat=".*"/g, '')
    // Removes all ng-if directives that is not the last attribute
    // described in an element.
    .replace(/(ng-if=".*"\s)/g, '')
    // Removes all ng-if directives that is the last attribute
    // described in an element.
    .replace(/\sng-if=".*"/g, '')
    // Removes all ng-show directives that is not the last attribute
    // described in an element.
    .replace(/ng-show=".*"\s/g, '')
    // Removes all ng-show directives that is the last attribute
    // described in an element.
    .replace(/\sng-show=".*"/g, '')
    // Removes all ng-switch directives that is the last attribute
    // described in an element.
    .replace(/ng-switch=".*"\s/, '')
    // Removes all ng-switch directives that is the last attribute
    // described in an element.
    .replace(/\sng-switch=".*"/, '')
    // Removes all ng-switch-when directives that is not the last attribute
    // described in an element.
    .replace(/ng-switch-when=".*"\s/, '')
    // Removes all ng-switch-when directives that is the last attribute
    // described in an element.
    .replace(/\sng-switch-when=".*"/, '')
    // Removes all ng-bind-html directives that is not the last attribute
    // described in an element.
    .replace(/ng-bind-html=".*"\s/, '')
    // Removes all ng-bind-html directives that is the last attribute
    // described in an element.
    .replace(/\sng-bind-html=".*"/, '')
    // Removes all indentation spaces.
    .replace(/\s{2,}/g, '')
    // Removes all line breaks.
    .replace(/\n/g, '');
};

describe('Changes in Human Readable Form Directive', function() {
  var $compile = null;
  var scope = null;
  var LostChangeObjectFactory = null;
  var OutcomeObjectFactory = null;

  beforeEach(angular.mock.module('directiveTemplates'));
  beforeEach(
    angular.mock.module('oppia', TranslatorProviderForTests));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector, $rootScope, _$compile_) {
    $compile = _$compile_;
    scope = $rootScope.$new();
    LostChangeObjectFactory = $injector.get('LostChangeObjectFactory');
    OutcomeObjectFactory = $injector.get('OutcomeObjectFactory');
  }));

  it('should make human readable when adding a state', function() {
    scope.lostChanges = [LostChangeObjectFactory.createNew({
      cmd: 'add_state',
      state_name: 'State name',
    })];

    var element = angular.element(
      '<changes-in-human-readable-form lost-changes="lostChanges">' +
      '</changes-in-human-readable-form>');
    var elementCompiled = $compile(element)(scope);
    scope.$digest();

    var html = cleanCompiledHtml(elementCompiled.html());
    expect(html).toBe(
      '<div class="oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<span>Added state: ' + scope.lostChanges[0].stateName + '</span>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when renaming a state', function() {
    scope.lostChanges = [LostChangeObjectFactory.createNew({
      cmd: 'rename_state',
      old_state_name: 'Old state name',
      new_state_name: 'New state name'
    })];

    var element = angular.element(
      '<changes-in-human-readable-form lost-changes="lostChanges">' +
      '</changes-in-human-readable-form>');
    var elementCompiled = $compile(element)(scope);
    scope.$digest();

    var html = cleanCompiledHtml(elementCompiled.html());
    expect(html).toBe(
      '<div class="oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<span>Renamed state: ' + scope.lostChanges[0].oldStateName +
      ' to ' + scope.lostChanges[0].newStateName + '</span>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when deleting a state', function() {
    scope.lostChanges = [LostChangeObjectFactory.createNew({
      cmd: 'delete_state',
      state_name: 'Deleted state name'
    })];

    var element = angular.element(
      '<changes-in-human-readable-form lost-changes="lostChanges">' +
      '</changes-in-human-readable-form>');
    var elementCompiled = $compile(element)(scope);
    scope.$digest();

    var html = cleanCompiledHtml(elementCompiled.html());
    expect(html).toBe(
      '<div class="oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<span>Deleted state: ' + scope.lostChanges[0].stateName + '</span>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property content',
    function() {
      scope.lostChanges = [LostChangeObjectFactory.createNew({
        cmd: 'edit_state_property',
        state_name: 'Edited state name',
        new_value: {
          html: 'newValue'
        },
        old_value: {
          html: 'oldValue'
        },
        property_name: 'content'
      })];

      var element = angular.element(
        '<changes-in-human-readable-form lost-changes="lostChanges">' +
        '</changes-in-human-readable-form>');
      var elementCompiled = $compile(element)(scope);
      scope.$digest();

      var html = cleanCompiledHtml(elementCompiled.html());
      expect(html).toBe(
        '<div class="oppia-lost-changes">' +
        '<ul>' +
        '<li>' +
        '<div>' +
        'Edits to state: ' + scope.lostChanges[0].stateName +
        '<div>' +
        '<div class="state-edit-desc">' +
        '<strong>Edited content: </strong>' +
        '<div class="content">' + scope.lostChanges[0].newValue.html +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</li>' +
        '</ul>' +
        '</div>'
      );
    });

  it('should make human readable when editing a state with property' +
  ' widget_id and exploration ended', function() {
    scope.lostChanges = [LostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: 'EndExploration',
      old_value: null,
      property_name: 'widget_id'
    })];

    var element = angular.element(
      '<changes-in-human-readable-form lost-changes="lostChanges">' +
      '</changes-in-human-readable-form>');
    var elementCompiled = $compile(element)(scope);
    scope.$digest();

    var html = cleanCompiledHtml(elementCompiled.html());
    expect(html).toBe(
      '<div class="oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      'Edits to state: ' + scope.lostChanges[0].stateName +
      '<div class="state-edit-desc">' +
      '<span>Ended Exploration</span>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
    ' widget_id and an interaction is added', function() {
    scope.lostChanges = [LostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: 'Exploration',
      old_value: null,
      property_name: 'widget_id'
    })];

    var element = angular.element(
      '<changes-in-human-readable-form lost-changes="lostChanges">' +
      '</changes-in-human-readable-form>');
    var elementCompiled = $compile(element)(scope);
    scope.$digest();

    var html = cleanCompiledHtml(elementCompiled.html());
    expect(html).toBe(
      '<div class="oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      'Edits to state: ' + scope.lostChanges[0].stateName +
      '<div class="state-edit-desc">' +
      '<span>' +
      '<strong>Added Interaction: </strong>' + scope.lostChanges[0].newValue +
      '</span>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
    ' widget_id and an interaction is deleted', function() {
    scope.lostChanges = [LostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: null,
      old_value: 'EndExploration',
      property_name: 'widget_id'
    })];

    var element = angular.element(
      '<changes-in-human-readable-form lost-changes="lostChanges">' +
      '</changes-in-human-readable-form>');
    var elementCompiled = $compile(element)(scope);
    scope.$digest();

    var html = cleanCompiledHtml(elementCompiled.html());
    expect(html).toBe(
      '<div class="oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      'Edits to state: ' + scope.lostChanges[0].stateName +
      '<div class="state-edit-desc">' +
      '<span>' +
      '<strong>Deleted Interaction: </strong>' +
      scope.lostChanges[0].oldValue +
      '</span>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' widget_customization_args and an interaction is added', function() {
    scope.lostChanges = [LostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {
        property1: true
      },
      old_value: {},
      property_name: 'widget_customization_args'
    })];

    var element = angular.element(
      '<changes-in-human-readable-form lost-changes="lostChanges">' +
      '</changes-in-human-readable-form>');
    var elementCompiled = $compile(element)(scope);
    scope.$digest();

    var html = cleanCompiledHtml(elementCompiled.html());
    expect(html).toBe(
      '<div class="oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      'Edits to state: ' + scope.lostChanges[0].stateName +
      '<div class="state-edit-desc">' +
      '<span>Added Interaction Customizations</span>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' widget_customization_args and an interaction is removed', function() {
    scope.lostChanges = [LostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {},
      old_value: {
        property1: true
      },
      property_name: 'widget_customization_args'
    })];

    var element = angular.element(
      '<changes-in-human-readable-form lost-changes="lostChanges">' +
      '</changes-in-human-readable-form>');
    var elementCompiled = $compile(element)(scope);
    scope.$digest();

    var html = cleanCompiledHtml(elementCompiled.html());
    expect(html).toBe(
      '<div class="oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      'Edits to state: ' + scope.lostChanges[0].stateName +
      '<div class="state-edit-desc">' +
      '<span>Removed Interaction Customizations</span>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' widget_customization_args and an interaction is edited', function() {
    scope.lostChanges = [LostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {
        property1: true
      },
      old_value: {
        property1: true
      },
      property_name: 'widget_customization_args'
    })];

    var element = angular.element(
      '<changes-in-human-readable-form lost-changes="lostChanges">' +
      '</changes-in-human-readable-form>');
    var elementCompiled = $compile(element)(scope);
    scope.$digest();

    var html = cleanCompiledHtml(elementCompiled.html());
    expect(html).toBe(
      '<div class="oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>' +
      'Edits to state: ' + scope.lostChanges[0].stateName +
      '<div class="state-edit-desc">' +
      '<span>Edited Interaction Customizations</span>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' answer_groups and a change is added', function() {
    scope.lostChanges = [LostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {
        outcome: OutcomeObjectFactory.createFromBackendDict({
          dest: 'outcome 2',
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
        }),
        rules: [{
          type: 'Type1',
          inputs: {
            input1: 'input1',
            input2: 'input2'
          }
        }]
      },
      old_value: {},
      property_name: 'answer_groups'
    })];

    var element = angular.element(
      '<changes-in-human-readable-form lost-changes="lostChanges">' +
      '</changes-in-human-readable-form>');
    var elementCompiled = $compile(element)(scope);
    scope.$digest();

    var html = cleanCompiledHtml(elementCompiled.html());
    expect(html).toBe(
      '<div class="oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>Edits to state: ' + scope.lostChanges[0].stateName +
      '<div>' +
      '<div class="state-edit-desc answer-group">' +
      '<strong>Added answer group: </strong>' +
      '<p class="sub-edit"><i>Destination: </i>' +
      scope.lostChanges[0].newValue.outcome.dest + '</p>' +
      '<div class="sub-edit"><i>Feedback: </i>' +
      '<div class="feedback">' +
      scope.lostChanges[0].newValue.outcome.feedback.html +
      '</div>' +
      '</div>' +
      '<div class="sub-edit"><i>Rules: </i>' +
      '<ol class="rules-list">' +
      '<li>' +
      '<p>Type: ' + scope.lostChanges[0].newValue.rules[0].type + '</p>' +
      '<p>Value:<span> </span>' +
      Object.keys(scope.lostChanges[0].newValue.rules[0].inputs).toString() +
      '</p>' +
      '</li>' +
      '</ol>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' answer_groups and a change is edited', function() {
    scope.lostChanges = [LostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {
        outcome: OutcomeObjectFactory.createFromBackendDict({
          dest: 'outcome 2',
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
        }),
        rules: [{
          type: 'Type1',
          inputs: {
            input1: 'input1',
            input2: 'input2'
          }
        }]
      },
      old_value: {
        outcome: OutcomeObjectFactory.createFromBackendDict({
          dest: 'outcome 1',
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
        }),
        rules: [{
          type: 'Type1',
          inputs: {
            input1: 'input1',
            input2: 'input2'
          }
        }]
      },
      property_name: 'answer_groups'
    })];

    var element = angular.element(
      '<changes-in-human-readable-form lost-changes="lostChanges">' +
      '</changes-in-human-readable-form>');
    var elementCompiled = $compile(element)(scope);
    scope.$digest();

    var html = cleanCompiledHtml(elementCompiled.html());
    expect(html).toBe(
      '<div class="oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>Edits to state: ' + scope.lostChanges[0].stateName +
      '<div>' +
      '<div class="state-edit-desc answer-group">' +
      '<strong>Edited answer group: </strong>' +
      '<p class="sub-edit"><i>Destination: </i>' +
      scope.lostChanges[0].newValue.outcome.dest + '</p>' +
      '<div class="sub-edit"><i>Feedback: </i>' +
      '<div class="feedback">' +
      scope.lostChanges[0].newValue.outcome.feedback.html +
      '</div>' +
      '</div>' +
      '<div class="sub-edit"><i>Rules: </i>' +
      '<ol class="rules-list">' +
      '<li>' +
      '<p>Type: ' + scope.lostChanges[0].newValue.rules[0].type + '</p>' +
      '<p>Value:<span> </span>' +
      Object.keys(scope.lostChanges[0].newValue.rules[0].inputs).toString() +
      '</p>' +
      '</li>' +
      '</ol>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' answer_groups and a change is deleted', function() {
    scope.lostChanges = [LostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {},
      old_value: {
        outcome: OutcomeObjectFactory.createFromBackendDict({
          dest: 'outcome 1',
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
        }),
        rules: [{
          type: 'Type1',
          inputs: {
            input1: 'input1',
            input2: 'input2'
          }
        }]
      },
      property_name: 'answer_groups'
    })];

    var element = angular.element(
      '<changes-in-human-readable-form lost-changes="lostChanges">' +
      '</changes-in-human-readable-form>');
    var elementCompiled = $compile(element)(scope);
    scope.$digest();

    var html = cleanCompiledHtml(elementCompiled.html());
    expect(html).toBe(
      '<div class="oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>Edits to state: ' + scope.lostChanges[0].stateName +
      '<div>' +
      '<div class="state-edit-desc">' +
      'Deleted answer group' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' default_outcome and a change is added', function() {
    scope.lostChanges = [LostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: OutcomeObjectFactory.createFromBackendDict({
        dest: 'outcome 2',
        feedback: {
          content_id: 'feedback_2',
          html: 'Html'
        },
      }),
      old_value: {},
      property_name: 'default_outcome'
    })];

    var element = angular.element(
      '<changes-in-human-readable-form lost-changes="lostChanges">' +
      '</changes-in-human-readable-form>');
    var elementCompiled = $compile(element)(scope);
    scope.$digest();

    var html = cleanCompiledHtml(elementCompiled.html());
    expect(html).toBe(
      '<div class="oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>Edits to state: ' + scope.lostChanges[0].stateName +
      '<div>' +
      '<div class="state-edit-desc default-outcome">' +
      'Added default outcome:' +
      '<p class="sub-edit"><i>Destination: </i>' +
      scope.lostChanges[0].newValue.dest + '</p>' +
      '<div class="sub-edit"><i>Feedback: </i>' +
      '<div class="feedback">' +
      scope.lostChanges[0].newValue.feedback.html +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' default_outcome and a change is edited', function() {
    scope.lostChanges = [LostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: OutcomeObjectFactory.createFromBackendDict({
        dest: 'outcome 2',
        feedback: {
          content_id: 'feedback_2',
          html: 'Html'
        },
      }),
      old_value: OutcomeObjectFactory.createFromBackendDict({
        dest: 'outcome 1',
        feedback: {
          content_id: 'feedback_2',
          html: 'Html'
        },
      }),
      property_name: 'default_outcome'
    })];

    var element = angular.element(
      '<changes-in-human-readable-form lost-changes="lostChanges">' +
      '</changes-in-human-readable-form>');
    var elementCompiled = $compile(element)(scope);
    scope.$digest();

    var html = cleanCompiledHtml(elementCompiled.html());
    expect(html).toBe(
      '<div class="oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>Edits to state: ' + scope.lostChanges[0].stateName +
      '<div>' +
      '<div class="state-edit-desc default-outcome">' +
      'Edited default outcome:' +
      '<p class="sub-edit"><i>Destination: </i>' +
      scope.lostChanges[0].newValue.dest + '</p>' +
      '<div class="sub-edit"><i>Feedback: </i>' +
      '<div class="feedback">' +
      scope.lostChanges[0].newValue.feedback.html +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });

  it('should make human readable when editing a state with property' +
  ' default_outcome and a change is deleted', function() {
    scope.lostChanges = [LostChangeObjectFactory.createNew({
      cmd: 'edit_state_property',
      state_name: 'Edited state name',
      new_value: {},
      old_value: {
        outcome: OutcomeObjectFactory.createFromBackendDict({
          dest: 'outcome 1',
          feedback: {
            content_id: 'feedback_2',
            html: 'Html'
          },
        }),
        rules: [{
          type: 'Type1',
          inputs: {
            input1: 'input1',
            input2: 'input2'
          }
        }]
      },
      property_name: 'default_outcome'
    })];

    var element = angular.element(
      '<changes-in-human-readable-form lost-changes="lostChanges">' +
      '</changes-in-human-readable-form>');
    var elementCompiled = $compile(element)(scope);
    scope.$digest();

    var html = cleanCompiledHtml(elementCompiled.html());
    expect(html).toBe(
      '<div class="oppia-lost-changes">' +
      '<ul>' +
      '<li>' +
      '<div>Edits to state: ' + scope.lostChanges[0].stateName +
      '<div>' +
      '<div class="state-edit-desc">' +
      'Deleted default outcome' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</li>' +
      '</ul>' +
      '</div>'
    );
  });
});
