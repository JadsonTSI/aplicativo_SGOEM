import os

start_dir = r"c:\Users\jadso\Documents\abanfar-bf"
image_extensions = ('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp')

print("Image files found in abanfar-bf:")
for root, dirs, files in os.walk(start_dir):
    # Skip venv
    if "venv" in root.split(os.sep):
        continue
    for file in files:
        if file.lower().endswith(image_extensions):
            rel_path = os.path.relpath(os.path.join(root, file), start_dir)
            print(f" - {rel_path} ({os.path.getsize(os.path.join(root, file))} bytes)")
