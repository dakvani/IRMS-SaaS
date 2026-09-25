with open("src/components/Assets.tsx", "r") as f:
    content = f.read()

import re

# Fix ternary multiple children
content = content.replace('                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 flex items-start gap-4 mb-4">', '<>\n                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 flex items-start gap-4 mb-4">')
content = content.replace('                        <button onClick={handleUnassign} className=\\"bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-lg text-sm font-bold w-full hover:bg-red-100 transition-colors mb-4\\">Unassign / Return to Available</button>\n                      ) : selectedAsset.site ? (', '                        <button onClick={handleUnassign} className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-lg text-sm font-bold w-full hover:bg-red-100 transition-colors mb-4">Unassign / Return to Available</button>\n                        </>\n                      ) : selectedAsset.site ? (')

content = content.replace('                        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-4">', '<>\n                        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-4">')
content = content.replace('                        <button onClick={handleUnassign} className=\\"bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-lg text-sm font-bold w-full hover:bg-red-100 transition-colors mb-4\\">Unassign / Return to Available</button>\n                      ) : (', '                        <button onClick={handleUnassign} className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-lg text-sm font-bold w-full hover:bg-red-100 transition-colors mb-4">Unassign / Return to Available</button>\n                        </>\n                      ) : (')

with open("src/components/Assets.tsx", "w") as f:
    f.write(content)
print("done")
