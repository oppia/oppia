// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview AngularHtmlBind Directive (not associated with reusable
 * components.)
 * NB: Reusable component directives should go in the components/ folder.
 */

// HTML bind directive that trusts the value it is given and also evaluates
// custom directive tags in the provided value.
angular.module('oppia').directive('angularHtmlBind', [
  '$compile', function($compile) {
    return {
      restrict: 'E',
      link: function(scope, elm, attrs) {
        // Clean up old scopes if the html changes.
        // Reference: https://stackoverflow.com/a/42927814
        var newScope: ng.IScope;
        scope.$watch(attrs.htmlData, function(newValue: string) {
          if (newScope) {
            newScope.$destroy();
          }
          elm.empty();
          newScope = scope.$new();
          // When there are trailing spaces in the HTML, CKEditor adds &nbsp;
          // to the HTML (eg: '<p> Text &nbsp; &nbsp; %nbsp;</p>'), which can
          // lead to UI issues when displaying it. Hence, the following block
          // replaces the trailing ' &nbsp; &nbsp; %nbsp;</p>' with just '</p>'.
          // We can't just find and replace '&nbsp;' here since, those in the
          // middle may actually be required. Only the trailing ones need to be
          // replaced.
          if (newValue) {
            newValue = newValue.replace(/^(<p>\&nbsp\;<\/p>\n\n)+/g, '');
            newValue = newValue.replace(/(&nbsp;(\s)?)*(<\/p>)/g, '</p>');
            // The following line is required since blank newlines in between
            // paragraphs are treated as <p>&nbsp;</p> by ckedior. So, these
            // have to be restored, as this will get reduced to <p></p> above.
            // There is no other via user input to get <p></p>, so this wouldn't
            // affect any other data.
            newValue = newValue.replace(/<p><\/p>/g, '<p>&nbsp;</p>');
          }
          elm.html(newValue as string);
          $compile(elm.contents())(newScope);
        });
      }
    };
  }]);
