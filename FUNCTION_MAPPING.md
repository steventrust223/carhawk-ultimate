# UI Function Mapping - Quick Reference

## Legend
- ✅ **Exists** - Function ready to use in codebase
- 🟢 **Wire** - Exists but needs wrapper
- 🟡 **Stub** - Placeholder in ui-api.gs
- 🟠 **Check** - May exist, needs verification

---

## Complete Function Mapping

| # | Template | Function Name | Status | Line# | Data Source | Phase 2 Action |
|---|----------|---------------|--------|-------|-------------|----------------|
| 1 | DealGallery | `UI_getDealGalleryData()` | 🟡 Stub | - | Master Database + Verdict | Read sheets, join data, calc stats |
| 2 | QuickActions | `runImportPipeline()` | 🟢 Wire | - | Wrapper for quantumImportSync | Call line 592 function |
| 3 | QuickActions | `syncQuantumCRM()` | ✅ Exists | 4740 | - | Already works |
| 4 | QuickActions | `runDeduplication()` | 🟡 Stub | - | Master Database | Find/remove duplicates |
| 5 | QuickActions | `executeQuantumAIBatch()` | 🟠 Check | ? | Master Database + Verdict | Find or create batch AI |
| 6 | QuickActions | `runDeepMarketScan()` | ✅ Exists | 4726 | - | Already works |
| 7 | QuickActions | `updateAllVerdicts()` | 🟡 Stub | - | Verdict sheet | Recalculate all rows |
| 8 | QuickActions | `exportQuantumSMS()` | ✅ Exists | 1721 | - | Already works |
| 9 | QuickActions | `exportQuantumCRM()` | ✅ Exists | 1981 | - | Already works |
| 10 | QuickActions | `generateQuantumCampaigns()` | ✅ Exists | 4826 | - | Already works |
| 11 | QuickActions | `runSystemDiagnostics()` | ✅ Exists | 4998 | - | Already works |
| 12 | QuickActions | `generateQuantumWeekly()` | ✅ Exists | 4563 | - | Already works |
| 13 | DealAnalyzer | `UI_analyzeDeal(payload)` | 🟡 Stub | - | OpenAI API or existing function | Wire to AI analysis |
| 14 | DealAnalyzer | `UI_saveDeal(payload)` | 🟡 Stub | - | Master Database | Append row to database |
| 15 | DealCalculator | `UI_saveCalculation(data)` | 🟡 Stub | - | Flip ROI Calculator | Append calculation row |
| 16 | SpeedToLead | `UI_getSpeedToLeadQueue()` | 🟡 Stub | - | Leads Tracker | Read leads, calc age/priority |
| 17 | SpeedToLead | `UI_contactLead(id, method)` | 🟡 Stub | - | Leads + SMS/Calls logs | Update status, log action |
| 18 | SpeedToLead | `UI_snoozeLead(id, minutes)` | 🟡 Stub | - | Leads Tracker | Set snooze timestamp |
| 19 | PipelineView | `UI_getPipelineData()` | 🟡 Stub | - | Leads Tracker | Group by stage, calc stats |
| 20 | FollowUpSeq | `UI_getFollowUpSequences()` | 🟡 Stub | - | Campaign Queue or Settings | Read sequence configs |
| 21 | FollowUpSeq | `UI_saveFollowUpSequence(data)` | 🟡 Stub | - | Campaign Queue or Settings | Save sequence config |
| 22 | FollowUpSeq | `UI_deleteFollowUpSequence(id)` | 🟡 Stub | - | Campaign Queue or Settings | Delete sequence |
| 23 | FollowUpSeq | `UI_launchSequence(id)` | 🟡 Stub | - | Campaign Queue | Add contacts to queue |
| 24 | KnowledgeBase | `UI_getKnowledgeBaseItems()` | 🟡 Stub | - | Knowledge Base sheet | Read all KB items |
| 25 | Settings | `UI_getSettings()` | 🟠 Check | - | Settings sheet | Wrap getQuantumSetting() |
| 26 | Settings | `UI_saveSettings(settings)` | 🟠 Check | - | Settings sheet | Wrap setQuantumSetting() |
| 27 | Integration | `UI_getIntegrations()` | 🟡 Stub | - | PropertiesService | Read encrypted keys |
| 28 | Integration | `UI_testIntegration(name, cfg)` | 🟡 Stub | - | External APIs | Test actual connections |
| 29 | Integration | `UI_saveIntegrations(data)` | 🟡 Stub | - | PropertiesService | Store encrypted keys |
| 30 | VINDecoder | `UI_decodeVIN(vin)` | 🟡 Stub | - | NHTSA API | Call vpic.nhtsa.dot.gov |

