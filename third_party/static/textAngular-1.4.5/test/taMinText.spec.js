describe('taMinText', function(){
	'use strict';
	var $rootScope, $compile;
	beforeEach(module('textAngular'));
	beforeEach(inject(function (_$compile_, _$rootScope_) {
		$rootScope = _$rootScope_;
		$compile = _$compile_;
	}));

	it('should fail without ngmodel', function(){
		expect(function () {
			$compile('<div ta-min-text></div>')($rootScope);
			$rootScope.$digest();
		}).toThrow();
	});

	it('should fail without a value', function(){
		expect(function () {
			$compile('<div ng-model="test" ta-min-text></div>')($rootScope);
			$rootScope.$digest();
		}).toThrow('Min text must be an integer');
	});

	it('should fail without a numeric value', function(){
		expect(function () {
			$compile('<div ng-model="test" ta-min-text="worldspawn"></div>')($rootScope);
			$rootScope.$digest();
		}).toThrow('Min text must be an integer');
	});

	describe('when validating', function(){
		var $scope;
		beforeEach(function(){
			$scope = $rootScope.$new();
			$scope.minText = 13;
			var form = angular.element('<form name="form"><input type="text" ng-model="model.html" ta-min-text="{{minText - 1}}" name="html" /></form>');
			$scope.model = { html : null };
			$compile(form)($scope);
			$scope.$digest();
		});

		it('should fail when text length is below limit', function(){
			$scope.form.html.$setViewValue('<strong>textAngular</strong>');
			expect($scope.form.html.$error.taMinText).toBe(true);
		});

		it('should pass when text is empty', function(){
			$scope.form.html.$setViewValue('<strong></strong>');
			expect($scope.form.html.$error.taMinText).toBe(undefined);
		});

		it('should pass when text is above limit', function(){
			$scope.form.html.$setViewValue('<strong>textAngular_</strong>');
			expect($scope.form.html.$error.taMinText).toBe(undefined);
		});

		it('behaviour should change when min text limit is changed', function(){
			$scope.form.html.$setViewValue('<strong>textAngular</strong>');
			expect($scope.form.html.$error.taMinText).toBe(true);
			$scope.$apply(function(){
				$scope.minText = 12;
			});
			expect($scope.form.html.$error.taMinText).toBe(undefined);
		});

		it('should fail when min text limit is changed to non numeric value', function(){
			$scope.form.html.$setViewValue('<strong>textAngular</strong>');
			expect($scope.form.html.$error.taMinText).toBe(true);
			expect(function() {
				$scope.$apply(function(){
					$scope.minText = 'worldspawn';
				});
			}).toThrow('Min text must be an integer');
		});
	});
});