from typing import Optional, Sequence
from scripts import build

def main(args: Optional[Sequence[str]] = None) -> None:
    """The main method of this script."""

    build.safe_delete_directory_tree('build/')

    hashes = build.generate_hashes()
    build.generate_build_directory(hashes)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when build.py is used as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
