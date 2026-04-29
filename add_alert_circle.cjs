const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "  RotateCcw\n} from 'lucide-react';",
  "  RotateCcw,\n  AlertCircle\n} from 'lucide-react';"
);

fs.writeFileSync('src/App.tsx', content);
