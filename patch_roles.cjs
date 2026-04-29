const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Roles Definition
code = code.replace(
  "const [shareRole, setShareRole] = useState<'collaborator' | 'viewer'>('collaborator');",
  "const [shareRole, setShareRole] = useState<'admin' | 'collaborator' | 'viewer'>('collaborator');"
);

code = code.replace(
  "const [collaboratorRoles, setCollaboratorRoles] = useState<Record<string, 'collaborator' | 'viewer'>>({});",
  "const [collaboratorRoles, setCollaboratorRoles] = useState<Record<string, 'admin' | 'collaborator' | 'viewer'>>({});"
);

// 2. Add admin logic to handleShareProject
code = code.replace(
  "const handleShareProject = async (targetEmail: string, action: 'add' | 'remove', role: 'collaborator' | 'viewer' = 'collaborator') => {",
  "const handleShareProject = async (targetEmail: string, action: 'add' | 'remove', role: 'admin' | 'collaborator' | 'viewer' = 'collaborator') => {"
);

code = code.replace(
  "if (action === 'add') alert(`Đã thiết lập quyền ${role === 'collaborator' ? 'Cộng Tác Viên' : 'Khách Xem'} cho ${emailLower}`);",
  "if (action === 'add') alert(`Đã thiết lập quyền ${role === 'admin' ? 'Quản Sự (Admin)' : (role === 'collaborator' ? 'Cộng Tác Viên' : 'Khách Xem')} cho ${emailLower}`);"
);

// 3. UI Component for new user Role Selection
const oldInputHTML = `<div className="flex gap-2">
                      <input 
                        type="email"
                        readOnly={!canShare}
                        placeholder="email@vidu.com"
                        className="flex-1 bg-white border border-gold/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cinnabar/20"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && canShare && handleShareProject(shareEmail, 'add')}
                      />
                      {canShare && (
                        <button 
                          onClick={() => handleShareProject(shareEmail, 'add', shareRole)}
                          disabled={isSharing || !shareEmail}
                          className="px-6 py-3 bg-cinnabar text-white rounded-xl font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {isSharing ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                          Mời
                        </button>
                      )}
                    </div>`;

const newInputHTML = `<div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="email"
                          readOnly={!canShare}
                          placeholder="email@vidu.com"
                          className="flex-1 min-w-0 bg-white border border-gold/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cinnabar/20"
                          value={shareEmail}
                          onChange={(e) => setShareEmail(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && canShare && handleShareProject(shareEmail, 'add', shareRole)}
                        />
                        <select
                          disabled={!canShare}
                          value={shareRole}
                          onChange={(e: any) => setShareRole(e.target.value)}
                          className="w-32 bg-white border border-gold/50 rounded-xl px-2 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-cinnabar/20 text-wood"
                        >
                           <option value="viewer">Khách Xem</option>
                           <option value="collaborator">Cộng Tác Viên</option>
                           <option value="admin">Quản Sự (Admin)</option>
                        </select>
                      </div>
                      {canShare && (
                        <button 
                          onClick={() => handleShareProject(shareEmail, 'add', shareRole)}
                          disabled={isSharing || !shareEmail}
                          className="px-6 py-3 bg-cinnabar text-white rounded-xl font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          {isSharing ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                          Mời
                        </button>
                      )}
                    </div>`;

code = code.replace(oldInputHTML, newInputHTML);

// 4. Existing users logic
const oldRoleText = `<div className="flex flex-col"><span className="text-sm text-wood font-medium">{email}</span><span className="text-[10px] uppercase text-jade">{collaboratorRoles[email] === 'viewer' ? 'Khách Xem' : 'Cộng Tác Viên'}</span></div>`;
const newRoleText = `<div className="flex flex-col">
    <span className="text-sm text-wood font-medium">{email}</span>
    {canShare ? (
      <select 
         value={collaboratorRoles[email] || 'collaborator'}
         onChange={(e: any) => handleShareProject(email, 'add', e.target.value)}
         className="text-[10px] uppercase text-jade bg-transparent border-none p-0 cursor-pointer focus:outline-none"
      >
         <option value="viewer">Khách Xem</option>
         <option value="collaborator">Cộng Tác Viên</option>
         <option value="admin">Quản Sự (Admin)</option>
      </select>
    ) : (
      <span className="text-[10px] uppercase text-jade">
        {collaboratorRoles[email] === 'admin' ? 'Quản Sự (Admin)' : (collaboratorRoles[email] === 'viewer' ? 'Khách Xem' : 'Cộng Tác Viên')}
      </span>
    )}
</div>`;

code = code.replace(oldRoleText, newRoleText);

// 5. App Logo Header text
code = code.replace(
  "return '👑 Chưởng Môn';",
  "return '👑 Chưởng Môn'; if (canShare) return '🏅 Quản Sự';"
);

// 6. canDelete - only tanvuongvltkm@gmail.com
code = code.replace(
  "const canDelete = isProjectOwner || (user && collaboratorRoles[user.email || ''] === 'collaborator'); // Or admin when added",
  "const canDelete = isProjectOwner || (user && user.email === 'tanvuongvltkm@gmail.com');"
);

// 7. canShare - Owner or Admin
code = code.replace(
  "const canShare = isProjectOwner;",
  "const canShare = isProjectOwner || (user && collaboratorRoles[user.email || ''] === 'admin') || (user && user.email === 'tanvuongvltkm@gmail.com');"
);

// 8. canEdit UI/Themes - Owner or Admin
code = code.replace(
  "const canEditUI = isProjectOwner;",
  "const canEditUI = isProjectOwner || (user && collaboratorRoles[user.email || ''] === 'admin') || (user && user.email === 'tanvuongvltkm@gmail.com');"
);

fs.writeFileSync('src/App.tsx', code);
