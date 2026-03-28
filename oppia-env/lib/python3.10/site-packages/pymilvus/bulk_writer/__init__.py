from importlib.util import find_spec

expected_pkgs = ["minio", "azure", "requests", "pyarrow"]

missing = [pkg for pkg in expected_pkgs if find_spec(pkg) is None]

if len(missing) > 0:
    msg = f"Missing packages: {missing}. Please install bulk_writer by pip install pymilvus[bulk_writer] first"
    raise ModuleNotFoundError(msg)


from .bulk_import import (
    bulk_import,
    get_import_progress,
    list_import_jobs,
)
from .constants import BulkFileType
from .local_bulk_writer import LocalBulkWriter
from .remote_bulk_writer import RemoteBulkWriter

__all__ = [
    "BulkFileType",
    "LocalBulkWriter",
    "RemoteBulkWriter",
    "bulk_import",
    "get_import_progress",
    "list_import_jobs",
]
