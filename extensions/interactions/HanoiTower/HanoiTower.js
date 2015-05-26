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
 * Directive for the HanoiTower interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveHanoiTower', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'interaction/HanoiTower',
      controller:  ['$scope', '$attrs', function($scope, $attrs) {
        // TODO(sll): Why doesn't drag work on mobile?
        $scope.numberOfDisks = $attrs.numDisksWithValue;

        var DISK_WIDTHS_PX = [60, 80, 100, 120, 140];
        var DISK_HEIGHT_PX = 25;
        var MAX_NUM_DISKS = 5;
        var TOWER_NAMES = ['A', 'B', 'C'];
        var TOWER_OFFSETS_PX = [100, 260, 420];
        var TOWER_DROP_WIDTH_PX = 100;
        var TOWER_WIDTH_PX = 16;

        // Each sub-array of this array represents the disks on a peg, arranged
        // in order from top to bottom. The disks are represented by their
        // numbers.
        $scope.towerContents = [[], [], []];
        $scope.moveLog = [];
        $scope.completionMessage = '';

        $scope.towerDropStyles = [{}, {}, {}];
        $scope.towerStyles = [{}, {}, {}];

        var getStyleString = function(left, top) {
          var result = '';
          if (left !== null) {
            result += ('left: ' + left + 'px;');
          }
          if (top !== null) {
            result += ('top: ' + top + 'px;');
          }
          return result;
        };

        var getTowerStyle = function(towerNumber) {
          return {
            left: TOWER_DROP_WIDTH_PX / 2.0 - TOWER_WIDTH_PX / 2.0
          };
        };

        var getTowerDropStyle = function(towerNumber) {
          return {
            left: TOWER_OFFSETS_PX[towerNumber] - TOWER_DROP_WIDTH_PX / 2.0,
            width: TOWER_DROP_WIDTH_PX
          };
        };

        $scope.getDiskStyle = function(towerNumber, diskIndex) {
          var diskNumber = $scope.towerContents[towerNumber][diskIndex];
          return getStyleString(
            TOWER_OFFSETS_PX[towerNumber] - DISK_WIDTHS_PX[diskNumber] / 2.0,
            (MAX_NUM_DISKS + 2 - $scope.towerContents[towerNumber].length + diskIndex) * DISK_HEIGHT_PX);
        };

        $scope.resetGame = function() {
          $scope.towerContents = [[], [], []];
          for (var i = 0; i < $scope.numberOfDisks; i++) {
            $scope.towerContents[0].push(i);
          }
          $scope.moveLog = [];
          $scope.completionMessage = '';

          for (var i = 0; i < 3; i++) {
            $scope.towerDropStyles[i] = getTowerDropStyle(i);
            $scope.towerStyles[i] = getTowerStyle(i);
          }
        };

        $scope.onDropComplete = function(diskNumber, source, target, $event) {
          if ($scope.towerContents[target].length === 0 || $scope.towerContents[target][0] > diskNumber) {
            $scope.towerContents[target].unshift(diskNumber);
            $scope.towerContents[source].shift();

            $scope.moveLog.push(
              'Disk ' + (diskNumber + 1) + ' was moved from tower ' +
              TOWER_NAMES[source] + ' to tower ' + TOWER_NAMES[target]);
            if ($scope.towerContents[0].length === 0 &&
                ($scope.towerContents[1].length === 0 || $scope.towerContents[2].length === 0)) {
              var numberOfMoves = $scope.moveLog.length;
              $scope.completionMessage = 'You finished the puzzle in ' + numberOfMoves + ' moves.';
              $scope.submitAnswer($scope.moveLog);
            }
          }
        };

        $scope.resetGame();

        $scope.submitAnswer = function(moveLog) {
          $scope.$parent.$parent.submitAnswer(moveLog, 'submit');
        };
      }]
    };
  }
]);


oppia.directive('oppiaResponseHanoiTower', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/HanoiTower',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
      }]
    };
  }
]);
