oppia.controller('MarkAllAudioAsNeedingUpdateCtrl', [
  '$scope', '$uibModalInstance',
  function($scope, $uibModalInstance) {
    $scope.flagAll = function() {
      $uibModalInstance.close();
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  }
]);