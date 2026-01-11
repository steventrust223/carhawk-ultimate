# 🦅🏘️ CompanyHub Unified Workspace - Quick Reference Card

**For: CarHawk Ultimate + Quantum Real Estate Analyzer**

---

## 🔧 Quick Setup (5 Steps)

1. **Get API Key**: CompanyHub → Settings → Integrations → API Keys → Copy
2. **Add to CarHawk**: Config sheet → `COMPANYHUB_API_KEY` → Paste
3. **Add to Quantum**: Settings sheet → `COMPANYHUB_API_KEY` → Same key
4. **Create Pipelines**: See table below (9 total)
5. **Test**: Both systems → Test CRM Connection

---

## 📊 Pipeline Structure (9 Pipelines)

### VEHICLE (CarHawk)
| Pipeline ID | Purpose | Deals |
|-------------|---------|-------|
| `vehicle_flip_pipeline` | Flips & resales | Quick flip, repair flip, enthusiast |
| `vehicle_rental_pipeline` | Turo/rental holds | Buy & hold for rental income |

### REAL ESTATE (Quantum)
| Pipeline ID | Purpose |
|-------------|---------|
| `wholesaling_pipeline` | Assignment/wholesaling |
| `sub2_pipeline` | Subject-To deals |
| `wrap_pipeline` | Wraparound financing |
| `jv_pipeline` | Joint ventures |
| `rental_pipeline` | Real estate rentals (STR/MTR/LTR) |
| `flip_pipeline` | Fix & flip |
| `virtual_pipeline` | Virtual wholesaling |

---

## 🏷️ Critical Field: `deal_type`

**REQUIRED FOR ALL DEALS**

| Value | System | When |
|-------|--------|------|
| `VEHICLE` | CarHawk | All vehicle deals |
| `REAL_ESTATE` | Quantum | All property deals |

**Why**: Enables filtering, conditional fields, reporting separation

---

## 🔍 Essential Saved Views

Create these views in CompanyHub:

1. **🔥 Hot Deals**: `deal_classifier = "🔥 HOT DEAL"` + Sort by lead speed
2. **Vehicle Only**: `deal_type = "VEHICLE"` + All vehicle pipelines
3. **Real Estate Only**: `deal_type = "REAL_ESTATE"` + All RE pipelines
4. **Immediate Action**: `time_since_posted_mins < 120` + Hot deals
5. **All Rentals**: Pipeline = `vehicle_rental_pipeline` OR `rental_pipeline`

---

## 📋 Custom Fields Checklist

### Universal (Both Systems)
- [ ] `deal_type` (Dropdown: VEHICLE / REAL_ESTATE) **← CRITICAL**
- [ ] `lead_source` (Dropdown)
- [ ] `lead_speed_score` (Number 0-100)
- [ ] `overall_deal_score` (Number 0-100)
- [ ] `deal_classifier` (Dropdown: 🔥 HOT / 💎 GEM / ✅ SOLID / ❌ PASS)
- [ ] `seller_motivation_score` (Number 1-10)
- [ ] `hot_seller` (Checkbox)
- [ ] `seller_message` (Long Text)
- [ ] `risk_warnings` (Long Text)
- [ ] `listing_url` (URL)

### Vehicle Fields (25+)
- [ ] `vehicle_year`, `vehicle_make`, `vehicle_model`
- [ ] `vehicle_body_type`, `enthusiast_vehicle`
- [ ] `mileage`, `condition`, `title_status`
- [ ] `asking_price`, `mao`, `offer_target`, `expected_profit`
- [ ] `flip_strategy`
- [ ] `rental_viable`, `monthly_net`, `breakeven_months`
- [ ] `platform`, `distance_miles`, `hazard_flags`

### Real Estate Fields (25+)
- [ ] `property_address`, `property_city`, `property_state`, `property_zip`
- [ ] `bedrooms`, `bathrooms`, `sqft`, `property_type`
- [ ] `asking_price_re`, `estimated_arv`
- [ ] `mao_wholesale`, `mao_sub2`, `mao_wrap`, `mao_rental`
- [ ] `equity_percent`, `estimated_repairs_re`
- [ ] `flip_strategy_recommendation`
- [ ] `seller_situation`, `psychology_profile`
- [ ] `location_heat`, `neighborhood_grade`

**See full list**: `COMPANYHUB_UNIFIED_WORKSPACE.md`

---

## 🚀 Daily Workflow

