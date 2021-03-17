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
 * @fileoverview Directive for the SortedTiles visualization.
 */

import { sum } from 'd3-array';

import { AnswerStats } from 'domain/exploration/answer-stats.model';

require(
  'components/common-layout-directives/common-elements/' +
  'answer-content-modal.controller.ts');

angular.module('oppia').directive('oppiaVisualizationSortedTiles', () => ({
  restrict: 'E',
  scope: { data: '<', options: '<', totalFrequency: '<' },
  template: require('./oppia-visualization-sorted-tiles.directive.html'),
  style: require('./oppia-visualization-sorted-tiles.directive.css'),
  controller: ['$scope', '$uibModal', 'UtilsService',
    function($scope, $uibModal, UtilsService) {
      this.$onInit = () => {
        const data = <AnswerStats[]> $scope.data;
        const totalFrequency = (
          $scope.totalFrequency || sum(data, a => a.frequency));

        $scope.isAnswerTooLong = (index: number) => {
          return UtilsService.isOverflowing(
            $('.oppia-visualization-sorted-tile-answer.answer-' + index).get(0)
          );
        };
        $scope.openAnswerContentModal = (index: number) => $uibModal.open({
          controller: 'AnswerContentModalController',
          template: require(
            'components/common-layout-directives/common-elements/' +
            'answer-content-modal.template.html'),
          resolve: {answerHtml: () => data[index].answer},
          backdrop: false,
        });

        $scope.isSelected = Array<boolean>(data.length).fill(false);
        $scope.select = (index: number) => {
          $scope.isSelected[index] = true;
        };
        $scope.unselect = (index: number) => {
          $scope.isSelected[index] = false;
        };

        if ($scope.options.use_percentages) {
          $scope.percentages = (
            data.map(d => Math.round(100.0 * d.frequency / totalFrequency)));
        }
      };
    }],
}));
