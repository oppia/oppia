import logging
import re
import subprocess
from contextlib import suppress
from importlib.metadata import PackageNotFoundError, version

log = logging.getLogger(__name__)


__version__ = "0.0.0.dev"


with suppress(PackageNotFoundError):
    __version__ = version("pymilvus")


def get_commit(version: str = "", short: bool = True) -> str:
    """get commit return the commit for a specific version like `xxxxxx.dev12`"""

    version_info = r"((\d+)\.(\d+)\.(\d+))((rc)(\d+))?(\.dev(\d+))?"
    # 2.0.0rc9.dev12
    p = re.compile(version_info)

    target_v = __version__ if version == "" else version
    match = p.match(target_v)

    if match is not None:
        match_version = match.groups()
        if match_version[7] is not None:
            if match_version[4] is not None:
                v = str(int(match_version[6]) - 1)
                target_tag = "v" + match_version[0] + match_version[5] + v
            else:
                target_tag = "v" + ".".join(str(int("".join(match_version[1:4])) - 1).split(""))
            target_num = int(match_version[-1])
        elif match_version[4] is not None:
            target_tag = "v" + match_version[0] + match_version[4]
            target_num = 0
        else:
            target_tag = "v" + match_version[0]
            target_num = 0
    else:
        return f"Version: {target_v} isn't the right form"

    try:
        cmd = ["git", "rev-list", "--reverse", "--ancestry-path", f"{target_tag}^..HEAD"]
        log.info(f"git cmd: {' '.join(cmd)}")
        result = subprocess.check_output(cmd).decode("ascii").strip().split("\n")

        length = 7 if short else 40
        return result[target_num][:length]
    except Exception as e:
        return f"Get commit for version {target_v} wrong: {e}"
