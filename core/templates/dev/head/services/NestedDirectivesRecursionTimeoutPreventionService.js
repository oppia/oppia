// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service prevents timeouts due to recursion
 * in nested directives. See: http://stackoverflow.com/q/14430655
 */

oppia.factory('NestedDirectivesRecursionTimeoutPreventionService', [
  '$compile',
  function($compile) {
    return {
      /**
       * Manually compiles the element, fixing the recursion loop.
       * @param {DOM element} element
       * @param {function|object} link - A post-link function, or an object with
       *   function(s) registered via pre and post properties.
       * @return {object} An object containing the linking functions.
       */
      compile: function(element, link) {
        // Normalize the link parameter
        if (angular.isFunction(link)) {
          link = {
            post: link
          };
        }

        // Break the recursion loop by removing the contents,
        var contents = element.contents().remove();
        var compiledContents;
        return {
          pre: (link && link.pre) ? link.pre : null,
          post: function(scope, element) {
            // Compile the contents.
            if (!compiledContents) {
              compiledContents = $compile(contents);
            }
            // Re-add the compiled contents to the element.
            compiledContents(scope, function(clone) {
              element.append(clone);
            });

            // Call the post-linking function, if any.
            if (link && link.post) {
              link.post.apply(null, arguments);
            }
          }
        };
      }
    };
  }]);
