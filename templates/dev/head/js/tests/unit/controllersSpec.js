describe('Oppia controllers', function() {
 
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
