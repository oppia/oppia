# Copyright 2012 Google Inc. All Rights Reserved.
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

"""A very basic CSS minifier."""

# TODO(sll): replace with a third-party minifier, such as yuicompressor.

import re


def MinifyCSS(css, output_file_object):
    """Collapse whitespace in CSS file."""
    css = re.sub(r'\s+', ' ', css)
    output_file_object.write(css)
