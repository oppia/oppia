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
 * @fileoverview Unit tests for ImprovementLearnerAnswerDetailsModalController.
 */

describe('Improvement Learner Answer Details Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var $q;
  var LearnerAnswerDetailsObjectFactory = null;
  var LearnerAnswerInfoObjectFactory = null;
  var LearnerAnswerDetailsDataService = null;
  var learnerAnswerDetails = null;
  var learnerAnswerInfo = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    LearnerAnswerDetailsObjectFactory = $injector.get(
      'LearnerAnswerDetailsObjectFactory');
    LearnerAnswerInfoObjectFactory = $injector.get(
      'LearnerAnswerInfoObjectFactory');
    LearnerAnswerDetailsDataService = $injector.get(
      'LearnerAnswerDetailsDataService');
    $q = $injector.get('$q');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    learnerAnswerInfo = LearnerAnswerInfoObjectFactory.createFromBackendDict({
      id: '1',
      answer: 'This is the answer',
      answer_details: 'Details',
      created_on: 99999
    });
    learnerAnswerDetails = (
      LearnerAnswerDetailsObjectFactory.createDefaultLearnerAnswerDetails(
        '0', 'State', '0', {
          choices: {
            value: 'Answer'
          }
        }, [learnerAnswerInfo])
    );

    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $controller('ImprovementLearnerAnswerDetailsModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      isEditable: true,
      learnerAnswerDetails: learnerAnswerDetails
    });
  }));

  it('should evalute scope variables value correctly', function() {
    expect($scope.isEditable).toBe(true);
    expect($scope.selectedLearnerAnswerInfo).toEqual([]);
    expect($scope.learnerAnswerDetails).toEqual(learnerAnswerDetails);
    expect($scope.currentLearnerAnswerInfo).toEqual(null);
    expect($scope.viewAnswerDetails).toEqual(false);
  });

  it('should change view', function() {
    $scope.changeView(learnerAnswerInfo);
    expect($scope.currentLearnerAnswerInfo).toEqual(learnerAnswerInfo);
    expect($scope.viewAnswerDetails).toBe(true);
  });

  it('should get learner answer infos', function() {
    expect($scope.getLearnerAnswerInfos()).toEqual([learnerAnswerInfo]);
  });

  it('should get learner answer info details', function() {
    expect($scope.getAnswerDetails(learnerAnswerInfo)).toBe('Details');
  });

  it('should get learner answer html', function() {
    expect($scope.getLearnerAnswerHtml(learnerAnswerInfo)).toBe(
      '<oppia-short-response-0' +
      ' answer="&amp;quot;This is the answer&amp;quot;"' +
      ' choices="&amp;quot;Answer&amp;quot;">' +
      '</oppia-short-response-0>');
  });

  it('should toggle selecting learner answer info', function() {
    $scope.selectLearnerAnswerInfo(learnerAnswerInfo);
    expect($scope.selectedLearnerAnswerInfo).toEqual([learnerAnswerInfo]);
    $scope.selectLearnerAnswerInfo(learnerAnswerInfo);
    expect($scope.selectedLearnerAnswerInfo).toEqual([]);
  });

  it('should delete selected learner answer info', function() {
    var deleteLearnerAnswerInfo = spyOn(
      LearnerAnswerDetailsDataService, 'deleteLearnerAnswerInfo').and
      .callThrough();

    $scope.selectLearnerAnswerInfo(learnerAnswerInfo);
    expect($scope.selectedLearnerAnswerInfo).toEqual([learnerAnswerInfo]);
    $scope.deleteSelectedLearnerAnswerInfo();

    expect($scope.learnerAnswerDetails.learnerAnswerInfoData).toEqual([]);
    expect(deleteLearnerAnswerInfo).toHaveBeenCalledWith(
      '0', 'State', '1');
    expect($scope.selectedLearnerAnswerInfo).toEqual([]);
    expect($scope.currentLearnerAnswerInfo).toBe(null);
    expect($uibModalInstance.close).toHaveBeenCalled();
  });

  it('should close modal', function() {
    $scope.close();
    expect($uibModalInstance.close).toHaveBeenCalled();
  });
});