---

## Summary Statistics

**Total Functions:** 30
- ✅ Exists (ready): 9 (30%)
- 🟢 Wire (wrapper needed): 1 (3%)
- 🟠 Check (verify): 3 (10%)
- 🟡 Stub (implement): 17 (57%)

**Critical Path (9 already working):**
1. syncQuantumCRM ✅
2. runDeepMarketScan ✅
3. exportQuantumSMS ✅
4. exportQuantumCRM ✅
5. generateQuantumCampaigns ✅
6. runSystemDiagnostics ✅
7. generateQuantumWeekly ✅

**Phase 2 Priority (implement these first):**
1. UI_getDealGalleryData (most visible)
2. UI_getSettings / UI_saveSettings (needed for config)
3. UI_getPipelineData (workflow critical)
4. UI_analyzeDeal (AI feature)

---

## Sheet-to-UI Mapping

| Sheet Name | UI Templates Using It | Primary Functions |
|------------|----------------------|-------------------|
| Master Database | DealGallery, Pipeline, QuickActions | UI_getDealGalleryData, UI_saveDeal, runDeduplication |
| Verdict | DealGallery, DealAnalyzer | UI_getDealGalleryData, UI_analyzeDeal, updateAllVerdicts |
| Leads Tracker | SpeedToLead, Pipeline | UI_getSpeedToLeadQueue, UI_getPipelineData, UI_contactLead |
| Campaign Queue | FollowUpSequences | UI_getFollowUpSequences, UI_saveFollowUpSequence, UI_launchSequence |
| Flip ROI Calculator | DealCalculator | UI_saveCalculation |
| Knowledge Base | KnowledgeBase | UI_getKnowledgeBaseItems |
| Settings | Settings | UI_getSettings, UI_saveSettings |
| Integrations | IntegrationManager | UI_getIntegrations, UI_saveIntegrations |
| SMS Conversations | SpeedToLead | UI_contactLead (logging) |
| AI Call Logs | SpeedToLead | UI_contactLead (logging) |

---

## Phase 2 Wiring Order (Recommended)

### Week 1: Core Display
1. UI_getDealGalleryData → Read Master Database + Verdict
2. UI_getSettings / UI_saveSettings → Wrap existing functions
3. UI_getPipelineData → Group Leads by stage

### Week 2: Actions & Tools
4. UI_analyzeDeal → Wire to AI or create new
5. UI_getSpeedToLeadQueue → Calculate lead ages
6. UI_decodeVIN → Call NHTSA API

### Week 3: Advanced
7. UI_getFollowUpSequences + save/delete/launch
8. UI_getIntegrations + save/test (use PropertiesService)
9. UI_getKnowledgeBaseItems → Read KB sheet

### Week 4: Calculations
10. Wire QuickActions stubs (runImportPipeline, etc.)
11. UI_saveCalculation → Append to calculator
12. UI_saveDeal → Append to database
13. UI_contactLead / UI_snoozeLead → Update leads

---

## Quick Deploy Checklist

- [ ] Copy all 13 HTML files to Apps Script
- [ ] Copy ui-api.gs to Apps Script
- [ ] Test menu items open (should show placeholder data)
- [ ] Verify include('UI_Components') loads correctly
- [ ] Check for console errors (should be none)
- [ ] Begin Phase 2 wiring as needed

---

**For detailed Phase 2 instructions, see comments in ui-api.gs**
**For full audit results, see AUDIT_REPORT.md**
