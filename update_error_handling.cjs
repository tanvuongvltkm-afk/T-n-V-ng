const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add handleFirebaseError & quotaExceeded state
content = content.replace(
  "const [hasShownReadOnlyNotice, setHasShownReadOnlyNotice] = useState(false);",
  "const [hasShownReadOnlyNotice, setHasShownReadOnlyNotice] = useState(false);\n  const [quotaExceeded, setQuotaExceeded] = useState(false);\n\n  const handleFirebaseError = (error: any, contextStr: string) => {\n    console.error(`Lỗi ${contextStr}:`, error);\n    if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit')) {\n      setQuotaExceeded(true);\n    }\n  };\n"
);


// 2. Add error handler to project queries
content = content.replace(
  "const unsubscribeShared = onSnapshot(doc(db, 'projects', activeProjectId), (snapshot) => {",
  "const unsubscribeShared = onSnapshot(doc(db, 'projects', activeProjectId), (snapshot) => {"
).replace(
  "    });\n\n    return () => unsubscribeShared();",
  "    }, (error) => handleFirebaseError(error, \"đồng bộ dự án chung\"));\n\n    return () => unsubscribeShared();"
);

content = content.replace(
  "const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {",
  "const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {"
).replace(
  "        }\n      }\n    });\n\n    return () => unsubscribeProjects();",
  "        }\n      }\n    }, (error) => handleFirebaseError(error, \"tải danh sách dự án\"));\n\n    return () => unsubscribeProjects();"
);

content = content.replace(
  "const unsubscribeUI = onSnapshot(doc(db, `projects/${activeProjectId}/config`, 'ui'), (snapshot) => {",
  "const unsubscribeUI = onSnapshot(doc(db, `projects/${activeProjectId}/config`, 'ui'), (snapshot) => {"
).replace(
  "      }\n    });\n\n    return () => unsubscribeUI();",
  "      }\n    }, (error) => handleFirebaseError(error, \"đồng bộ cấu hình UI\"));\n\n    return () => unsubscribeUI();"
);


// 3. Update the existing error handlers
content = content.replace(
  "), (error) => {\n      console.error(\"Lỗi đồng bộ tập phim:\", error);\n    });",
  "), (error) => handleFirebaseError(error, \"đồng bộ tập phim\"));"
);
content = content.replace(
  "), (error) => {\n      console.error(\"Lỗi đồng bộ nhân vật:\", error);\n    });",
  "), (error) => handleFirebaseError(error, \"đồng bộ nhân vật\"));"
);
content = content.replace(
  "), (error) => {\n      console.error(\"Lỗi đồng bộ hồi truyện:\", error);\n    });",
  "), (error) => handleFirebaseError(error, \"đồng bộ hồi truyện\"));"
);
content = content.replace(
  "), (error) => {\n      console.error(\"Lỗi đồng bộ bang phái:\", error);\n    });",
  "), (error) => handleFirebaseError(error, \"đồng bộ bang phái\"));"
);
content = content.replace(
  "), (error) => {\n      console.error(\"Lỗi đồng bộ bí bảo:\", error);\n    });",
  "), (error) => handleFirebaseError(error, \"đồng bộ bí bảo\"));"
);


// 4. Add the QuotaExceeded Modal
content = content.replace(
  "        {/* --- Global Action Menu --- */}",
  `
        {/* --- Quota Exceeded Modal --- */}
        {quotaExceeded && (
          <div className="fixed inset-0 bg-ink/90 backdrop-blur z-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-gold/50 shadow-2xl relative animate-scale-in text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
                <AlertCircle size={32} className="text-cinnabar" />
              </div>
              <h2 className="text-xl font-display font-black uppercase text-cinnabar mb-3 tracking-wider">Nội Lực Cạn Kiệt</h2>
              <p className="text-wood leading-relaxed font-serif italic mb-6">
                Giới hạn truy cập ngân khố (Firebase Free Tier Quota) trong ngày đã vượt mức tối đa. Chư vị đại hiệp xin hãy chờ đến canh ba (sau 0h) để nội lực phục hồi tự nhiên, hoặc nâng cấp đan điền (nâng cấp gói Firebase) để tiếp tục thao tác!
              </p>
              <p className="text-sm text-jade/70 italic mb-6">Mã lỗi: resource-exhausted</p>
              <button 
                onClick={() => setQuotaExceeded(false)}
                className="px-6 py-3 bg-wood text-white rounded-full font-bold shadow-lg hover:bg-ink transition-all uppercase text-sm tracking-widest w-full"
              >
                Đã Rõ
              </button>
            </div>
          </div>
        )}

        {/* --- Global Action Menu --- */}`
);

fs.writeFileSync('src/App.tsx', content);
