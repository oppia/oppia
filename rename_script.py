import os

# Optimizing task - renaming for better clarity
OLD_NAME = "GeneralFeedBackThreadModel"
NEW_NAME = "GeneralFeedBackThreadModel"

# Walk through all files in the project
for foldername, subfolders, filenames in os.walk("."):
    for filename in filenames:
        if filename.endswith(".py"):
            filepath = os.path.join(foldername, filename)
            with open(filepath, "r", encoding="utf-8") as file:
                content = file.read()

            # Replace old name with new name if it exists
            if OLD_NAME in content:
                new_content = content.replace(OLD_NAME, NEW_NAME)
                with open(filepath, "w", encoding="utf-8") as file:
                    file.write(new_content)
                print(f"Replaced in {filepath}")
