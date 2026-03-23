#!/home/krishnavasnani/Documents/gsoc repo/oppia/oppia-env/bin/python3.10
# -*- coding: utf-8 -*-
# Copyright 2022 Google LLC
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
import argparse
import os
import libcst as cst
import pathlib
import sys
from typing import (Any, Callable, Dict, List, Sequence, Tuple)


def partition(
    predicate: Callable[[Any], bool],
    iterator: Sequence[Any]
) -> Tuple[List[Any], List[Any]]:
    """A stable, out-of-place partition."""
    results = ([], [])

    for i in iterator:
        results[int(predicate(i))].append(i)

    # Returns trueList, falseList
    return results[1], results[0]


class dlpCallTransformer(cst.CSTTransformer):
    CTRL_PARAMS: Tuple[str] = ('retry', 'timeout', 'metadata')
    METHOD_TO_PARAMS: Dict[str, Tuple[str]] = {
        'activate_job_trigger': ('name', ),
        'cancel_dlp_job': ('name', ),
        'create_deidentify_template': ('parent', 'deidentify_template', 'template_id', 'location_id', ),
        'create_dlp_job': ('parent', 'inspect_job', 'risk_job', 'job_id', 'location_id', ),
        'create_inspect_template': ('parent', 'inspect_template', 'template_id', 'location_id', ),
        'create_job_trigger': ('parent', 'job_trigger', 'trigger_id', 'location_id', ),
        'create_stored_info_type': ('parent', 'config', 'stored_info_type_id', 'location_id', ),
        'deidentify_content': ('parent', 'deidentify_config', 'inspect_config', 'item', 'inspect_template_name', 'deidentify_template_name', 'location_id', ),
        'delete_deidentify_template': ('name', ),
        'delete_dlp_job': ('name', ),
        'delete_inspect_template': ('name', ),
        'delete_job_trigger': ('name', ),
        'delete_stored_info_type': ('name', ),
        'finish_dlp_job': ('name', ),
        'get_deidentify_template': ('name', ),
        'get_dlp_job': ('name', ),
        'get_inspect_template': ('name', ),
        'get_job_trigger': ('name', ),
        'get_stored_info_type': ('name', ),
        'hybrid_inspect_dlp_job': ('name', 'hybrid_item', ),
        'hybrid_inspect_job_trigger': ('name', 'hybrid_item', ),
        'inspect_content': ('parent', 'inspect_config', 'item', 'inspect_template_name', 'location_id', ),
        'list_deidentify_templates': ('parent', 'page_token', 'page_size', 'order_by', 'location_id', ),
        'list_dlp_jobs': ('parent', 'filter', 'page_size', 'page_token', 'type_', 'order_by', 'location_id', ),
        'list_info_types': ('parent', 'language_code', 'filter', 'location_id', ),
        'list_inspect_templates': ('parent', 'page_token', 'page_size', 'order_by', 'location_id', ),
        'list_job_triggers': ('parent', 'page_token', 'page_size', 'order_by', 'filter', 'type_', 'location_id', ),
        'list_stored_info_types': ('parent', 'page_token', 'page_size', 'order_by', 'location_id', ),
        'redact_image': ('parent', 'location_id', 'inspect_config', 'image_redaction_configs', 'include_findings', 'byte_item', ),
        'reidentify_content': ('parent', 'reidentify_config', 'inspect_config', 'item', 'inspect_template_name', 'reidentify_template_name', 'location_id', ),
        'update_deidentify_template': ('name', 'deidentify_template', 'update_mask', ),
        'update_inspect_template': ('name', 'inspect_template', 'update_mask', ),
        'update_job_trigger': ('name', 'job_trigger', 'update_mask', ),
        'update_stored_info_type': ('name', 'config', 'update_mask', ),
    }

    def leave_Call(self, original: cst.Call, updated: cst.Call) -> cst.CSTNode:
        try:
            key = original.func.attr.value
            kword_params = self.METHOD_TO_PARAMS[key]
        except (AttributeError, KeyError):
            # Either not a method from the API or too convoluted to be sure.
            return updated

        # If the existing code is valid, keyword args come after positional args.
        # Therefore, all positional args must map to the first parameters.
        args, kwargs = partition(lambda a: not bool(a.keyword), updated.args)
        if any(k.keyword.value == "request" for k in kwargs):
            # We've already fixed this file, don't fix it again.
            return updated

        kwargs, ctrl_kwargs = partition(
            lambda a: a.keyword.value not in self.CTRL_PARAMS,
            kwargs
        )

        args, ctrl_args = args[:len(kword_params)], args[len(kword_params):]
        ctrl_kwargs.extend(cst.Arg(value=a.value, keyword=cst.Name(value=ctrl))
                           for a, ctrl in zip(ctrl_args, self.CTRL_PARAMS))

        request_arg = cst.Arg(
            value=cst.Dict([
                cst.DictElement(
                    cst.SimpleString("'{}'".format(name)),
cst.Element(value=arg.value)
                )
                # Note: the args + kwargs looks silly, but keep in mind that
                # the control parameters had to be stripped out, and that
                # those could have been passed positionally or by keyword.
                for name, arg in zip(kword_params, args + kwargs)]),
            keyword=cst.Name("request")
        )

        return updated.with_changes(
            args=[request_arg] + ctrl_kwargs
        )


