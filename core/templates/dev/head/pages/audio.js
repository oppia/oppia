oppia.controller('Audio', ['$scope', 'AssetsBackendApiService', 'AudioPlayerService',
  function($scope, AssetsBackendApiService, AudioPlayerService) {
    $scope.add = function() {
      console.log("add");
      var f = document.getElementById('upload').files[0];
      r = new FileReader();
      r.onloadend = function(e) {
        var data = e.target.result;
        AssetsBackendApiService.save('1', 'myfile.mp3', data).then(function(r) {
          console.log(r);
        });
        console.log(data.byteLength);
        AudioPlayerService.play('test-audio.mp3');
      };
      r.readAsArrayBuffer(f);

    };

}]);