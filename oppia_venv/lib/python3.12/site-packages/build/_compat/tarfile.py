from __future__ import annotations

import sys
import tarfile


TYPE_CHECKING = False

if TYPE_CHECKING:
    TarFile = tarfile.TarFile

# Per https://peps.python.org/pep-0706/, the "data" filter will become
# the default in Python 3.14. The first series of releases with the filter
# had a broken filter that could not process symlinks correctly.
elif (
    (3, 9, 18) <= sys.version_info < (3, 10)
    or (3, 10, 13) <= sys.version_info < (3, 11)
    or (3, 11, 5) <= sys.version_info < (3, 12)
    or (3, 12) <= sys.version_info < (3, 14)
):

    class TarFile(tarfile.TarFile):  # pragma: no cover
        extraction_filter = staticmethod(tarfile.data_filter)

else:
    TarFile = tarfile.TarFile  # pragma: no cover


__all__ = [
    'TarFile',
]
