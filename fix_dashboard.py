with open("src/components/Dashboard.tsx", "r") as f:
    content = f.read()

import re

# We will replace one of the placeholder sections or add to the second column.
# Let's insert a new widget above "System Activity Feed"

doc_widget = """
          <motion.div variants={item} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 mb-6">
             <h3 className="font-bold text-lg text-rose-600 tracking-tight mb-1 flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
               Imminent Document Expirations
             </h3>
             <p className="text-xs text-neutral-500 mb-4 font-medium">Assets requiring immediate attention for registration, insurance, or inspection renewal.</p>
             <div className="space-y-3">
               {[
                 { title: 'Vehicle Reg. Renewal', asset: 'TRK-2940 (Ford F-150)', date: 'Expires in 3 days', type: 'registration' },
                 { title: 'Insurance Policy', asset: 'EXC-992 (Cat Excavator)', date: 'Expires in 7 days', type: 'insurance' },
                 { title: 'Safety Inspection', asset: 'CRN-002 (Tower Crane)', date: 'Expires in 12 days', type: 'inspection' },
               ].map((doc, i) => (
                 <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100/50">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-rose-900">{doc.title}</p>
                      <p className="text-xs font-medium text-rose-700/70 mt-0.5">{doc.asset}</p>
                      <p className="text-xs font-bold text-rose-600 mt-1">{doc.date}</p>
                    </div>
                 </div>
               ))}
             </div>
          </motion.div>
"""

content = content.replace('<div className="flex flex-col gap-6">', '<div className="flex flex-col">')
content = content.replace('<motion.div variants={item} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col h-[500px]">', doc_widget + '          <motion.div variants={item} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col flex-1 min-h-[400px]">')

with open("src/components/Dashboard.tsx", "w") as f:
    f.write(content)
print("done")
