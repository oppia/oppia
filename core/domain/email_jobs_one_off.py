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
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

from core import jobs
from core.platform import models

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position

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
