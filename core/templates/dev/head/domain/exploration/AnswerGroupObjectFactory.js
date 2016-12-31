// Copyright 2015 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

oppia.factory('AnswerGroupObjectFactory', [
	function() {
		var AnswerGroup = function(rule_specs, outcome) {
			this.rule_specs = rule_specs;
			this.outcome = outcome;
		}

		// Static class methods. Note that "this" is not available in
		// static contexts.
		AnswerGroup.create = function(rule_specs, outcome) {
			return new AnswerGroup(rule_specs, outcome);
		}

		return AnswerGroup;
	}
]);