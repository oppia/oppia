# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Feature detection utilities for Python 2 and Python 3."""


def import_string_io():
    """Returns StringIO from StringIO module if run under Python 2 and from io
    module if run under Python 3.

    Returns:
        StringIO.StringIO or io.StringIO. The StringIO object.
    """
    try:
        from StringIO import StringIO
    except ImportError:
        from io import StringIO
    return StringIO()


def get_args_of_function(function_node, args_to_ignore):
    """Extracts the arguments from a function definition.

    Args:
        function_node: ast.FunctionDef. Represents a function.
        args_to_ignore: list(str). Ignore these arguments in a function
        definition.

    Returns:
        list(str). The args for a function as listed in the function
        definition.
    """
    try:
        return [
            a.arg for a in function_node.args.args if a.arg not in
            args_to_ignore]
    except AttributeError:
        return [
            a.id for a in function_node.args.args if a.id not in args_to_ignore]


def open_file(filename, mode, encoding='utf-8'):
    """Open file and return a corresponding file object.

    Args:
        filename: str. The file to be opened.
        mode: str. Mode in which the file is opened.
        encoding: str. Encoding in which the file is opened.

    Returns:
        _io.TextIOWrapper. The file object.
    """
    import io
    try:
        return io.open(filename, mode, encoding=encoding)
    except:
        raise IOError('No such file found: %s' % filename)
