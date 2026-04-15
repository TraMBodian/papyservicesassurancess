#!/usr/bin/env node
/**
 * OWASP Top 10 (2021) — Hook PostToolUse Edit|Write
 * Analyse le fichier modifié et émet des avertissements de sécurité.
 * Ne bloque pas (exit 0). Les alertes apparaissent dans la console Claude Code.
 */

const fs = require('fs');
const path = require('path');

// ── Lecture stdin ──────────────────────────────────────────────────────────────
let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => (raw += c));
process.stdin.on('end', () => {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }

  const filePath = input?.tool_input?.file_path;
  if (!filePath) process.exit(0);

  // Chemin absolu si relatif
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) process.exit(0);

  const ext = path.extname(absPath).toLowerCase().slice(1);
  const SCANNED = ['ts', 'tsx', 'js', 'jsx', 'java', 'py', 'go', 'php', 'rb', 'kt'];
  if (!SCANNED.includes(ext)) process.exit(0);

  let content;
  try { content = fs.readFileSync(absPath, 'utf8'); } catch { process.exit(0); }

  const lines = content.split('\n');
  const issues = [];

  // Helper : retourne les numéros de lignes non-commentées qui matchent
  function scan(regex, tag, desc) {
    lines.forEach((l, i) => {
      const trimmed = l.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('#')) return;
      if (regex.test(l)) {
        issues.push({ line: i + 1, tag, desc, snippet: l.trim().slice(0, 80) });
      }
    });
  }

  // ── A01 · Broken Access Control ───────────────────────────────────────────
  scan(/permitAll\(\)|@PermitAll|allowAll\(\)|noSecurity/i,
    'A01-AccessControl',
    'Accès non restreint — vérifiez que ce n\'est pas une route publique involontaire');

  // ── A02 · Cryptographic Failures ──────────────────────────────────────────
  scan(/\bMD5\b|MessageDigest\.getInstance\("MD5"|\.md5\(|hashlib\.md5/i,
    'A02-Crypto',
    'Algorithme MD5 (cassé) — utilisez SHA-256 ou bcrypt');
  scan(/\bSHA-?1\b|getInstance\("SHA-?1"\)|hashlib\.sha1/i,
    'A02-Crypto',
    'Algorithme SHA-1 (faible) — utilisez SHA-256 minimum');
  scan(/(password|passwd|secret|api_key|apikey|token)\s*[:=]\s*["'][^"']{3,}["']/i,
    'A02-Crypto',
    'Secret/credential hardcodé en clair — utilisez des variables d\'environnement');

  // ── A03 · Injection ───────────────────────────────────────────────────────
  scan(/\beval\s*\(|new Function\s*\(/,
    'A03-Injection',
    'eval() / new Function() — risque d\'injection de code JS');
  scan(/\.innerHTML\s*=(?!\s*["'`]<)|\.outerHTML\s*=/,
    'A03-Injection',
    'innerHTML = variable — risque XSS (utilisez textContent ou DOMPurify)');
  scan(/dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/,
    'A03-Injection',
    'dangerouslySetInnerHTML — assurez-vous que la valeur est sanitisée');
  scan(/Runtime\.getRuntime\(\)\.exec|ProcessBuilder|exec\s*\(/,
    'A03-Injection',
    'Exécution de commande système — risque d\'injection de commande');
  scan(/("|\+|concat)\s*(SELECT|INSERT|UPDATE|DELETE|DROP)\b/i,
    'A03-Injection',
    'Concaténation SQL détectée — utilisez des requêtes paramétrées / ORM');

  // ── A05 · Security Misconfiguration ───────────────────────────────────────
  scan(/csrf\s*[=:]\s*(false|disabled)|CsrfTokenRepository|\.csrf\(\)\s*\.disable/i,
    'A05-Misconfig',
    'CSRF désactivé — assurez-vous que toutes les routes mutantes sont protégées');
  scan(/cors\s*[=:]\s*\*|allowedOrigins\s*\(\s*"\*"\)|origins\s*=\s*\["?\*"?\]/i,
    'A05-Misconfig',
    'CORS * (toutes origines) — restreignez aux domaines attendus');
  scan(/console\.log\s*\([^)]*password|logger\.(info|debug)\s*\([^)]*password/i,
    'A05-Misconfig',
    'Mot de passe dans les logs — ne jamais journaliser de données sensibles');

  // ── A07 · Identification & Authentication Failures ─────────────────────────
  scan(/algorithm\s*[=:]\s*["']none["']|alg\s*[=:]\s*["']none["']/i,
    'A07-Auth',
    'JWT algorithm "none" — algorithme non signé, falsification possible');
  scan(/localStorage\.setItem\s*\([^,]*[Tt]oken|sessionStorage\.setItem\s*\([^,]*[Tt]oken/,
    'A07-Auth',
    'JWT dans localStorage — préférez httpOnly cookie pour les tokens d\'auth');

  // ── A08 · Software & Data Integrity Failures ──────────────────────────────
  scan(/JSON\.parse\s*\([^)]*req\.|JSON\.parse\s*\([^)]*input\.|JSON\.parse\s*\([^)]*body\./,
    'A08-Integrity',
    'JSON.parse() sur données non validées — ajoutez un schéma de validation (Zod, Yup)');

  // ── A09 · Security Logging & Monitoring Failures ──────────────────────────
  scan(/catch\s*\([^)]*\)\s*\{\s*\}/,
    'A09-Logging',
    'Bloc catch vide — les exceptions silencieuses masquent des incidents de sécurité');

  // ── A10 · SSRF ────────────────────────────────────────────────────────────
  scan(/fetch\s*\(\s*req\.|fetch\s*\(\s*request\.|fetch\s*\(\s*url\s*\+|RestTemplate.*url/,
    'A10-SSRF',
    'URL potentiellement contrôlée par l\'utilisateur dans une requête HTTP — risque SSRF');

  // ── Rapport ───────────────────────────────────────────────────────────────
  if (issues.length === 0) process.exit(0);

  const relPath = path.relative(process.cwd(), absPath);
  process.stderr.write(`\n🔒 OWASP Top 10 — ${relPath} (${issues.length} point${issues.length > 1 ? 's' : ''} à vérifier)\n`);

  const grouped = {};
  issues.forEach(i => {
    if (!grouped[i.tag]) grouped[i.tag] = [];
    grouped[i.tag].push(i);
  });

  Object.entries(grouped).forEach(([tag, list]) => {
    process.stderr.write(`\n  [${tag}]\n`);
    list.forEach(i => {
      process.stderr.write(`    Ligne ${i.line}: ${i.desc}\n`);
      process.stderr.write(`    ↳ ${i.snippet}\n`);
    });
  });

  process.stderr.write('\n  ℹ️  Ce rapport est informatif — corrigez si nécessaire.\n\n');
  process.exit(0); // Non bloquant
});
