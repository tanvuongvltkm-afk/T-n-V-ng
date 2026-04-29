const fs = require('fs');
let text = fs.readFileSync('firestore.rules', 'utf8');

text = text.replace(/let userEmail = \(request.auth\.token\.email != null\) \? request.auth.token.email : "";/g, 
  `let userEmail = (request.auth != null && request.auth.token != null && "email" in request.auth.token) ? request.auth.token.email : "";`
);

fs.writeFileSync('firestore.rules', text);
