oppia.controller('Audio', ['$scope', 'AssetsBackendApiService',
  function($scope, AssetsBackendApiService) {
    $scope.add = function() {
      console.log("add");
      var f = document.getElementById('upload').files[0];
      r = new FileReader();
      r.onloadend = function(e) {
        var data = e.target.result;
        AssetsBackendApiService.save('1', 'myfile.mp3', data).then(function() {
          console.log("saved!");
        });
        console.log(data.byteLength);
      };
      r.readAsArrayBuffer(f);
    };
}]);