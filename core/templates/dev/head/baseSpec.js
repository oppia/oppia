describe('Base controller', function() {

  describe('BaseCtrl', function() {
    var scope, ctrl, $httpBackend;

    beforeEach(inject(function($rootScope, $controller) {
      scope = $rootScope.$new();
      ctrl = $controller(Base, {
        $scope: scope, warningsData: null, activeInputData: null,
        messengerService: null});
    }));

    it('should clone an object', function() {
      var a = {'a': 'b'};
      var b = scope.cloneObject(a);
      expect(b).toEqual(a);
      expect(b).not.toBe(a);
      a['b'] = 'c';
      expect(b).not.toEqual(a);
    });

    it('should correctly normalize whitespace', function(warningsData) {
      expect(scope.normalizeWhitespace('a')).toBe('a');
      expect(scope.normalizeWhitespace('a  ')).toBe('a');
      expect(scope.normalizeWhitespace('  a')).toBe('a');
      expect(scope.normalizeWhitespace('  a  ')).toBe('a');

      expect(scope.normalizeWhitespace('a  b ')).toBe('a b');
      expect(scope.normalizeWhitespace('  a  b ')).toBe('a b');
      expect(scope.normalizeWhitespace('  ab c ')).toBe('ab c');
    });

    it('should correctly validate entity names', function(warningsData) {
      GLOBALS = {INVALID_NAME_CHARS: 'ace'};

      expect(scope.isValidEntityName('b')).toBe(true);
      expect(scope.isValidEntityName('b   ')).toBe(true);
      expect(scope.isValidEntityName('   b')).toBe(true);
      expect(scope.isValidEntityName('bd')).toBe(true);

      expect(scope.isValidEntityName('')).toBe(false);
      expect(scope.isValidEntityName('   ')).toBe(false);
      expect(scope.isValidEntityName('a')).toBe(false);
      expect(scope.isValidEntityName('c')).toBe(false);
      expect(scope.isValidEntityName('ba')).toBe(false);
    });
  });
});
