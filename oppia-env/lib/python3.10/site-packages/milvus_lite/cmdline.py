# Copyright (C) 2019-2024 Zilliz. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

import argparse
import pathlib
import json
from tqdm import tqdm

import numpy as np

from pymilvus import Collection, connections, utility, DataType
from pymilvus.bulk_writer import LocalBulkWriter, BulkFileType


class MilvusEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, np.ndarray):
            return o.tolist()
        if isinstance(o, np.float32) or isinstance(o, np.float16):
            return float(o)
        return json.JSONEncoder.default(self, o)


def dump_func(args):
    return dump_collection(args.db_file, args.collection, args.path)


def bfloat16_to_float32(byte_data):
    bfloat16_array = np.frombuffer(byte_data, dtype=np.uint16)
    bfloat16_as_uint16 = bfloat16_array.view(np.uint16)
    float32_as_uint32 = (bfloat16_as_uint16.astype(np.uint32)) << 16
    float32_array = float32_as_uint32.view(np.float32)
    return float32_array


def binary_to_int_list(packed_bytes):
    byte_array = np.frombuffer(packed_bytes, dtype=np.uint8)
    return np.unpackbits(byte_array)


def dump_collection(db_file, collection_name, path):
    if not pathlib.Path(db_file).is_file():
        raise RuntimeError('db_file: %s not exists' % db_file)

    if not pathlib.Path(path).parent.is_dir():
        raise RuntimeError('dump path(%s)\'s parent dir not exists: %s not exists' % path)

    connections.connect("default", uri=db_file)
    if not utility.has_collection(collection_name):
        raise RuntimeError("Collection: %s not exists" % collection_name)
    
    collection = Collection(collection_name)
    total_rows = collection.query("", output_fields=["count(*)"])[0]["count(*)"]
    is_auto = collection.primary_field.auto_id
    pk_name = collection.primary_field.name
    bfloat16_fields = [field.name for field in collection.schema.fields if field.dtype == DataType.BFLOAT16_VECTOR]
    bin_fields = [field.name for field in collection.schema.fields if field.dtype == DataType.BINARY_VECTOR]

    writer = LocalBulkWriter(
            schema=collection.schema,
            local_path=path,
            segment_size=512*1024*1024,
            file_type=BulkFileType.JSON
    )

    it = collection.query_iterator(output_fields=['*'])
    progress_bar = tqdm(total=total_rows, desc=f"Dump collection {collection_name}'s data")
    while True:
        rows = it.next()
        if not rows:
            it.close()
            break
        if is_auto:
            for row in rows:
                del row[pk_name]
        if bfloat16_fields:
            for row in rows:
                for name in bfloat16_fields:
                    if name in row:
                        row[name] = bfloat16_to_float32(row[name])

        if bin_fields:
            for row in rows:
                for name in bin_fields:
                    if name in row:
                        row[name] = binary_to_int_list(row[name][0])

        rows = json.loads(json.dumps(rows, cls=MilvusEncoder))
        for row in rows:
            writer.append_row(row)
        progress_bar.update(len(rows))
    writer.commit()
    print("Dump collection %s success" % collection_name)


def main():
    parser = argparse.ArgumentParser(prog='milvus-lite')
    subparsers = parser.add_subparsers(description='milvus-lite command line tool.')

    dump_cmd = subparsers.add_parser('dump', help='milvus-lite dump cmd')
    dump_cmd.add_argument('-d', '--db-file', type=str, help='milvus lite db file')
    dump_cmd.add_argument('-c', '--collection', type=str, help='collection that need to be dumped')
    dump_cmd.add_argument('-p', '--path', type=str, help='dump file storage path')
    dump_cmd.set_defaults(func=dump_func)

    args = parser.parse_args()
    if hasattr(args, 'func'):
        args.func(args)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
