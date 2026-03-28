from pathlib import Path
from typing import List, Tuple


class FileUtils:
    @staticmethod
    def process_local_path(local_path: str) -> Tuple[List[str], int]:
        """
        Get all file paths under the local_path, recursively.
        If local_path is a file, return it directly.
        Returns a tuple: (list of file paths, total size in bytes)
        """
        if not Path(local_path).exists():
            error_message = f"Path does not exist: {local_path}"
            raise ValueError(error_message)

        path = Path(local_path)
        if path.is_file():
            return [local_path], path.stat().st_size
        if path.is_dir():
            return FileUtils.find_files_recursively(local_path)

        return [], 0

    @staticmethod
    def find_files_recursively(folder_path: str) -> Tuple[List[str], int]:
        """
        Recursively finds all files under a folder and calculates total size.
        """
        result: List[str] = []
        total_size = 0

        for file_path in Path(folder_path).rglob("*"):
            if file_path.is_file():
                resolved_path = file_path.resolve()
                result.append(str(resolved_path))
                total_size += resolved_path.stat().st_size

        return result, total_size
