# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
"""The vertexai module."""

import importlib

from google.cloud.aiplatform import version as aiplatform_version

__version__ = aiplatform_version.__version__

from google.cloud.aiplatform import init

__all__ = [
    "init",
    "preview",
]


def __getattr__(name):
    # Lazy importing the preview submodule
    # See https://peps.python.org/pep-0562/
    if name == "preview":
        # We need to import carefully to avoid `RecursionError`.
        # This won't work since it causes `RecursionError`:
        # `from vertexai import preview`
        # This won't work due to Copybara lacking a transform:
        # `import google.cloud.aiplatform.vertexai.preview as vertexai_preview`
        return importlib.import_module(".preview", __name__)

    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")
