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
 * @fileoverview Directives that are not associated with reusable components.
 * NB: Reusable component directives should go in the components/ folder.
 */

// HTML bind directive that trusts the value it is given and also evaluates
// custom directive tags in the provided value.
oppia.directive('angularHtmlBind', ['$compile', function($compile) {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      // Clean up old scopes if the html changes.
      // Reference: https://stackoverflow.com/a/42927814
      var newScope;
      scope.$watch(attrs.angularHtmlBind, function(newValue) {
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

oppia.directive('mathjaxBind', [function() {
  return {
    restrict: 'A',
    controller: [
      '$scope', '$element', '$attrs', function($scope, $element, $attrs) {
        $scope.$watch($attrs.mathjaxBind, function(value) {
          var $script = angular.element(
            '<script type="math/tex">'
          ).html(value === undefined ? '' : value);
          $element.html('');
          $element.append($script);
          MathJax.Hub.Queue(['Reprocess', MathJax.Hub, $element[0]]);
        });
      }
    ]
  };
}]);

// Highlights the text of an input field when it is clicked.
oppia.directive('selectOnClick', [function() {
  return {
    restrict: 'A',
    link: function(scope, elm) {
      elm.bind('click', function() {
        this.select();
      });
    }
  };
}]);

// A popover that is shown when its label is hovered or clicked upon, and
// disappears when focus moves away from its label.
oppia.directive('customPopover', ['$sce', function($sce) {
  return {
    restrict: 'A',
    template: (
      '<div style="cursor: pointer;" ng-click="showPopover()"><[label]></div>'
    ),
    link: function(scope, elt, attrs) {
      scope.label = attrs.popoverLabel;
      $(elt).popover({
        trigger: 'hover',
        html: true,
        content: $sce.getTrustedHtml(
          '<pre class="oppia-pre-wrapped-text">' + attrs.popoverText +
          '</pre>'),
        placement: attrs.popoverPlacement
      });
    },
    controller: ['$scope', '$element', function($scope, $element) {
      $scope.isShown = false;

      $element.on('shown.bs.popover', function() {
        $scope.isShown = true;
      });
      $element.on('hidden.bs.popover', function() {
        $scope.isShown = false;
      });

      $scope.showPopover = function() {
        if (!$scope.isShown) {
          $element.popover('show');
        }
      };
    }]
  };
}]);

// When set as an attr of an <input> element, moves focus to that element
// when a 'focusOn' event is broadcast.
oppia.directive('focusOn', [
  'LABEL_FOR_CLEARING_FOCUS', function(LABEL_FOR_CLEARING_FOCUS) {
    return function(scope, elt, attrs) {
      scope.$on('focusOn', function(e, name) {
        if (name === attrs.focusOn) {
          elt[0].focus();
        }

        // If the purpose of the focus switch was to clear focus, blur the
        // element.
        if (name === LABEL_FOR_CLEARING_FOCUS) {
          elt[0].blur();
        }
      });
    };
  }
]);

oppia.directive('mobileFriendlyTooltip', ['$timeout', function($timeout) {
  return {
    restrict: 'A',
    scope: true,
    controller: ['$scope', 'DeviceInfoService', function(
        $scope, DeviceInfoService) {
      $scope.opened = false;
      $scope.deviceHasTouchEvents = DeviceInfoService.hasTouchEvents();
    }],
    link: function(scope, element) {
      var TIME_TOOLTIP_CLOSE_DELAY_MOBILE = 1000;

      if (scope.deviceHasTouchEvents) {
        element.on('touchstart', function() {
          scope.opened = true;
          scope.$apply();
        });
        element.on('touchend', function() {
          // Set time delay before tooltip close
          $timeout(function() {
            scope.opened = false;
          }, TIME_TOOLTIP_CLOSE_DELAY_MOBILE);
        });
      } else {
        element.on('mouseenter', function() {
          scope.opened = true;
          scope.$apply();
        });

        element.on('mouseleave', function() {
          scope.opened = false;
          scope.$apply();
        });
      }
    }
  };
}]);

oppia.directive('handleDropdownNavigation', function () {
  return {
    restrict: 'A',
    link: function (scope, elm, attrs) {
      elm.on('focus', function (e) {
        elm.bind('keydown keypress', function (e) {
          if (e.keyCode === 13) {
            // open the submenu on pressing enter
            e.preventDefault();
            if (!elm.closest('li').hasClass('open')) {
              elm.closest('li').addClass('open');
            }
          }
        });

        elm.closest('li').find('ul').find('li')
          .first().find('a').keydown(function (e) {
            if (e.shiftKey && e.keyCode === 9) {
              // If the user presses shift+tab on the first list item, 
              //hide the menus
              if (elm.closest('li').hasClass('open')) {
                elm.closest('li').removeClass('open');
              }
            }
          });

        elm.closest('li').find('ul').find('li')
          .last().find('a').keydown(function (e) {
            if (e.keyCode === 9) {
              // If the user presses shift+tab on the first list item, 
              //hide the menus
              if (elm.closest('li').hasClass('open')) {
                elm.closest('li').removeClass('open');
              }
            }
          });
      });

      angular.element(document).on('click', function () {
        if (elm.closest('li').hasClass('open')) {
          elm.closest('li').removeClass('open');
        }
      });
    }
  };
});
