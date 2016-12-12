# Copyright 2016 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Domain objects for classifier models"""

import copy

class Classifier(object):
    """Domain object for a classifier."""

    def __init__(self, classifier_id, exp_id, exp_version_when_created, state_name,
                 algorithm_id, cached_classifier_data, data_schema_version):
        self.id = classifier_id
        self.exp_id = exp_id
        self.exp_version_when_created = exp_version_when_created
        self.state_name = state_name
        self.algorithm_id = algorithm_id
        self.cached_classifier_data = {}
        self.cached_classifier_data = copy.deepcopy(cached_classifier_data),
        self.data_schema_version = data_schema_version

    def to_dict(self):
        return {
            'classifier_id': self.id,
            'exp_id': self.exp_id,
            'exp_version_when_created': self.exp_version_when_created,
            'state_name': self.state_name,
            'algorithm_id': self.algorithm_id,
            'cached_classifier_data': self.cached_classifier_data,
            'data_schema_version': self.data_schema_version
        }