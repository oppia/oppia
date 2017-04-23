describe('taMaxText', function(){
	'use strict';
	var $rootScope, $compile, $timeout;
	beforeEach(module('textAngular'));
	beforeEach(inject(function (_$compile_, _$rootScope_, _$timeout_) {
		$rootScope = _$rootScope_;
		$compile = _$compile_;
		$timeout = _$timeout_;
	}));

	it('should fail without ngmodel', function(){
		expect(function () {
			$compile('<div ta-max-text></div>')($rootScope);
			$rootScope.$digest();
		}).toThrow();
	});

	it('should fail without a value', function(){
		expect(function () {
			$compile('<div ng-model="test" ta-max-text></div>')($rootScope);
			$rootScope.$digest();
		}).toThrow('Max text must be an integer');
	});

	it('should fail without a numeric value', function(){
		expect(function () {
			$compile('<div ng-model="test" ta-max-text="worldspawn"></div>')($rootScope);
			$rootScope.$digest();
		}).toThrow('Max text must be an integer');
	});

	describe('when validating', function(){
		var $scope;
		beforeEach(function(){
			$scope = $rootScope.$new();
			$scope.maxText = 10;
			var form = angular.element('<form name="form"><input type="text" ng-model="model.html" ta-max-text="{{maxText + 1}}" name="html" /></form>');
			$scope.model = { html : null };
			$compile(form)($scope);
			$scope.$digest();
		});

		it('should fail when text exceeds limit', function(){
			$scope.form.html.$setViewValue('<strong>textAngular_</strong>');
			$timeout.flush();
			expect($scope.form.html.$error.taMaxText).toBe(true);
		});

		it('should pass when text is within limit', function(){
			$scope.form.html.$setViewValue('<strong>textAngular</strong>');
			$timeout.flush();
			expect($scope.form.html.$error.taMaxText).toBe(undefined);
		});

		it('behaviour should change when max text limit is changed', function(){
			$scope.form.html.$setViewValue('<strong>textAngular_</strong>');
			$timeout.flush();
			expect($scope.form.html.$error.taMaxText).toBe(true);
			$scope.$apply(function(){
				$scope.maxText = 11;
			});
			$scope.$digest();
			expect($scope.form.html.$error.taMaxText).toBe(undefined);
		});

		it('should fail when max text limit is changed to non numeric value', function(){
			$scope.form.html.$setViewValue('<strong>textAngular__</strong>');
			$timeout.flush();
			expect($scope.form.html.$error.taMaxText).toBe(true);
			expect(function() {
				$scope.$apply(function(){
					$scope.maxText = 'worldspawn';
				});
			}).toThrow('Max text must be an integer');
		});
	});
});