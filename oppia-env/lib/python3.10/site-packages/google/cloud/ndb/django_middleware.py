# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Django middleware for ``ndb``.

This class is not implemented and is no longer necessary.

To use Django middleware with NDB, follow the steps in
https://cloud.google.com/appengine/docs/standard/python3/migrating-to-cloud-ndb#using_a_runtime_context_with_django
"""


__all__ = ["NdbDjangoMiddleware"]


class NdbDjangoMiddleware(object):
    def __init__(self, *args, **kwargs):
        raise NotImplementedError
