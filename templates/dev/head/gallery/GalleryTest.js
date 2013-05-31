describe('Gallery controller', function() {

  describe('GalleryCtrl', function() {

    it('should show all explorations by default', function() {
      var scope = {$on: function() {}};
      var ctrl = new Gallery(scope, null, null, null);
      expect(scope.showMyExplorations).toBe(false);
    });

  });

  describe('Gallery', function(){
    var $scope = {
      $on: function() {}
    };
    var $http;

    beforeEach(inject(function($rootScope) {
      $scope = $rootScope.$new();
      spyOn($scope, '$on').andCallThrough();
    }));

    it('should create current URL', inject(function($controller) {
      var ctrl = $controller('Gallery', {
        $scope: $scope, $http: $http, warningsData: null, GalleryData: null});

      expect($scope.currentUrl).toBe('http://localhost:9876/context.html');
    }));
  });
});