def fix_files(
    in_dir: pathlib.Path,
    out_dir: pathlib.Path,
    *,
    transformer=dlpCallTransformer(),
):
    """Duplicate the input dir to the output dir, fixing file method calls.

    Preconditions:
    * in_dir is a real directory
    * out_dir is a real, empty directory
    """
    pyfile_gen = (
        pathlib.Path(os.path.join(root, f))
        for root, _, files in os.walk(in_dir)
        for f in files if os.path.splitext(f)[1] == ".py"
    )

    for fpath in pyfile_gen:
        with open(fpath, 'r') as f:
            src = f.read()

        # Parse the code and insert method call fixes.
        tree = cst.parse_module(src)
        updated = tree.visit(transformer)

        # Create the path and directory structure for the new file.
        updated_path = out_dir.joinpath(fpath.relative_to(in_dir))
        updated_path.parent.mkdir(parents=True, exist_ok=True)

        # Generate the updated source file at the corresponding path.
        with open(updated_path, 'w') as f:
            f.write(updated.code)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description="""Fix up source that uses the dlp client library.

The existing sources are NOT overwritten but are copied to output_dir with changes made.

Note: This tool operates at a best-effort level at converting positional
      parameters in client method calls to keyword based parameters.
      Cases where it WILL FAIL include
      A) * or ** expansion in a method call.
      B) Calls via function or method alias (includes free function calls)
      C) Indirect or dispatched calls (e.g. the method is looked up dynamically)

      These all constitute false negatives. The tool will also detect false
      positives when an API method shares a name with another method.
""")
    parser.add_argument(
        '-d',
        '--input-directory',
        required=True,
        dest='input_dir',
        help='the input directory to walk for python files to fix up',
    )
    parser.add_argument(
        '-o',
        '--output-directory',
        required=True,
        dest='output_dir',
        help='the directory to output files fixed via un-flattening',
    )
    args = parser.parse_args()
    input_dir = pathlib.Path(args.input_dir)
    output_dir = pathlib.Path(args.output_dir)
    if not input_dir.is_dir():
        print(
            f"input directory '{input_dir}' does not exist or is not a directory",
            file=sys.stderr,
        )
        sys.exit(-1)

    if not output_dir.is_dir():
        print(
            f"output directory '{output_dir}' does not exist or is not a directory",
            file=sys.stderr,
        )
        sys.exit(-1)

    if os.listdir(output_dir):
        print(
            f"output directory '{output_dir}' is not empty",
            file=sys.stderr,
        )
        sys.exit(-1)

    fix_files(input_dir, output_dir)
