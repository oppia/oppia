# Copyright 2026 vishnu
# Licensed under the Apache License, Version 2.0
#
# This file makes 'assets' a Python package.
# You can add initialization code for assets here if needed.

"""Initialization for the assets package."""

# Example: list all submodules for easier imports
__all__ = [
    "collections",
    "images",
    "audio",
    "videos",
    "explorations",
]

# Optional: you can define constants or utility functions here
ASSETS_PATH = "assets/"

def get_asset_path(filename: str) -> str:
    """Return the full path to an asset."""
    return f"{ASSETS_PATH}{filename}"
