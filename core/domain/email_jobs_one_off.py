# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Jobs for Sent Email Model."""

from core import jobs
from core.platform import models

(email_models,) = models.Registry.import_models([models.NAMES.email])


class EmailHashRegenerationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for re-generating hash for all Sent Email Models.
    For every instance we call the put() method. The put() method
    results in a hash value (new hash value in case the hash
    function changes or no hash was present before.) getting generated
    and updated for each instance.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [email_models.SentEmailModel]

    @staticmethod
    def map(email_model):
        email_model.put()
        yield ('SUCCESS', 1)

    @staticmethod
    def reduce(key, values):
        yield (key, len(values))
