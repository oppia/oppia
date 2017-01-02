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
    """Domain object for a classifier.

    A classifier is a machine learning model created using a particular
    classification algorithm which is used for answer classification
    task.

    Attributes:
        id: str. The unique id of the classifier.
        exp_id: str. The exploration id to which this classifier belongs.
        exp_version_when_created: str. The version of the exploration when
            this classification model was created.
        state_name: str. The name of the state to which the classifier belongs.
        algorithm_id: str. The id of the algorithm used for generating
            classifier.
        cached_classifier_data: dict. The actual classifier model used for
            classification purpose.
        data_schema_version: int. Schema version of the data used by the
            classifier. This depends on the algorithm ID.
    """

    def __init__(self, classifier_id, exp_id, exp_version_when_created,
                 state_name, algorithm_id, cached_classifier_data,
                 data_schema_version):
        """Constructs an Classifier domain object.

        Args:
            classifier_id: str. The unique id of the classifier.
            exp_id: str. The exploration id to which the classifier belongs.
            exp_version_when_created: str. The version of the exploration when
                this classification model was created.
            state_name: str. The name of the state to which the classifier
                belongs.
            algorithm_id: str. The id of the algorithm used for generating
                classifier.
            cached_classifier_data: dict. The actual classifier model used for
                classification purpose.
            data_schema_version: int. Schema version of the
                data used by the classifier.
        """
        self.id = classifier_id
        self.exp_id = exp_id
        self.exp_version_when_created = exp_version_when_created
        self.state_name = state_name
        self.algorithm_id = algorithm_id
        self.cached_classifier_data = copy.deepcopy(cached_classifier_data)
        self.data_schema_version = data_schema_version

    def to_dict(self):
        """Constructs a dict representation of Classifier domain object.

        Returns:
            A dict representation of Classifier domain object.
        """

        return {
            'classifier_id': self.id,
            'exp_id': self.exp_id,
            'exp_version_when_created': self.exp_version_when_created,
            'state_name': self.state_name,
            'algorithm_id': self.algorithm_id,
            'cached_classifier_data': self.cached_classifier_data,
            'data_schema_version': self.data_schema_version
        }
