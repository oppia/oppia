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

    it('should clone an object', function() {
      var a = {'a': 'b'};
      var b = scope.cloneObject(a);
      expect(b).toEqual(a);
      expect(b).not.toBe(a);
      a['b'] = 'c';
      expect(b).not.toEqual(a);
    });
  });
});
