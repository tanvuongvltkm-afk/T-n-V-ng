const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// App logo
content = content.replace(
  "disabled={!canEdit}",
  "disabled={!canEditUI}"
).replace(
  "className={`${canEdit ? 'cursor-pointer' : 'cursor-default group'} relative shrink-0`}",
  "className={`${canEditUI ? 'cursor-pointer' : 'cursor-default group'} relative shrink-0`}"
).replace(
  "{canEdit && (\\n                    <div className=\"absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-sm text-white\">\\n                       <Upload size={12} />\\n                    </div>\\n                  )}",
  "{canEditUI && (\n                    <div className=\"absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-sm text-white\">\n                       <Upload size={12} />\n                    </div>\n                  )}"
);

// Tab icons
content = content.replace(/\{canEdit && <input type="file" id="upload-tab-/g, "{canEditUI && <input type=\"file\" id=\"upload-tab-");
content = content.replace(/htmlFor=\{canEdit \? "upload-tab-/g, "htmlFor={canEditUI ? \"upload-tab-");
content = content.replace(/id="upload-tab-characters" accept="image\/\*" className="hidden" onChange=\{\(e\) => handleTabIconUpload\('characters', e\)\} disabled=\{\!canEdit\}/g, "id=\"upload-tab-characters\" accept=\"image/*\" className=\"hidden\" onChange={(e) => handleTabIconUpload('characters', e)} disabled={!canEditUI}");
content = content.replace(/id="upload-tab-factions" accept="image\/\*" className="hidden" onChange=\{\(e\) => handleTabIconUpload\('factions', e\)\} disabled=\{\!canEdit\}/g, "id=\"upload-tab-factions\" accept=\"image/*\" className=\"hidden\" onChange={(e) => handleTabIconUpload('factions', e)} disabled={!canEditUI}");
content = content.replace(/id="upload-tab-artifacts" accept="image\/\*" className="hidden" onChange=\{\(e\) => handleTabIconUpload\('artifacts', e\)\} disabled=\{\!canEdit\}/g, "id=\"upload-tab-artifacts\" accept=\"image/*\" className=\"hidden\" onChange={(e) => handleTabIconUpload('artifacts', e)} disabled={!canEditUI}");
content = content.replace(/id="upload-tab-episodes" \n                        accept="image\/\*" \n                        className="hidden" \n                        onChange=\{\(e\) => handleTabIconUpload\('episodes', e\)\} \n                        disabled=\{\!canEdit\}/g, "id=\"upload-tab-episodes\" \n                        accept=\"image/*\" \n                        className=\"hidden\" \n                        onChange={(e) => handleTabIconUpload('episodes', e)} \n                        disabled={!canEditUI}");

// The hover camera icon overlays for tab icons
content = content.replace(/\{canEdit && \(\n                          <div className="absolute inset-0 bg-ink\/50/g, "{canEditUI && (\n                          <div className=\"absolute inset-0 bg-ink/50");
content = content.replace(/\{canEdit && \(\n                            <div className="absolute inset-0 bg-ink\/50/g, "{canEditUI && (\n                            <div className=\"absolute inset-0 bg-ink/50");

// The background sidebar
content = content.replace(/\{canEdit && \(\n                 <label className="cursor-pointer p-1 text-wood\/40/g, "{canEditUI && (\n                 <label className=\"cursor-pointer p-1 text-wood/40");


// Share Project UI Role updates
content = content.replace(
  "const newCollaborators = action === 'add' \n        ? Array.from(new Set([...collaborators, emailLower]))\n        : collaborators.filter(e => e !== emailLower);",
  "const newCollaborators = action === 'add' \n        ? Array.from(new Set([...collaborators, emailLower]))\n        : collaborators.filter(e => e !== emailLower);"
);

fs.writeFileSync('src/App.tsx', content);
