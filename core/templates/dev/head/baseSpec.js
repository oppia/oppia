describe('Base controller', function() {

  describe('BaseCtrl', function() {
    var scope, ctrl, $httpBackend;

    beforeEach(inject(function($rootScope, $controller) {
      scope = $rootScope.$new();
      ctrl = $controller(Base, {
        $scope: scope, warningsData: null, activeInputData: null});
    }));

    it('should check that the current URL is not the demo server', function() {
      expect(scope.isDemoServer()).toBe(false);
    });
  });
});
