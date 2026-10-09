import os
import glob
import re
import time

base_dir = "c:/Users/msi user/Documents/Github_Project/SportX/web"
html_files = glob.glob(os.path.join(base_dir, "**/*.html"), recursive=True)

version = str(int(time.time()))

for file in html_files:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    
    # replace existing ?v=XXX with new version
    content = re.sub(r'(\.css|\.js)(\?v=\d+)?', r'\1?v=' + version, content)
    
    with open(file, "w", encoding="utf-8") as f:
        f.write(content)
        
print("Assets busted")