### Morning (9:00 AM)
1. Open CompanyHub → "All New Leads" view
2. Check `deal_type` to identify vehicle vs. property
3. Review top 10 by `overall_deal_score`
4. Filter: `time_since_posted_mins < 120` (urgent)
5. Contact 🔥 HOT DEALS immediately

### Throughout Day
- Update stages as deals progress
- Log all seller communications
- Sync new deals 2x/day (CarHawk + Quantum)

### Evening (5:00 PM)
- Review "Follow-Up Queue" view
- Check `seller_motivation_score ≥ 7` + Last contact > 3 days
- Schedule tomorrow's follow-ups

---

## 🤝 Team Roles

| Role | Access | Focus |
|------|--------|-------|
| **Owner** | All pipelines | HOT DEALS, strategy |
| **Vehicle Specialist** | Vehicle pipelines only | CarHawk deals |
| **RE Specialist** | Real estate pipelines only | Quantum deals |
| **VA** | All pipelines, "New" stage | Data entry, initial contact |
| **Acquisitions** | "Contacted" → "Contract" | Offers, negotiations |
| **Dispositions** | "Contract" → "Closed" | Marketing, buyers |

---

## 💡 Pro Tips

### 1. Combo Deals (Same Seller)
- Seller has vehicle + property? **ASK!**
- CompanyHub shows: "Contact has 2 deals"
- Offer package deal for leverage

### 2. Cross-System Insights
- Vehicle buyers in ZIP 30309? → Target RE in 30309
- RE seller in divorce? → Ask about vehicles too

### 3. Value Settings
- **Vehicle Flip**: Value = Expected profit
- **Vehicle Rental**: Value = Annual net × 3
- **RE Wholesale**: Value = Assignment fee
- **RE Rental**: Value = Annual cash flow × 10

### 4. Mobile App
- Download CompanyHub app (iOS/Android)
- Enable push notifications for HOT DEALS
- Never miss urgent leads

---

## ⚠️ Common Mistakes

❌ **Forgetting to set `deal_type`** → Fields won't display correctly
✅ Set automatically by both systems when syncing

❌ **Using wrong pipeline names** → Sync will fail
✅ Use EXACT names: `vehicle_flip_pipeline` (not "Vehicle Flips")

❌ **Syncing manually when auto-sync enabled** → Duplicates
✅ Choose one: Auto-sync OR manual (not both)

❌ **Not reviewing CRM Sync Logs** → Errors pile up
✅ Check logs weekly, fix failed syncs

---

## 🆘 Troubleshooting

### "API Connection Failed"
1. Check API key in Config/Settings sheet
2. Verify key has correct permissions in CompanyHub
3. Check CompanyHub account is active

### "Pipeline Not Found"
1. Verify pipeline created with EXACT name
2. Check spelling: `vehicle_flip_pipeline` (all lowercase, underscores)
3. Re-sync after fixing

### "Duplicate Deals"
1. Check both auto-sync AND manual sync not running
2. Use CompanyHub merge feature
3. Disable duplicate sync method

### "Custom Fields Not Populating"
1. Verify field names match EXACTLY (case-sensitive)
2. Check `deal_type` is set correctly
3. Conditional fields: Only show for matching deal type

---

## 📞 Support

- **CarHawk Issues**: Check System Logs sheet
- **Quantum Issues**: Check CRM Sync Log sheet
- **CompanyHub API**: https://docs.companyhub.com/api
- **Full Guide**: `COMPANYHUB_UNIFIED_WORKSPACE.md`

---

## ✅ Go-Live Checklist

**Before starting**:
- [ ] API key configured in BOTH systems
- [ ] All 9 pipelines created
- [ ] All custom fields created (70+ total)
- [ ] `deal_type` field exists and set as required
- [ ] Test connections successful (both systems)
- [ ] Test deals synced successfully (both systems)
- [ ] Saved views created (5+ views)
- [ ] Team members added with permissions
- [ ] Mobile app installed
- [ ] CRM Sync Log monitoring enabled

**You're ready!** 🚀

---

## 📈 Success Metrics (Track Monthly)

- **Win Rate by Pipeline**: Which converts best?
- **Avg Deal Value**: Most profitable pipeline?
- **Time to Close**: Fastest pipeline?
- **Lead Source ROI**: Best platform?
- **Deal Type Split**: Vehicles vs. RE profit?

---

**Print this page for quick reference at your desk!**

🦅🏘️ **One CRM. Two Systems. Unlimited Opportunities.**
