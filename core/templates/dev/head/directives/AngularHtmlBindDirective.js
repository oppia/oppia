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
oppia.directive('angularHtmlBind', ['$compile', function($compile) {
  return {
    restrict: 'E',
    link: function(scope, elm, attrs) {
      // Clean up old scopes if the html changes.
      // Reference: https://stackoverflow.com/a/42927814
      var newScope;
      scope.$watch(attrs.htmlData, function(newValue) {
        if (newScope) {
          newScope.$destroy();
        }
        elm.empty();
        newScope = scope.$new();
        elm.html(newValue);
        $compile(elm.contents())(newScope);
      });
    }
  };
}]);
