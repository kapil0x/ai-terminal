// Quick Demo of Semantic Search Output
console.log('\x1b[34m\x1b[1m🔍 Semantic Search Demo: AI Terminal\x1b[0m');
console.log('\x1b[90mSimulating CodeT5 embeddings-based search\x1b[0m\n');

console.log('\x1b[36mQuery: "json parsing function"\x1b[0m');
console.log('\x1b[90mFinding semantically similar code patterns...\x1b[0m\n');

console.log('\x1b[33mStep 1: Generating query embedding with CodeT5...\x1b[0m');
console.log('\x1b[90m✓ Query vectorized to 768-dimensional embedding\x1b[0m\n');

console.log('\x1b[33mStep 2: Computing cosine similarity with codebase...\x1b[0m');
console.log('\x1b[90m✓ Compared against 1,247 embedded code files\x1b[0m\n');

console.log('\x1b[34m\x1b[1m📊 Results (ranked by semantic similarity):\x1b[0m\n');

const results = [
  { path: './include/nlohmann/detail/input/parser.hpp', sim: 92.1, lang: 'cpp', funcs: 'parse, parse_value, parse_object' },
  { path: './include/nlohmann/detail/input/json_sax.hpp', sim: 88.4, lang: 'cpp', funcs: 'sax_parse, parse_document' },
  { path: './include/nlohmann/detail/conversions/from_json.hpp', sim: 85.7, lang: 'cpp', funcs: 'from_json, convert' },
  { path: './include/nlohmann/json.hpp', sim: 82.3, lang: 'cpp', funcs: 'parse, dump, operator[]' },
  { path: './tests/src/unit-class_parser.cpp', sim: 75.9, lang: 'cpp', funcs: 'test_parser, test_errors' }
];

results.forEach((r, i) => {
  console.log(`\x1b[33m${i+1}. ${r.path}\x1b[0m`);
  console.log(`\x1b[90m   Similarity: ${r.sim}%\x1b[0m`);
  console.log(`\x1b[90m   Language: ${r.lang}\x1b[0m`);
  console.log(`\x1b[90m   Functions: ${r.funcs}\x1b[0m\n`);
});

console.log('\x1b[32m\x1b[1m✨ Key Advantages:\x1b[0m');
console.log('\x1b[32m• Found JSON parsing code WITHOUT exact keyword matches\x1b[0m');
console.log('\x1b[32m• Understands semantic relationships (parse → conversion)\x1b[0m');
console.log('\x1b[32m• Ranks by relevance, not just text matching\x1b[0m');
console.log('\x1b[32m• Discovers related functionality automatically\x1b[0m\n');

console.log('\x1b[36m\x1b[1m🚀 To run actual search:\x1b[0m');
console.log('\x1b[36m1. npm install\x1b[0m');
console.log('\x1b[36m2. node index.js embed-learn\x1b[0m');
console.log('\x1b[36m3. node index.js search "json parsing function"\x1b[0m');