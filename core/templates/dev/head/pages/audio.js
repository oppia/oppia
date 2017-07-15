oppia.controller('Audio', ['$scope', 'AssetsBackendApiService', 'AudioPlayerService',
  function($scope, AssetsBackendApiService, AudioPlayerService) {
    $scope.add = function() {
      console.log("add");
      var f = document.getElementById('upload').files[0];
      r = new FileReader();
      r.onloadend = function(e) {
        var data = e.target.result;

        var fd = new FormData();

        var blob = new Blob([new Uint8Array(data)], {type: 'audio/mp3'});
        //var blob = 'fsddfsfsddsf';
        AssetsBackendApiService.saveAudio('11', 'myfile3.mp3', blob).then(function(r) {
          console.log(r);
          AudioPlayerService.play('myfile3.mp3');
        });


      };
      r.readAsArrayBuffer(f);
    };

}]);