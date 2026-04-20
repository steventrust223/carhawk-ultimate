// =========================================================
// FILE: PAM_AIEngine.gs — Layer 2 OpenAI Evaluation
// Project Arbitrage Module — Quantum Workbook Ecosystem
// =========================================================

function runPAMAIEvaluation() {
  const log = [];
  const push = (msg, cat) => { log.push({ time: new Date().toLocaleTimeString(), cat: cat || 'AI', msg }); console.log(msg); };

  try {
    push('AI Evaluation starting…', 'START');

    // Settings
    const settingsResult = getPAMSettings();
    const cfg = settingsResult.settings;
    const aiThreshold  = parseFloat(cfg.PAM_AIThreshold)  || 60;
    const aiModel      = cfg.PAM_AIModel || 'gpt-4o-mini';
    const maxPerRun    = parseInt(cfg.PAM_MaxAIPerRun)     || 20;

    const apiKey = getOpenAIKey_();
    if (!apiKey) throw new Error('OpenAI API key is empty. Set it in the cell referenced by PAM_APIKeyCell setting.');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const matchesSheet = ss.getSheetByName('PAM_Matches');
    if (!matchesSheet || matchesSheet.getLastRow() < 2) throw new Error('PAM_Matches sheet has no data.');

    const matchData = matchesSheet.getRange(2, 1, matchesSheet.getLastRow() - 1, 25).getValues();

    // Load needs and projects for context
    const needsMap  = buildNeedsMap_();
    const projMap   = buildProjectsMap_();

    // Identify qualifying rows
    const queue = [];
    matchData.forEach((row, idx) => {
      if (!row[0]) return;
      const score   = parseFloat(row[15]) || 0;
      const verdict = pamSafeStr_(row[17]);
      if (score >= aiThreshold && (!verdict || verdict.startsWith('AI Error'))) {
        queue.push({ rowIndex: idx + 2, data: row });
      }
    });

    push(queue.length + ' matches qualify for AI evaluation (score ≥ ' + aiThreshold + ').', 'INFO');
    push('Processing up to ' + maxPerRun + ' per run.', 'INFO');

    const toProcess = queue.slice(0, maxPerRun);
    let processed = 0, errors = 0;

    toProcess.forEach((item, i) => {
      if (i > 0) Utilities.sleep(1100); // rate limiting

      const row      = item.data;
      const matchId  = pamSafeStr_(row[0]);
      const projectId= pamSafeStr_(row[2]);
      const projName = pamSafeStr_(row[3]);
      const needId   = pamSafeStr_(row[4]);
      const needItem = pamSafeStr_(row[5]);
      const secNeedId= pamSafeStr_(row[6]);
      const title    = pamSafeStr_(row[7]);
      const desc     = pamSafeStr_(row[8]);
      const platform = pamSafeStr_(row[9]);
      const asking   = parseFloat(row[11]) || 0;
      const score    = parseFloat(row[15]) || 0;

      push('Evaluating ' + matchId + ': "' + title.substring(0,60) + '"…', 'EVAL');

      // Get need details
      const need = needsMap[needId] || {};
      const proj = projMap[projectId] || {};

      // Build secondary need context
      let secNeedContext = '';
      if (secNeedId && needsMap[secNeedId]) {
        const sn = needsMap[secNeedId];
        const sp = projMap[sn.projectId] || {};
        secNeedContext = '\n\nSECONDARY PROJECT MATCH:\nProject: ' + (sp.name || sn.projectId) + '\nNeed: ' + sn.item + ' (Target: $' + (sn.targetPrice || '?') + ')';
      }

      const prompt = buildAIPrompt_(projName, proj, need, needItem, title, desc, asking, platform, score, secNeedContext);

      try {
        const response = callOpenAI_(apiKey, aiModel, prompt);
        const parsed   = pamParseJSON_(response);

        if (!parsed) {
          matchesSheet.getRange(item.rowIndex, 18).setValue('AI Error — retry');
          push('JSON parse failed for ' + matchId, 'WARN');
          errors++;
          return;
        }

        const verdictMap = {
          'Buy for Project': 'Buy for Project',
          'Buy + Flip Extra': 'Buy for Project + Resale',
          'Watch': 'Watch',
          'Pass': 'Pass'
        };

        const values = [
          [
            parsed.fit_verdict        || 'Possible Fit',
            parsed.compatibility_insight || '',
            parsed.strategy           || '',
            parsed.risk_flags         || 'None identified',
            parsed.negotiation_angle  || ''
          ]
        ];
        // Write AI columns R–V (18–22)
        matchesSheet.getRange(item.rowIndex, 18, 1, 5).setValues(values);
        // Write Recommended Action column W (23)
        const rec = verdictMap[parsed.strategy] || parsed.strategy || '';
        matchesSheet.getRange(item.rowIndex, 23).setValue(rec);

        push(matchId + ' → ' + (parsed.fit_verdict || 'evaluated'), 'OK');
        processed++;

      } catch (apiErr) {
        matchesSheet.getRange(item.rowIndex, 18).setValue('AI Error — retry');
        push('API error for ' + matchId + ': ' + apiErr.toString(), 'ERROR');
        errors++;
      }
    });

    const summary = 'AI evaluation complete. ' + processed + ' evaluated, ' + errors + ' errors. ' + (queue.length - toProcess.length) + ' remaining in queue.';
    push(summary, 'DONE');
    return { success: true, log, summary, processed, errors, remaining: queue.length - toProcess.length };

  } catch (e) {
    const errMsg = 'AI Engine error: ' + e.toString();
    log.push({ time: new Date().toLocaleTimeString(), cat: 'ERROR', msg: errMsg });
    return { success: false, log, error: errMsg };
  }
}

