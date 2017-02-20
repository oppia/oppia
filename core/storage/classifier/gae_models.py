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

"""Models for storing the classification models."""

from core.platform import models
import utils

from google.appengine.ext import ndb

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

# Available choices of algorithms for classification.
ALGORITHM_CHOICES = [
    'LDAStringClassifier'
]


class ClassifierModel(base_models.BaseModel):
    """Storage model for classifier used for answer classification.

    The id of instances of this class has the form
    {{exp_id}}.{{random_hash_of_16_chars}}
    """

    # The exploration_id of the exploration to whose state the model belongs.
    exp_id = ndb.StringProperty(required=True, indexed=True)
    # The exploration version at the time this classifier model was created.
    exp_version_when_created = ndb.IntegerProperty(required=True, indexed=True)
    # The name of the state to which the model belongs.
    state_name = ndb.StringProperty(required=True, indexed=True)
    # The ID of the algorithm used to create the model.
    algorithm_id = ndb.StringProperty(required=True, choices=ALGORITHM_CHOICES)
    # The actual model used for classification. Immutable, unless a schema
    # upgrade takes place.
    cached_classifier_data = ndb.JsonProperty(required=True)
    # The schema version for the data that is being classified.
    data_schema_version = ndb.IntegerProperty(required=True)

    @classmethod
    def _generate_id(cls, exp_id):
        """Generates a unique id for the classifier model of the form
        {{exp_id}}.{{random_hash_of_16_chars}}

        Args:
            exp_id: str. ID of the exploration.

        Returns:
            ID of the new classifier model.

        Raises:
            Exception: The id generator for ClassifierModel is producing too
            many collisions.
        """

        for _ in range(base_models.MAX_RETRIES):
            new_id = '%s.%s' % (
                exp_id,
                utils.convert_to_hash(
                    str(utils.get_random_int(base_models.RAND_RANGE)),
                    base_models.ID_LENGTH))
            if not cls.get_by_id(new_id):
                return new_id

        raise Exception(
            'The id generator for ClassifierModel is producing too many '
            'collisions.')

    @classmethod
    def create(
            cls, exp_id, exp_version_when_created, state_name, algorithm_id,
            cached_classifier_data, data_schema_version):
        """Creates a new ClassifierModel entry.

        Args:
            exp_id: str. ID of the exploration.
            exp_version_when_created: int. The version of the exploration when
                this classification model was created.
            state_name: str. The name of the state to which the classifier
                belongs.
            algorithm_id: str. ID of the algorithm used to generate the model.
            cached_classifier_data: dict. The model used for classification.
            data_schema_version: int. Schema version of the
                data used by the classifier.

        Returns:
            ID of the new ClassifierModel entry.

        Raises:
            Exception: A model with the same ID already exists.
        """

        instance_id = cls._generate_id(exp_id)
        classifier_model_instance = cls(
            id=instance_id, exp_id=exp_id,
            exp_version_when_created=exp_version_when_created,
            state_name=state_name, algorithm_id=algorithm_id,
            cached_classifier_data=cached_classifier_data,
            data_schema_version=data_schema_version)

        classifier_model_instance.put()
        return instance_id
