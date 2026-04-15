#!/usr/bin/env node
/**
 * OWASP LLM Top 10 (2025) — Hook UserPromptSubmit
 * Analyse le prompt utilisateur avant traitement par Claude.
 * Émet des avertissements sans bloquer (exit 0).
 * Bloque uniquement si injection directe confirmée (exit 2).
 */

const fs = require('fs');

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => (raw += c));
process.stdin.on('end', () => {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }

  const prompt = (input?.prompt || '').toLowerCase();
  const promptOrig = input?.prompt || '';

  if (!prompt.trim()) process.exit(0);

  const issues   = []; // Avertissements (non bloquants)
  const critical = []; // Injections directes (bloquants)

  // ── LLM01 · Prompt Injection ───────────────────────────────────────────────
  // Patterns de jailbreak / injection directe
  const injectionPatterns = [
    /ignore (all )?(previous|prior|above) instructions?/i,
    /disregard (all )?(your|previous|prior) (instructions?|rules?|guidelines?)/i,
    /forget (everything|all) (you|above|previously)/i,
    /you are now (in )?DAN( mode)?/i,
    /act as (if you (are|have) no|an? (unrestricted|jailbroken|uncensored))/i,
    /\[system\]|\[INST\]|<\|im_start\|>|<\|system\|>/i,
    /pretend (you have no|there are no) (restrictions?|rules?|guidelines?)/i,
  ];
  injectionPatterns.forEach(p => {
    if (p.test(promptOrig)) {
      critical.push({ tag: 'LLM01-PromptInjection', desc: 'Tentative de jailbreak / injection de prompt détectée', match: promptOrig.match(p)?.[0] });
    }
  });

  // Injection via contenu externe (moins sévère)
  const softInjection = [
    /new instruction:/i,
    /system prompt:/i,
    /your new role is/i,
    /override (the )?(above|previous|system)/i,
  ];
  softInjection.forEach(p => {
    if (p.test(promptOrig)) {
      issues.push({ tag: 'LLM01-PromptInjection', desc: 'Contenu potentiellement injecté détecté dans le prompt', match: promptOrig.match(p)?.[0] });
    }
  });

  // ── LLM02 · Sensitive Information Disclosure ───────────────────────────────
  // Credentials dans le prompt
  if (/password\s*[:=]\s*\S{3,}|passwd\s*[:=]\s*\S{3,}/i.test(promptOrig)) {
    issues.push({ tag: 'LLM02-SensitiveData', desc: 'Mot de passe détecté dans le prompt — ne pas partager de credentials avec l\'IA' });
  }
  // Numéros de carte bancaire (Luhn-like pattern)
  if (/\b(?:\d[ -]?){13,16}\b/.test(promptOrig) && /carte|card|visa|mastercard|cvv/i.test(promptOrig)) {
    issues.push({ tag: 'LLM02-SensitiveData', desc: 'Numéro de carte bancaire potentiel détecté' });
  }
  // Clés API / tokens
  if (/(api[_-]?key|access[_-]?token|bearer|secret[_-]?key)\s*[:=]\s*[A-Za-z0-9+/=_\-]{20,}/i.test(promptOrig)) {
    issues.push({ tag: 'LLM02-SensitiveData', desc: 'Clé API / token détecté dans le prompt — ne partagez pas de secrets avec l\'IA' });
  }
  // Demande de révélation du system prompt
  if (/(show|reveal|print|repeat|display|what is|tell me).*system prompt/i.test(promptOrig) ||
      /what (are|were) your instructions/i.test(promptOrig)) {
    issues.push({ tag: 'LLM07-SystemPromptLeakage', desc: 'Tentative d\'extraction du system prompt détectée' });
  }

  // ── LLM06 · Excessive Agency ──────────────────────────────────────────────
  // Demandes d'actions massives irréversibles sans confirmation
  const excessiveAgency = [
    { p: /delete (all|every|the entire)|drop (all tables?|the database|everything)/i, desc: 'Suppression massive demandée — confirmer explicitement chaque cible' },
    { p: /send (emails?|messages?) to (all|everyone|every user)/i, desc: 'Envoi massif de messages — vérifiez les destinataires avant exécution' },
    { p: /without (asking|confirmation|my (permission|approval))/i, desc: 'Demande d\'action autonome sans confirmation — risque d\'agence excessive' },
    { p: /automatically (deploy|push|delete|drop|send|remove)/i, desc: 'Automatisation d\'action irréversible — conservez un contrôle humain' },
  ];
  excessiveAgency.forEach(({ p, desc }) => {
    if (p.test(promptOrig)) {
      issues.push({ tag: 'LLM06-ExcessiveAgency', desc });
    }
  });

  // ── LLM09 · Misinformation ────────────────────────────────────────────────
  if (/(génère|generate|create|write).*(fausse|fake|false|fictive).*(facture|invoice|contrat|contract|document|certificat)/i.test(promptOrig)) {
    issues.push({ tag: 'LLM09-Misinformation', desc: 'Génération de document falsifié détectée — vérifiez la conformité légale' });
  }

  // ── LLM10 · Unbounded Consumption ────────────────────────────────────────
  if ((promptOrig.match(/répète|repeat/gi) || []).length > 3 ||
      /répète (.*) (\d{3,}|cent|mille) fois/i.test(promptOrig)) {
    issues.push({ tag: 'LLM10-UnboundedConsumption', desc: 'Demande de répétition excessive détectée — risque de consommation de ressources' });
  }

  // ── Rapport ───────────────────────────────────────────────────────────────

  // Cas critique : injection confirmée → bloquer
  if (critical.length > 0) {
    process.stderr.write('\n🚨 OWASP LLM01 — Injection de prompt bloquée\n\n');
    critical.forEach(i => {
      process.stderr.write(`  [${i.tag}] ${i.desc}\n`);
      if (i.match) process.stderr.write(`  ↳ "${i.match}"\n`);
    });
    process.stderr.write('\n  ⛔ Le prompt a été bloqué par la politique de sécurité.\n\n');

    // Sortie structurée pour Claude Code
    const output = {
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        permissionDecision: 'deny',
        permissionDecisionReason: 'OWASP LLM01 — Tentative de jailbreak / injection de prompt détectée et bloquée.',
      }
    };
    process.stdout.write(JSON.stringify(output));
    process.exit(2);
  }

  // Avertissements non bloquants
  if (issues.length > 0) {
    process.stderr.write('\n⚠️  OWASP LLM Top 10 — Points de vigilance détectés\n');
    const grouped = {};
    issues.forEach(i => {
      if (!grouped[i.tag]) grouped[i.tag] = [];
      grouped[i.tag].push(i);
    });
    Object.entries(grouped).forEach(([tag, list]) => {
      process.stderr.write(`\n  [${tag}]\n`);
      list.forEach(i => process.stderr.write(`    • ${i.desc}\n`));
    });
    process.stderr.write('\n  ℹ️  Rapport informatif — le prompt est traité normalement.\n\n');
  }

  process.exit(0); // Non bloquant pour les avertissements
});
