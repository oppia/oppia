#!/bin/bash

OUTDIR=.
PROTO_DIR="milvus-proto/proto"

python -m grpc_tools.protoc -I ${PROTO_DIR} --python_out=${OUTDIR} --pyi_out=${OUTDIR} ${PROTO_DIR}/common.proto
python -m grpc_tools.protoc -I ${PROTO_DIR} --python_out=${OUTDIR} --pyi_out=${OUTDIR} ${PROTO_DIR}/schema.proto
python -m grpc_tools.protoc -I ${PROTO_DIR} --python_out=${OUTDIR} --pyi_out=${OUTDIR} ${PROTO_DIR}/feder.proto
python -m grpc_tools.protoc -I ${PROTO_DIR} --python_out=${OUTDIR} --pyi_out=${OUTDIR} ${PROTO_DIR}/msg.proto
python -m grpc_tools.protoc -I ${PROTO_DIR} --python_out=${OUTDIR} --pyi_out=${OUTDIR} ${PROTO_DIR}/rg.proto
python -m grpc_tools.protoc -I ${PROTO_DIR} --python_out=${OUTDIR} --pyi_out=${OUTDIR} --grpc_python_out=${OUTDIR}  ${PROTO_DIR}/milvus.proto

if [[ $(uname -s) == "Darwin" ]]; then
    if ! brew --prefix --installed gnu-sed >/dev/null 2>&1; then
        brew install gnu-sed
    fi
    export PATH="/usr/local/opt/gsed/libexec/gnubin:$PATH"
fi

sed -i 's/import common_pb2 as common__pb2/from . import common_pb2 as common__pb2/' $OUTDIR/*py
sed -i 's/import schema_pb2 as schema__pb2/from . import schema_pb2 as schema__pb2/' $OUTDIR/*py
sed -i 's/import milvus_pb2 as milvus__pb2/from . import milvus_pb2 as milvus__pb2/' $OUTDIR/*py
sed -i 's/import feder_pb2 as feder__pb2/from . import feder_pb2 as feder__pb2/' $OUTDIR/*py
sed -i 's/import msg_pb2 as msg__pb2/from . import msg_pb2 as msg__pb2/' $OUTDIR/*py
sed -i 's/import rg_pb2 as rg__pb2/from . import rg_pb2 as rg__pb2/' $OUTDIR/*py

sed -i 's/import common_pb2 as _common_pb2/from . import common_pb2 as _common_pb2/' $OUTDIR/*pyi
sed -i 's/import schema_pb2 as _schema_pb2/from . import schema_pb2 as _schema_pb2/' $OUTDIR/*pyi
sed -i 's/import milvus_pb2 as _milvus_pb2/from . import milvus_pb2 as _milvus_pb2/' $OUTDIR/*pyi
sed -i 's/import feder_pb2 as _feder_pb2/from . import feder_pb2 as _feder_pb2/' $OUTDIR/*pyi
sed -i 's/import msg_pb2 as _msg_pb2/from . import msg_pb2 as _msg_pb2/' $OUTDIR/*pyi
sed -i 's/import rg_pb2 as _rg_pb2/from . import rg_pb2 as _rg_pb2/' $OUTDIR/*pyi

echo "Success to generate the python proto files."