// ── Prompt Builder ────────────────────────────────────────

function buildAIPrompt_(projName, proj, need, needItem, title, desc, asking, platform, score, secContext) {
  return `You are a deal evaluation assistant for a multi-vertical arbitrage operator.

PROJECT: ${projName} — ${proj.type || 'Arbitrage'}
NEED: ${needItem || need.item || 'Unknown'}
PREFERRED: ${need.brand || 'Not specified'} / ${need.model || 'Any model'}
CONDITION NEEDED: ${need.condition || 'Any'}
TARGET PRICE: $${need.targetPrice || '?'}
MAX PRICE: $${need.maxPrice || '?'}
BUDGET REMAINING: $${proj.remaining || '?'}${secContext}

LISTING TITLE: ${title}
LISTING DESCRIPTION: ${(desc || '').substring(0, 600)}
ASKING PRICE: $${asking}
PLATFORM: ${platform || 'Unknown'}

MATCH SCORE: ${score}/100

Evaluate this listing against the project need. Return a JSON object with exactly these keys:

{
  "fit_verdict": "Perfect Fit | Likely Fit | Possible Fit | Not Recommended",
  "compatibility_insight": "2-3 sentences on compatibility, what to verify, what might be missing",
  "strategy": "Buy for Project | Buy + Flip Extra | Watch | Pass",
  "risk_flags": "Comma-separated risk factors or 'None identified'",
  "negotiation_angle": "1-2 sentence suggested negotiation approach and target offer price"
}

Be practical and specific. This operator flips assets for profit and builds projects on tight budgets. Factor in resale potential even for project buys.`;
}

// ── OpenAI API Call ───────────────────────────────────────

function callOpenAI_(apiKey, model, prompt) {
  const payload = {
    model: model || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 500,
    response_format: { type: 'json_object' }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', options);
  const code = response.getResponseCode();
  const text = response.getContentText();

  if (code !== 200) {
    throw new Error('OpenAI API returned ' + code + ': ' + text.substring(0, 200));
  }

  const json = JSON.parse(text);
  if (!json.choices || !json.choices[0]) throw new Error('Unexpected OpenAI response shape.');
  return json.choices[0].message.content;
}

// ── Context Loaders ───────────────────────────────────────

function buildNeedsMap_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PAM_Needs');
  const map = {};
  if (!sheet || sheet.getLastRow() < 2) return map;
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 19).getValues();
  data.forEach(r => {
    if (!r[0]) return;
    map[pamSafeStr_(r[0])] = {
      id:         pamSafeStr_(r[0]),
      projectId:  pamSafeStr_(r[1]),
      item:       pamSafeStr_(r[3]),
      brand:      pamSafeStr_(r[7]),
      model:      pamSafeStr_(r[8]),
      condition:  pamSafeStr_(r[10]),
      targetPrice:parseFloat(r[13]) || 0,
      maxPrice:   parseFloat(r[14]) || 0
    };
  });
  return map;
}

function buildProjectsMap_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PAM_Projects');
  const map = {};
  if (!sheet || sheet.getLastRow() < 2) return map;
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues();
  data.forEach(r => {
    if (!r[0]) return;
    map[pamSafeStr_(r[0])] = {
      id:        pamSafeStr_(r[0]),
      name:      pamSafeStr_(r[1]),
      type:      pamSafeStr_(r[2]),
      budget:    parseFloat(r[5]) || 0,
      spent:     parseFloat(r[6]) || 0,
      remaining: parseFloat(r[7]) || 0,
      status:    pamSafeStr_(r[9])
    };
  });
  return map;
}

// ── Full Cycle ────────────────────────────────────────────

function runPAMFullCycle() {
  const logicResult = runPAMLogicEngine();
  Utilities.sleep(500);
  const aiResult    = runPAMAIEvaluation();
  return {
    success: logicResult.success && aiResult.success,
    logic: logicResult,
    ai: aiResult,
    log: (logicResult.log || []).concat(aiResult.log || [])
  };
}
