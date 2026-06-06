/* ============================================================
   REPS — OPNS-430 Archetype Bank (Deterministic, Verified)
   9 core archetypes from the PRD + sourced operations drill sets
   ============================================================ */

import type { Archetype, RouterStem } from "./content/schemas";
export type { Archetype };

export const ARCHETYPES: Archetype[] = [
  {
    id: "eoq",
    name: "Economic Order Quantity",
    shortName: "EOQ",
    description:
      "Minimize total ordering + holding cost by finding optimal batch size.",
    verificationStatus: "verified",
    triggers: [
      "order size",
      "order quantity",
      "how many to order",
      "minimize ordering + holding",
      "optimal lot size",
    ],
    disqualifiers: [
      "uncertain demand",
      "one-shot buy",
      "perishable",
      "different objective",
      "lead time uncertainty",
    ],
    derivedCondition: "Steady demand, known costs, instantaneous replenishment",
    formula: "Q* = √(2SR / H)",
    formulaVars: {
      "Q*": "Optimal order quantity",
      S: "Fixed ordering cost per order",
      R: "Annual demand rate",
      H: "Annual holding cost per unit",
    },
    trapNotes: [
      "H is annual holding cost — do NOT use unit purchase price alone",
      "R must be in the same time units as H (both annual)",
      "EOQ assumes deterministic demand — add safety stock separately if demand is uncertain",
      "Reorder point (ROP) is separate from EOQ: ROP = d̄ × L",
    ],
    workedExample: {
      stem: "A retailer orders widgets at a fixed cost of $50/order. Annual demand is 5,000 units. Annual holding cost is $2/unit. What is the optimal order quantity?",
      solution: "Q* = √(2 × 50 × 5000 / 2) = √(250,000) ≈ 500 units",
      steps: [
        "Identify S = $50, R = 5,000, H = $2",
        "Plug into Q* = √(2SR/H)",
        "Q* = √(2 × 50 × 5000 / 2) = √250,000",
        "Q* ≈ 500 units",
      ],
    },
    practiceStems: [
      {
        id: "eoq_p1",
        text: "Warm-up: Annual demand is 10,000 units. Ordering cost is $100/order. Holding cost is $4/unit/year. What is Q*?",
        answer: "Q* = √(2 × 100 × 10,000 / 4) = √500,000 ≈ 707 units",
        explanation: "Apply Q* = √(2SR/H) directly. S=100, R=10000, H=4.",
        traps: ["Do not confuse H with purchase price", "Ensure R is annual"],
      },
      {
        id: "eoq_chicagoland",
        text: "Chicagoland Sweets, a commercial bakery, uses flour at a steady rate. It currently orders 16,000 lb every 4 weeks. The bakery runs 5 days/week (≈250 days/year), so one 4-week cycle is 20 operating days. Flour comes in 50-lb bags at $20/bag, placing an order costs $64, and the cost of capital is 25%/year. (a) What is the bakery's annual demand, and is its current ordering policy optimal? (b) Demand then doubles. The purchasing manager wants to keep ordering every 4 weeks; the head chef wants to keep the order size at 16,000 lb. Whose plan is cheaper?",
        answer:
          "(a) $20/50-lb = $0.40/lb → H = 0.25×$0.40 = $0.10/lb-yr. A 4-wk cycle = 20 days → 12.5 orders/yr → R = 16,000×12.5 = 200,000 lb/yr. Holding = H·Q/2 = 0.10×8,000 = $800; Ordering = S·R/Q = 64×12.5 = $800; total $1,600/yr. EOQ = √(2·200,000·64/0.10) = 16,000 lb = current Q → already optimal. (b) Demand 400,000: PM (Q=32,000) → holding $1,600 + ordering $800 = $2,400; Chef (Q=16,000) → holding $800 + ordering $1,600 = $2,400 → identical.",
        explanation:
          "First you must DERIVE R from 'every 4 weeks' (the exam won't hand you annual demand). At Q* holding cost equals ordering cost — use that equality as your optimality check. In (b) both managers sit a factor of √2 off the new optimum (Q* = √(2·400,000·64/0.10) ≈ 22,627 lb), one over-holding and one over-ordering, so the two 'wrong' plans cost exactly the same — EOQ cost is symmetric in multiplicative deviation.",
        traps: [
          "'Every 4 weeks' is not annual demand — convert via operating days first",
          "At Q*, holding cost = ordering cost; use it as the optimality test",
          "Two plans equidistant (×√2) from Q* cost the SAME — don't assume the bigger order is worse",
        ],
      },
      {
        id: "eoq_wine_discount",
        text: "A wine importer sells 90 cases of a label per week (52-week year). Each case costs $78, the cost of capital is 25%/year, and placing an order costs $750. (a) Find the optimal order quantity and the resulting annual ordering-plus-holding cost. (b) The supplier offers 2% off the case price if the importer orders at least 1,200 cases at a time. Should the importer take the deal?",
        answer:
          "(a) R = 90×52 = 4,680/yr; H = 0.25×$78 = $19.50. Q* = √(2·750·4,680/19.5) = 600 cases; annual cost = √(2·4,680·750·19.5) = $11,700 (holding = ordering = $5,850). (b) At 2% off, price $76.44 → H = $19.11; unconstrained EOQ ≈ 606 < 1,200, so you must order exactly 1,200. Holding = 19.11×600 = $11,466; ordering = 750×(4,680/1,200) = $2,925; total $14,391. Inventory cost rises $2,691, but purchase savings = 0.02×$78×4,680 = $7,300.80. Net +$4,609.80 → TAKE the deal.",
        explanation:
          "A quantity-discount decision is EOQ plus a comparison: the discount forces an order size (1,200) above the natural EOQ, which RAISES inventory cost — you weigh that increase against the purchase-price savings on the entire annual volume. Compare TOTAL cost (inventory + purchasing), never inventory cost alone.",
        traps: [
          "Recompute H from the DISCOUNTED price, then check whether the unconstrained EOQ already clears the threshold",
          "Weigh purchase savings on ALL units against the inventory-cost increase",
          "The forced order size is the threshold (1,200), not a new EOQ",
        ],
      },
    ],
    rootCauses: [
      { id: "eoq_rc1", label: "Used wrong formula" },
      { id: "eoq_rc2", label: "Misclassified bucket" },
      { id: "eoq_rc3", label: "Confused H with purchase price" },
      { id: "eoq_rc4", label: "Units mismatch (R vs H)" },
    ],
  },
  {
    id: "safety_stock",
    name: "Safety Stock / ROP",
    shortName: "Safety Stock / ROP",
    description:
      "Buffer against demand and lead-time variability; set reorder point.",
    verificationStatus: "verified",
    triggers: [
      "safety stock",
      "reorder point",
      "ROP",
      "stockout risk",
      "service level",
      "lead time variability",
    ],
    disqualifiers: [
      "deterministic demand",
      "no lead time",
      "EOQ context without uncertainty",
    ],
    derivedCondition:
      "Variable demand or lead time, service level target given",
    formula: "SS = z × σ_dL   |   ROP = d̄ × L + SS",
    formulaVars: {
      SS: "Safety stock",
      z: "z-score for target service level",
      σ_dL: "Std dev of demand during lead time = σ_d × √L",
      d̄: "Mean daily demand",
      L: "Lead time in days",
    },
    trapNotes: [
      "Scale σ_d by √L, NOT by L — a classic exam trap",
      "ROP includes the mean demand term: d̄ × L + SS",
      "z = 1.28 for 90%, 1.65 for 95%, 1.96 for 97.5%, 2.33 for 99%",
      "If lead time is also variable: σ_dL = √(L × σ_d² + d̄² × σ_L²)",
    ],
    workedExample: {
      stem: "Daily demand is normally distributed: mean 50, σ=10. Lead time is 4 days. Target service level 95%. Find SS and ROP.",
      solution:
        "σ_dL = 10×√4 = 20. SS = 1.65×20 = 33. ROP = 50×4 + 33 = 233 units.",
      steps: [
        "Compute σ_dL = σ_d × √L = 10 × √4 = 20",
        "Look up z for 95% service level: z = 1.65",
        "SS = z × σ_dL = 1.65 × 20 = 33 units",
        "ROP = d̄ × L + SS = 50 × 4 + 33 = 233 units",
      ],
    },
    practiceStems: [
      {
        id: "ss_p1",
        text: "Warm-up: Mean daily demand = 100, σ_d = 15, lead time = 9 days, service level = 99%. Find SS.",
        answer: "σ_dL = 15×√9 = 45. SS = 2.33×45 ≈ 105 units.",
        explanation: "Scale by √L not L. z=2.33 for 99%.",
        traps: ["Scaling by L instead of √L", "Using wrong z-score"],
      },
      {
        id: "ss_rijul_twostore",
        text: "Rijul's Toys runs two stores with the same mean weekly demand of 40 games and the same 4-week supplier lead time. Weekly demand has σ = 8 at the Evanston store and σ = 4 at the St. Paul store. Each game costs $8.75 and the cost of capital is 20%/year. The target cycle service level is 95%. (a) Find each store's safety stock and reorder point. (b) Which store turns its inventory faster, and why?",
        answer:
          "z(95%) = 1.645; σ_L = σ_wk·√4 = 2·σ_wk; μ_L = 40×4 = 160. Evanston: σ_L = 16 → SS = 1.645×16 ≈ 26.3 → 27; ROP = 160 + 27 = 187. St. Paul: σ_L = 8 → SS ≈ 13.2 → 14; ROP = 160 + 14 = 174. (b) St. Paul turns faster — same mean demand and cycle stock, but lower variability → less safety stock → lower average inventory → higher turns.",
        explanation:
          "σ scales with √L, the mean with L. The comparison is the real point: lower demand variability means less buffer for the same service level, so the steadier store carries less inventory and turns faster. Round safety stock UP — rounding down silently lowers your service level.",
        traps: [
          "Scale σ by √L, never by L",
          "Don't drop the mean term μ·L in the ROP",
          "Round safety stock UP",
        ],
      },
      {
        id: "ss_leadtime_scaling",
        text: "Rijul (previous problem) is told the supplier lead time will rise from 4 weeks to 6 weeks. He reasons: 'Lead time is up 50%, so I'll just raise every reorder point by 50%.' Is he right?",
        answer:
          "No. ROP has two parts that scale differently. The mean term μ·L grows by 6/4 = 1.5×, but safety stock grows only by √(6/4) = √1.5 ≈ 1.225× (SS ∝ √L). Scaling the WHOLE ROP by 50% over-provisions safety stock, which should rise ~22.5%, not 50%.",
        explanation:
          "The √L-vs-L trap as a decision. Total demand over a longer lead time grows ∝ L, but its standard deviation grows only with √L because variances add. A flat percentage bump to the entire ROP conflates the two and ties up excess capital in safety stock. A longer lead time does need more safety stock — just less than proportionally.",
        traps: [
          "Mean demand scales with L; safety stock scales with √L — they can't share one multiplier",
          "A longer lead time needs MORE safety stock, but less than proportionally",
        ],
      },
    ],
    rootCauses: [
      { id: "ss_rc1", label: "Scaled by L instead of √L" },
      { id: "ss_rc2", label: "Forgot mean term in ROP" },
      { id: "ss_rc3", label: "Wrong z-score for service level" },
      { id: "ss_rc4", label: "Misclassified bucket" },
    ],
  },
  {
    id: "risk_pooling",
    name: "Risk Pooling",
    shortName: "Risk Pooling",
    description:
      "Consolidate demand across locations/products to reduce total safety stock.",
    verificationStatus: "verified",
    triggers: [
      "consolidate warehouses",
      "centralize inventory",
      "pooling",
      "aggregate demand",
      "reduce safety stock by combining",
    ],
    disqualifiers: [
      "single location",
      "no variance reduction possible",
      "newsvendor context",
    ],
    derivedCondition: "Multiple independent demand streams can be aggregated",
    formula: "σ_pooled = √(σ₁² + σ₂² + ... + σₙ²)   [if independent]",
    formulaVars: {
      σ_pooled: "Std dev of pooled demand",
      σᵢ: "Std dev of demand at location i",
      ρ: "Correlation between demands (0 = independent)",
    },
    trapNotes: [
      "Pooling only reduces safety stock, NOT cycle stock (EOQ portion)",
      "If demands are correlated (ρ > 0), benefit is reduced",
      "SS savings = z × (Σσᵢ − σ_pooled) × holding cost",
      "Centralization increases transportation/response time — trade-off",
    ],
    workedExample: {
      stem: "Two warehouses each have σ=100 units demand. z=1.65. H=$5. Currently hold SS separately. What is the SS saving from pooling?",
      solution:
        "Separate: 2 × 1.65 × 100 = 330. Pooled: 1.65 × √(100²+100²) = 1.65 × 141 ≈ 233. Saving = 97 units × $5 = $485.",
      steps: [
        "Separate SS = 2 × z × σ = 2 × 1.65 × 100 = 330",
        "Pooled σ = √(100² + 100²) = √20,000 ≈ 141",
        "Pooled SS = 1.65 × 141 ≈ 233",
        "Saving = (330 − 233) × $5 = $485/period",
      ],
    },
    practiceStems: [
      {
        id: "rp_p1",
        text: "Warm-up: Three locations each have σ=50. Demands are independent. z=1.96. What is the ratio of pooled SS to total separate SS?",
        answer:
          "Separate = 3×1.96×50=294. Pooled σ=√(3×50²)=86.6. Pooled SS=1.96×86.6≈170. Ratio≈0.577 = 1/√3.",
        explanation:
          "For n identical independent locations, pooling ratio = 1/√n.",
        traps: [
          "Forgetting that pooling only affects safety stock, not cycle stock",
        ],
      },
      {
        id: "rp_funcolors_lease",
        text: "Fun Colors stocks 75 paint colors. Each color sells 100 cans/week with σ = 40 cans/week (demands independent across colors), the supplier lead time is 2 weeks, each can costs $3.50, and the cost of capital is 20%/year. The target service level is 98%. A vendor offers a tinting machine that lets the store hold one generic base paint and mix any color on demand — pooling all 75 demand streams. What is the most Fun Colors should pay per MONTH to lease it?",
        answer:
          "z(98%) = 2.05. Per color: σ_L = 40×√2 ≈ 56.57 → SS = 2.05×56.57 ≈ 116 cans; ×75 = 8,713 cans of safety stock. Pooled base paint: σ_weekly = √75×40 ≈ 346.4 → σ_L ≈ 489.9 → SS = 2.05×489.9 ≈ 1,006 cans. Reduction = 8,713 − 1,006 = 7,707 cans. H = 0.20×$3.50 = $0.70/can-yr → savings ≈ $5,395/yr ≈ $449/month = max lease.",
        explanation:
          "Pooling independent demand makes the standard deviation grow with √n, not n, so combined safety stock collapses (8,713 → ~1,006 cans). The most you'd pay for the pooling technology is exactly the annual safety-stock holding it saves, expressed monthly. Pooling cuts SAFETY stock only; cycle stock (the EOQ part) is unaffected.",
        traps: [
          "Pooled σ = √n × σ (variances add) → SS falls with √n, not n",
          "Convert the annual holding-cost saving to monthly to compare with the lease",
          "Pooling reduces safety stock only — not cycle stock",
        ],
      },
      {
        id: "rp_casings_chips",
        text: "A radio maker currently builds and stocks two finished models — a Jogger radio and a Biker radio — each with uncertain demand. A redesign would instead stock a generic casing plus a model-specific chip and do final assembly at the retailer (postponement). Compared with today's finished-goods inventory, what happens to (a) casing inventory and (b) chip inventory?",
        answer:
          "(a) Casing inventory FALLS. The casing is now common to both models, so its demand is pooled: combined safety stock ∝ √(σ_J² + σ_B²) < σ_J + σ_B. (b) Chip inventory stays about the SAME. Chips are still model-specific (Jogger vs. Biker), so there is no pooling — you carry two separate buffers, as before.",
        explanation:
          "Postponement pools only the SHARED component. The casing benefits from risk pooling; the variant-specific chips do not. The trap is to claim 'inventory goes down' across the board — only the commonized part improves.",
        traps: [
          "Pooling helps only the SHARED/common component, not variant-specific parts",
          "Don't generalize the pooling benefit to every item in the redesign",
        ],
      },
    ],
    rootCauses: [
      { id: "rp_rc1", label: "Used wrong formula" },
      { id: "rp_rc2", label: "Misclassified bucket" },
      { id: "rp_rc3", label: "Applied pooling to cycle stock" },
      { id: "rp_rc4", label: "Ignored demand correlation" },
    ],
  },
  {
    id: "newsvendor",
    name: "Newsvendor",
    shortName: "Newsvendor",
    description:
      "One-shot order quantity under uncertain demand to maximize expected profit.",
    verificationStatus: "verified",
    triggers: [
      "one-shot buy",
      "perishable",
      "single period",
      "critical ratio",
      "overage underage",
      "seasonal buy",
    ],
    disqualifiers: ["steady demand", "multiple periods", "EOQ context"],
    derivedCondition:
      "Single period, uncertain demand, overage and underage costs defined",
    formula: "CR = Cu / (Cu + Co)   →   Q* = F⁻¹(CR)",
    formulaVars: {
      CR: "Critical ratio (optimal service level)",
      Cu: "Cost of underage (lost margin, lost goodwill)",
      Co: "Cost of overage (salvage loss, disposal cost)",
      "F⁻¹": "Inverse CDF of demand distribution",
    },
    trapNotes: [
      "Cu = selling price − cost (not just selling price)",
      "Co = cost − salvage value (not just cost)",
      "CR > 0.5 means order more than the mean (high underage cost)",
      "If demand is Normal: Q* = μ + z × σ where z = Φ⁻¹(CR)",
    ],
    workedExample: {
      stem: "Buy price $10, sell price $25, salvage $4. Demand ~ N(200, 40). Find Q*.",
      solution:
        "Cu = 25−10 = 15. Co = 10−4 = 6. CR = 15/21 ≈ 0.714. z = 0.57. Q* = 200 + 0.57×40 ≈ 223.",
      steps: [
        "Cu = selling price − cost = 25 − 10 = $15",
        "Co = cost − salvage = 10 − 4 = $6",
        "CR = Cu / (Cu + Co) = 15 / 21 ≈ 0.714",
        "z = Φ⁻¹(0.714) ≈ 0.57",
        "Q* = μ + z × σ = 200 + 0.57 × 40 ≈ 223 units",
      ],
    },
    practiceStems: [
      {
        id: "nv_p1",
        text: "Warm-up: Cost=$8, price=$20, salvage=$2. Demand~N(500, 80). Find Q*.",
        answer: "Cu=12, Co=6, CR=12/18=0.667, z≈0.43, Q*=500+0.43×80≈534.",
        explanation: "Standard newsvendor. CR>0.5 so order above mean.",
        traps: [
          "Using price instead of margin for Cu",
          "Using cost instead of net loss for Co",
        ],
      },
      {
        id: "nv_snowcity",
        text: "A city must decide before winter how much snow-clearing capacity to contract for the season. Weekly snowfall is Normal with mean 10 inches and σ = 3 inches. A truck on a long-term contract costs $1,000 for the week; a truck called in as an emergency mid-storm costs $2,500. Each truck clears 2 inches. (a) How many inches of clearing capacity should the city contract for, and how many trucks is that? (b) A manager says 'just contract for the average — 10 inches, i.e. 5 trucks.' What's wrong with that?",
        answer:
          "(a) Cu = 2,500 − 1,000 = $1,500 (extra cost of being one truck short), Co = $1,000 (a contracted truck not needed). CR = 1,500/2,500 = 0.60. Capacity = NORMINV(0.60, 10, 3) = 10 + 0.253×3 = 10.76 in → 10.76/2 ≈ 5.4 trucks. (b) CR = 0.60 > 0.5, so the optimum is ABOVE the mean — contracting for the average under-provisions. Also Cu is the incremental $1,500, not the gross $2,500.",
        explanation:
          "Newsvendor with Normal demand. The underage cost is INCREMENTAL — the premium of an emergency truck over a contracted one ($2,500 − $1,000), not the full $2,500. Because the critical ratio exceeds 0.5, you order above the mean, so 'contract for the average' is exactly the wrong answer the problem is built to catch.",
        traps: [
          "Cu is incremental (emergency − contract), never the gross emergency cost",
          "CR > 0.5 ⇒ order ABOVE the mean — the average is not optimal",
          "Convert capacity (inches) into the unit asked for (trucks)",
        ],
      },
      {
        id: "nv_pickyourgigs",
        text: "On a 'Pick Your Gigs' phone plan, Marisol pre-pays $5 per GB for a chosen amount x for the year; unused GB are lost, and any usage above x is billed at $15/GB. Demand is uncertain with this CDF: P(D ≤ 10) = 0.63, P(D ≤ 11) = 0.77, P(D ≤ 12) = 0.81. How many GB should she pre-pay for?",
        answer:
          "Cu = $15 − $5 = $10 (each GB short costs $10 over the prepaid rate), Co = $5 (a prepaid GB left unused). CR = 10/(10+5) = 0.667. Pick the smallest x with CDF ≥ 0.667: P(≤10) = 0.63 < 0.667, P(≤11) = 0.77 ≥ 0.667 → x = 11 GB.",
        explanation:
          "Discrete-demand newsvendor: don't interpolate — step UP to the first quantity whose cumulative probability reaches the critical ratio. P(≤10) falls short, so 10 is too few; 11 is the answer (and minimizes the expected bill).",
        traps: [
          "Discrete demand: round UP to the first CDF ≥ CR, never down",
          "Cu and Co are incremental over/under amounts, not gross prices",
        ],
      },
    ],
    rootCauses: [
      { id: "nv_rc1", label: "Used gross cost, not incremental, for Cu" },
      { id: "nv_rc2", label: "Rounded down instead of up on discrete demand" },
      { id: "nv_rc3", label: "Used price not margin for Cu" },
      { id: "nv_rc4", label: "Misclassified bucket" },
    ],
  },
  {
    id: "experimentation",
    name: "Experimentation (A/B & Switchback)",
    shortName: "Experimentation",
    description:
      "Estimate a treatment effect from a randomized rollout; judge significance and pick A/B vs switchback when units interfere.",
    verificationStatus: "verified",
    triggers: [
      "A/B test",
      "switchback",
      "treatment vs control",
      "p-value / significance",
      "should they roll it out?",
      "marketplace experiment",
    ],
    disqualifiers: [
      "monitoring one process over time (→ SPC)",
      "observational data, no intervention",
      "inventory / demand decision",
    ],
    derivedCondition:
      "Estimate a treatment effect from a randomized rollout; check whether treatment and control share a resource (interference).",
    formula:
      "effect = β₁ in  Y = β₀ + β₁·treatment ;  significant if p(β₁) < 0.05",
    formulaVars: {
      Y: "Outcome metric (wait time, session length, …)",
      treatment: "1 if the new policy/feature applies, else 0",
      "β₀": "Baseline outcome when treatment = 0",
      "β₁": "Estimated treatment effect",
      p: "p-value of β₁ — significant if < 0.05",
    },
    trapNotes: [
      "Shared resource (drivers, inventory, messaging) ⇒ A/B is INVALID (SUTVA broken) → use a switchback",
      "Significant ≠ good — read the SIGN of β₁, not just the p-value",
      "p-flip vs SPC: experiments WANT p < 0.05; SPC wants in-control (p > 0.05)",
      "Switchback unit = whole market × time block — watch time-of-day / seasonality",
    ],
    workedExample: {
      stem: "TaxiX A/B-tests letting riders match with busy drivers (n = 48). The fitted model is  wait = 5.458 + 0.950·treatment, with p ≈ 0.00. Is the effect significant, what is it, and should TaxiX trust the test?",
      solution:
        "Significant (p < 0.05), but wait ROSE by 0.95 min (5.46 → 6.41). Don't trust it: both arms draw from the SAME driver pool, so they interfere (SUTVA broken) — re-run as a switchback.",
      steps: [
        "β₁ = 0.950 is the estimated effect; baseline β₀ = 5.46 min",
        "p ≈ 0.00 < 0.05 → statistically significant",
        "But the sign is positive → wait got WORSE; significant ≠ beneficial",
        "Treatment and control share one driver pool → interference → A/B invalid",
        "Re-run as a switchback (whole market alternates old/new by time block)",
      ],
    },
    practiceStems: [
      {
        id: "exp_p1",
        text: "Warm-up: A switchback test of a new feature gives  session = 2.161 + 0.367·treatment, with p = 0.004. Is the effect significant, and what is the estimated effect?",
        answer:
          "p = 0.004 < 0.05 → significant; the feature raises session length by ≈ 0.37 (baseline 2.16).",
        explanation:
          "Read β₁ as the effect and compare its p-value to 0.05. The sign is positive, so the feature helps.",
        traps: [
          "Significant means p < 0.05, not 'large'",
          "Report the coefficient β₁ as the effect, not the intercept β₀",
        ],
      },
      {
        id: "exp_delivery_fee",
        text: "A food-delivery platform wants to A/B test a new dynamic delivery-fee algorithm by charging some customers the new fee and others the old one, then comparing delivery times. Can a standard A/B test cleanly measure the algorithm's effect? If not, what should they do?",
        answer:
          "No. Delivery fees reallocate a shared pool of drivers, so treatment and control customers compete for the same drivers — the arms interfere (SUTVA violated) and the measured difference can't be cleanly attributed to the algorithm. Use a switchback: alternate the WHOLE market between old and new fees by time block (as Uber/Lyft do for surge pricing).",
        explanation:
          "The recognition + interference decision the exam actually asks. When treatment affects a resource shared with control (drivers, inventory, matching), customer-level randomization breaks the no-interference assumption; move the unit of randomization to market × time.",
        traps: [
          "Shared driver pool ⇒ customer-level A/B is invalid",
          "The fix is a switchback (market × time), not a bigger sample",
        ],
      },
      {
        id: "exp_significant_wrong",
        text: "An A/B test of a new checkout flow is highly significant (p = 0.002), but the treatment coefficient on revenue per user is −$0.40. The PM says, 'It's significant — ship it.' What's the flaw in that reasoning?",
        answer:
          "Significance only says the effect is unlikely to be noise; it says nothing about DIRECTION or value. Here β₁ < 0, so the new flow significantly LOWERS revenue — shipping it would hurt. Read the sign (and magnitude) alongside the p-value.",
        explanation:
          "'Significant ≠ good' is a core trap. With enough data, a tiny or negative effect can still be statistically significant. Roll-out decisions need the sign and business magnitude of β₁, not just p < 0.05.",
        traps: [
          "Significance ≠ benefit — check the sign of β₁",
          "A significant effect can still be negative or trivially small",
        ],
      },
    ],
    rootCauses: [
      { id: "exp_rc1", label: "Used A/B when units interfere (ignored SUTVA)" },
      { id: "exp_rc2", label: "Read p-value but ignored the sign/direction" },
      {
        id: "exp_rc3",
        label: "Misclassified bucket (SPC vs experiment / p-flip)",
      },
      { id: "exp_rc4", label: "Called it causal without p < 0.05" },
    ],
  },
  {
    id: "spc",
    name: "SPC & Process Capability",
    shortName: "SPC / Capability",
    description:
      "Tell process stability over time (control limits) apart from meeting customer specs (sigma-capability).",
    verificationStatus: "verified",
    triggers: [
      "control limits / UCL / LCL",
      "in control vs out of control",
      "spec limits (USL/LSL)",
      "sigma-capability",
      "% conforming / yield",
      "what σ for X% yield",
    ],
    disqualifiers: [
      "comparing treatment vs control (→ experimentation)",
      "inventory / order size",
      "one-shot demand",
    ],
    derivedCondition:
      "Repeated process measurements; separate control (stable over time, uses σ/√n) from capability (output vs specs, uses σ).",
    formula:
      "S = min((USL−μ)/σ, (μ−LSL)/σ)  ·  control limits: μ ± 3·σ/√n  ·  %conform = Φ(S) − Φ(−S)",
    formulaVars: {
      S: "Sigma-capability: σ-distances from the mean to the nearest spec",
      USL: "Upper spec limit (set by the customer)",
      LSL: "Lower spec limit (set by the customer)",
      μ: "Process mean",
      σ: "Process standard deviation",
      n: "Subgroup size (control chart only)",
    },
    trapNotes: [
      "Control limits ≠ spec limits — '3σ ⇒ 0.3% defective' is FALSE (0.3% is the false-alarm rate)",
      "Capability uses σ; control limits use σ/√n — don't swap them",
      "Sampling more (larger n) tightens the CHART, not capability (σ vs specs is unchanged)",
      "Critical process → NARROW the limits (accept more false alarms to miss fewer real problems)",
    ],
    workedExample: {
      stem: "Pistons have target diameter 10 cm and process σ = 0.08 cm; you sample n = 16 per hour and use 3σ control limits. Find UCL and LCL.",
      solution:
        "σ_x̄ = σ/√n = 0.08/√16 = 0.02 → UCL = 10 + 3×0.02 = 10.06 cm; LCL = 10 − 3×0.02 = 9.94 cm.",
      steps: [
        "Control limits use the standard deviation of the sample MEAN: σ_x̄ = σ/√n",
        "σ_x̄ = 0.08/√16 = 0.08/4 = 0.02",
        "UCL = μ + 3σ_x̄ = 10 + 0.06 = 10.06 cm",
        "LCL = μ − 3σ_x̄ = 10 − 0.06 = 9.94 cm",
        "These flag instability over time — they are NOT the customer's spec limits",
      ],
    },
    practiceStems: [
      {
        id: "spc_widgets_ucl",
        text: "Warm-up: Wondrous Widgets has process mean μ = 10 mm, process σ = 0.04 mm, and samples n = 16 per hour with industry-standard 3σ limits. Find the upper control limit.",
        answer:
          "σ_x̄ = 0.04/√16 = 0.01 → UCL = 10 + 3×0.01 = 10.03 mm (LCL = 9.97).",
        explanation: "Control limits use σ/√n, not σ. UCL = μ + 3σ/√n.",
        traps: [
          "Use σ/√n for control limits, not σ",
          "Don't confuse control limits with spec limits",
        ],
      },
      {
        id: "spc_capability",
        text: "A part has spec limits USL = 2.05 and LSL = 1.95; the process is centered at μ = 2.00 with σ = 0.025. (a) What is the sigma-capability? (b) What fraction of output conforms? (c) The team starts sampling n = 25 instead of 16 to set its control chart — does that improve capability?",
        answer:
          "(a) S = min((2.05−2.00)/0.025, (2.00−1.95)/0.025) = min(2, 2) = 2. (b) %conform = Φ(2) − Φ(−2) = 95.4%. (c) No — capability depends on σ vs the specs, which don't change; larger n only tightens the control chart.",
        explanation:
          "Sigma-capability counts how many σ fit between the mean and the nearest spec; S = 2 ⇒ 95.4% conforming. Capability is a process-vs-spec property — sampling more sharpens your monitoring chart but leaves σ and the specs untouched, so capability is unchanged.",
        traps: [
          "Capability uses σ (NOT σ/√n)",
          "S = 2 ⇒ ~95.4% conforming; S = 3 ⇒ ~99.7%",
          "Larger sample size tightens the chart, not capability",
        ],
      },
      {
        id: "spc_control_vs_spec",
        text: "True or false, with reasons: (a) 'At 3σ control limits, about 0.3% of output is defective.' (b) 'For a very critical process, widen the limits to 4σ so you miss fewer problems.'",
        answer:
          "(a) FALSE — 0.3% is the false-ALARM rate (a stable process plotting outside the limits by chance), not the defect rate; defects depend on σ vs the specs. (b) FALSE / backwards — widening makes the chart LESS sensitive, so you miss MORE real problems; a critical process NARROWS its limits, accepting more false alarms to catch genuine assignable causes.",
        explanation:
          "Two of the highest-value conceptual traps: control limits measure stability, not conformance; and 3σ is a default, not a law — criticality raises your tolerance for false alarms, which TIGHTENS the band.",
        traps: [
          "Control limits ≠ spec limits; 0.3% is the false-alarm rate",
          "Critical process → NARROW the limits, don't widen them",
        ],
      },
      {
        id: "spc_sigma_for_yield",
        text: "A part is targeted at 10 mm with a tolerance of ±0.2 mm and a centered process. What process σ is needed for at least 99% of output to conform?",
        answer:
          "99% conforming, centered → 0.5% in each tail → z(0.995) = 2.576. Spec half-width is 0.2, so σ = 0.2 / 2.576 ≈ 0.078 mm.",
        explanation:
          "Inverse capability: fix the yield, solve for σ. With a centered process each tail holds (1 − 0.99)/2 = 0.5%, giving z = 2.576; σ = (spec half-width)/z. Higher required yield ⇒ smaller σ.",
        traps: [
          "Split the non-conforming fraction across BOTH tails (0.5% each)",
          "Use σ = (half-width)/z — the spec half-width, not the full tolerance",
        ],
      },
    ],
    rootCauses: [
      { id: "spc_rc1", label: "Used σ/√n for capability (should use σ)" },
      { id: "spc_rc2", label: "Confused control limits with spec limits" },
      {
        id: "spc_rc3",
        label: "Treated the 3σ false-alarm rate as a defect rate",
      },
      {
        id: "spc_rc4",
        label: "Widened limits for a critical process (should narrow)",
      },
    ],
  },
  {
    id: "littles_law",
    name: "Little's Law / Flow Measures",
    shortName: "Little's Law",
    description:
      "Connect average inventory, throughput, and flow time in stable systems, phases, paths, and career pipelines.",
    verificationStatus: "verified",
    triggers: [
      "average number in system",
      "flow time",
      "throughput rate",
      "work in process",
      "stable system",
      "average tenure",
      "path mix",
      "inflow equals outflow",
    ],
    disqualifiers: [
      "optimal order quantity",
      "service level buffer",
      "one-shot uncertain demand",
      "control limits",
      "randomized experiment",
    ],
    derivedCondition:
      "Stable flow boundary where I, R, and T describe average inventory, throughput, and time; split phases or paths when only subsets flow through them.",
    formula: "I = R * T | T = I / R | R = I / T",
    formulaVars: {
      I: "Average inventory, WIP, or number of people inside the system",
      R: "Throughput rate through the system boundary in one direction",
      T: "Average flow time spent inside the system",
      I_total: "Sum of inventories across phases or cohorts",
      R_total: "External throughput through the whole system boundary",
    },
    trapNotes: [
      "Use one-direction throughput; if a rate counts both entries and exits, halve it in a stable system",
      "Keep time units aligned before dividing inventory by throughput",
      "For phase inventories, scale throughput by the fraction that actually enters that phase",
      "For mixed paths, weight path times by path volume or sum all inventories and divide by total external throughput",
      "Internal promotions or transfers are not external arrivals for the whole-system average",
    ],
    workedExample: {
      stem: "Insects cross the boundary of a cubic meter of air at an overall rate of 0.061 per hour, counting both entries and exits. The average number inside is 0.0082. What is the average visit duration?",
      solution:
        "In a stable system, entries equal exits, so one-direction throughput is R = 0.061/2 = 0.0305 insects/hour. Little's Law gives T = I/R = 0.0082/0.0305 = 0.269 hours, or about 16.1 minutes.",
      steps: [
        "Define the system as insects inside the cube",
        "Use one-direction throughput: R = 0.061/2 = 0.0305 insects/hour",
        "Apply T = I/R = 0.0082/0.0305 = 0.269 hours",
        "Convert 0.269 hours to minutes: 0.269 * 60 = 16.1 minutes",
      ],
    },
    practiceStems: [
      {
        id: "ll_insects_cube",
        text: "Insects cross the boundary of a cubic meter of air at an overall rate of 0.061 per hour, either going in or going out. The average number of insects inside the cube is 0.0082. What is the average duration of an insect visit?",
        answer:
          "About 0.269 hours, or 16.1 minutes. Because the crossing rate counts both directions, stable-system throughput into the cube is R = 0.061/2 = 0.0305 per hour; T = I/R = 0.0082/0.0305.",
        explanation:
          "Little's Law uses throughput in one direction across the system boundary. A total in-plus-out crossing rate double-counts flow in a stable system.",
        traps: [
          "Do not use 0.061/hour as one-direction throughput",
          "Convert hours to minutes only after computing T",
        ],
      },
      {
        id: "ll_insurance_hard_claims",
        text: "An insurer processes 2,000 claims/week, and average processing time is 6 weeks. Claims are 60% simple, 30% medium, and 10% hard. Medium claims take 8 weeks on average. There are 3,600 simple claims in the system. How long does a hard claim take on average?",
        answer:
          "18 weeks. Total inventory is 2,000 * 6 = 12,000 claims. Throughputs are simple 1,200/week, medium 600/week, hard 200/week. Medium inventory is 600 * 8 = 4,800. Hard inventory is 12,000 - 3,600 - 4,800 = 3,600, so T_hard = 3,600/200 = 18 weeks.",
        explanation:
          "Use Little's Law at the total-system level, then by category. The missing category inventory comes from subtracting known category inventories from total inventory.",
        traps: [
          "Use category throughput, not total throughput, for the hard-claim flow time",
          "Compute medium inventory from R * T before subtracting",
        ],
      },
      {
        id: "ll_coffee_shop",
        text: "A coffee shop serves 60 customers/hour. 60% take out; 40% stay. On average 10 customers are in the order line, drink prep takes 5 minutes for everyone, and stay-in customers consume for 20 minutes. (1) How many people are in the shop on average? (2) How long does an average customer spend in the shop?",
        answer:
          "23 people and 23 minutes. Convert throughput to 1 customer/minute. Order-line inventory is 10. Prep inventory is 1 * 5 = 5. Consumption inventory is 0.4 * 1 * 20 = 8. Total inventory is 23. For the whole shop, T = I/R = 23/1 = 23 minutes.",
        explanation:
          "Compute phase inventories with the throughput that actually visits each phase, then sum inventories. The whole-shop flow time comes from total inventory divided by total external throughput.",
        traps: [
          "Only 40% of customers enter the consumption phase",
          "Use minutes consistently after converting 60/hour to 1/minute",
        ],
      },
      {
        id: "ll_it_new_feature",
        text: "An IT group has Triage plus New Feature, Revise Feature, and Repair Error groups. 100 requests/day arrive at Triage; 5% route to New Feature. Triage inventory is 500. New Feature also receives 10 direct requests/day and has inventory 375. How long does a New Feature request take from arrival to deployment on average?",
        answer:
          "About 26.7 days. Triage time is 500/100 = 5 days. New Feature throughput is 0.05 * 100 + 10 = 15/day, so New Feature time is 375/15 = 25 days. Five requests/day take the triage path for 30 days; ten/day go direct for 25 days. Weighted average = (5*30 + 10*25)/15 = 26.67 days.",
        explanation:
          "This is a path-mix Little's Law problem. Compute the shared stage time and specialist stage time, then weight by the volumes taking each path.",
        traps: [
          "Do not add triage time to direct New Feature arrivals",
          "Weight path times by 5/day versus 10/day, not by an unweighted average",
        ],
      },
      {
        id: "ll_it_overall_system",
        text: "Using the IT system above, Revise Feature has 30 direct arrivals/day and 10 days average flow time; Repair Error has 60 direct arrivals/day and 4 days average flow time. Triage sends 25% to Revise and 70% to Repair. What is the average time across all requests in the whole IT system?",
        answer:
          "About 9.7 days. Downstream throughputs are New Feature 15/day, Revise 25 + 30 = 55/day, Repair 70 + 60 = 130/day. Total external throughput is 200/day. Inventories are Triage 500, New Feature 375, Revise 55*10 = 550, Repair 130*4 = 520. Total inventory is 1,945, so T = 1,945/200 = 9.725 days.",
        explanation:
          "For the whole system, sum all inventories inside the boundary and divide by total external arrivals. Internal routing from Triage is not new external demand.",
        traps: [
          "Total throughput is external arrivals: 100 + 10 + 30 + 60 = 200/day",
          "Include Triage inventory once, then downstream group inventories",
        ],
      },
      {
        id: "ll_mt_kinley",
        text: "Mt. Kinley is stable with 60 managers and 10 partners. A manager stays 6 years, then becomes partner or leaves. The firm hires 5 managers/year externally, and all partners come from managers. Associates: 20% are promoted at evaluation; of the 80% not promoted, 40% stay for another 2-year stint and 60% leave. (a) How many associates are promoted to manager per year? (b) How many new associates are hired per year? (c) What is average tenure across all ranks?",
        answer:
          "(a) 5 associates/year. Manager throughput is 60/6 = 10/year; subtract 5 external manager hires. (b) 17 new associates/year. If 20% promoted equals 5, then 25 associates are evaluated; 20 are not promoted, 8 stay, and 12 leave, so associate outflow is 5 + 12 = 17. (c) 7 years. External inflow is 17 associates + 5 managers = 22/year. Inventory is associate-stay 8*2 = 16, associate-hire 17*4 = 68, managers 60, partners 10; total 154. Average tenure = 154/22 = 7 years.",
        explanation:
          "Career-pipeline versions of Little's Law use ranks or cohorts as systems. For the whole firm, divide total headcount by external inflow, not internal promotion flow.",
        traps: [
          "Subtract external manager hires before counting associate promotions",
          "Do not count internal promotions as external inflow for firmwide tenure",
        ],
      },
      {
        id: "ll_hospital_research",
        text: "A hospital research track has Juniors, Seniors, Chiefs, and Doctors. It hires 400 Juniors/year and has 2,000 Juniors. 25% of Juniors become Seniors. Seniors also have 100 external hires/year, stay 4 years, and 15% become Chiefs. Chiefs also have 10 external hires/year, stay 12 years, and 25% become Doctors. Doctors have average inventory 100. (a) How many people work in research? (b) How long does an average person spend in the research division?",
        answer:
          "(a) 3,380 people. Junior inventory is 2,000. Senior throughput is 0.25*400 + 100 = 200/year, so Senior inventory is 200*4 = 800. Chief throughput is 0.15*200 + 10 = 40/year, so Chief inventory is 40*12 = 480. Add Doctors 100 for total inventory 3,380. (b) 6.6 years. External inflow is 400 + 100 + 10 = 510/year, so average time is 3,380/510 = 6.63 years.",
        explanation:
          "Work rank by rank to compute inventories, then switch to the whole-division boundary. External inflow excludes internal promotions from Junior to Senior and Senior to Chief.",
        traps: [
          "Do not treat promotions as external hires in the whole-division calculation",
          "Use each rank's own throughput before applying I = R * T",
        ],
      },
    ],
    rootCauses: [
      { id: "ll_rc1", label: "Used a double-counted or wrong throughput" },
      { id: "ll_rc2", label: "Mixed time units" },
      { id: "ll_rc3", label: "Skipped path or phase weighting" },
      { id: "ll_rc4", label: "Counted internal transfers as external flow" },
    ],
  },
  {
    id: "queueing",
    name: "Queueing / Waiting Time",
    shortName: "Queueing",
    description:
      "Use M/M/1 and M/M/s inputs to compute utilization, waiting probability, queue length, waiting time, and priority or pooling effects.",
    verificationStatus: "verified",
    triggers: [
      "arrival rate",
      "service rate",
      "number of servers",
      "utilization",
      "average waiting time",
      "average number waiting",
      "probability wait exceeds",
      "priority queue",
      "pooled line",
    ],
    disqualifiers: [
      "deterministic inventory timing",
      "order quantity cost tradeoff",
      "one-shot inventory buy",
      "stable flow time without stochastic service",
    ],
    derivedCondition:
      "Exponential interarrival and service times with one or more servers; check stability lambda < s*mu before using steady-state queue outputs.",
    formula:
      "rho = lambda / (s*mu) | Wq = Lq / lambda | M/M/1 Wq = lambda / (mu*(mu-lambda)) | P(Wq>t) = C*exp(-(s*mu-lambda)*t)",
    formulaVars: {
      lambda: "Average arrival rate",
      mu: "Average service rate per server",
      s: "Number of parallel servers",
      rho: "Server utilization lambda/(s*mu)",
      Lq: "Average number waiting in queue",
      Wq: "Average time waiting in queue",
      C: "Erlang-C probability an arrival must wait",
    },
    trapNotes: [
      "Convert service time into service rate before entering the spreadsheet",
      "Use the same time units for lambda, mu, and any wait threshold T",
      "Utilization can stay the same after pooling even while waiting time improves",
      "Probability of no wait is 1 minus the Erlang-C probability of waiting",
      "Priority rules redistribute waiting across classes; they do not create capacity",
    ],
    workedExample: {
      stem: "An EV charging location has 5 chargers, arrivals average 9 cars/hour, and each charging session takes 30 minutes on average. What are P(Wq > 1 hour), Lq, and L?",
      solution:
        "Use s = 5, lambda = 9/hour, and mu = 2/hour because 30 minutes is 0.5 hours. The system is stable since s*mu = 10 > 9. The queueing spreadsheet reports P(Wq > 1) = 0.2805, Lq = 6.862 cars, and L = 11.362 cars.",
      steps: [
        "Convert mean service time to mu = 1/0.5 = 2 cars/hour",
        "Check stability: lambda = 9 is less than s*mu = 10",
        "Enter s = 5, lambda = 9, and mu = 2 in the infinite-queue sheet",
        "Read the wait-tail, waiting-line, and total-system outputs",
      ],
    },
    practiceStems: [
      {
        id: "que_ev_charging",
        text: "An EV charging location has 5 identical chargers. Cars arrive at 9/hour, and each charge takes 30 minutes on average. Assuming M/M/5 with infinite queue, find (a) P(Wq > 1 hour), (b) Lq, and (c) L.",
        answer:
          "Use s = 5, lambda = 9/hour, mu = 2/hour. Stability holds because 5*2 = 10 > 9. Spreadsheet outputs: P(Wq > 1 hour) = 0.2805, Lq = 6.862 cars, and L = 11.362 cars.",
        explanation:
          "The key setup move is converting 30 minutes into a per-hour service rate. With consistent hourly units, the spreadsheet's wait-tail and queue-length outputs give the answer.",
        traps: [
          "Do not enter 30 as the service rate",
          "Use T = 1 because the rates are per hour",
        ],
      },
      {
        id: "que_airport_priority",
        text: "Airport security has 5 teams, mean service time 1 minute, and 240 passenger arrivals/hour. (a) What is Lq? (b) What is Wq? (c) If 20% are first-class priority passengers, what are Lq and Wq for first-class and non-priority passengers?",
        answer:
          "Use s = 5, lambda = 240/hour, mu = 60/hour. Baseline Lq = 2.216 passengers and Wq = 0.5541 minutes. Priority split: first-class lambda1 = 48/hour has Lq1 = 0.106 and Wq1 = 0.1319 minutes; non-priority lambda2 = 192/hour has Lq2 = 2.111 and Wq2 = 0.6597 minutes.",
        explanation:
          "The baseline M/M/5 system is stable at rho = 240/(5*60) = 0.8. The priority block keeps total capacity fixed while redistributing waiting toward the lower-priority class.",
        traps: [
          "Convert 1 minute of service to mu = 60/hour",
          "Priority lowers one class's wait by raising another class's wait",
        ],
      },
      {
        id: "que_carwash_pooling",
        text: "A carwash has two separate lines, each with 2 stations. Each line receives 5 cars/hour, and each station takes 20 minutes per car. A manager proposes one pooled line with 4 stations and 10 cars/hour. (a) How does utilization change? (b) Should they pool?",
        answer:
          "Utilization stays 5/(2*3) = 10/(4*3) = 0.8333 in both systems because 20 minutes implies mu = 3/hour. They should pool: with the same total utilization, one M/M/4 queue has lower average wait and queue length than two independent M/M/2 queues.",
        explanation:
          "Pooling does not change total load or capacity here; it reduces waiting by smoothing variability across all servers.",
        traps: [
          "Do not claim utilization falls just because the line is pooled",
          "The benefit is waiting-time reduction, not capacity creation",
        ],
      },
      {
        id: "que_wwic_discount",
        text: "A walk-in clinic has 2 nurse practitioners. Patients arrive at 3.9/hour, each NP sees 3 patients/hour on average, revenue is $55/visit, and each NP earns $15/hour plus $10/patient. (a) Find utilization and probability a patient waits. (b) If patients waiting more than 15 minutes get a $10 discount, what is hourly margin?",
        answer:
          "Utilization is 3.9/(2*3) = 65%. The spreadsheet with T = 0 gives P(wait) = 51.21%. With T = 0.25 hours, P(Wq > 15 min) = 30.29%, so discounted patients/hour = 3.9*0.3029 = 1.18131. Revenue/hour = 3.9*$55 = $214.50. Labor/hour = 2*$15 + 3.9*$10 = $69. Discount/hour = 1.18131*$10 = $11.81. Margin = $214.50 - $69 - $11.81 = $133.69/hour.",
        explanation:
          "This combines queue outputs with economics. The probability threshold must be in hours because the queue inputs are hourly.",
        traps: [
          "15 minutes is T = 0.25 hours",
          "Discount cost is expected discounted patients per hour times $10",
        ],
      },
      {
        id: "que_kwikemart_mm1",
        text: "At a single-cashier store, customers arrive at 1/minute and checkout service takes 48 seconds on average. Assuming M/M/1, how long does the average customer wait in line before checkout?",
        answer:
          "Use lambda = 1/minute and mu = 1/0.8 = 1.25/minute. M/M/1 waiting time in queue is Wq = lambda/(mu*(mu-lambda)) = 1/(1.25*(1.25-1)) = 1/0.3125 = 3.2 minutes.",
        explanation:
          "Convert 48 seconds to 0.8 minutes, then apply the M/M/1 Wq formula.",
        traps: [
          "The question asks waiting in line, not total time including service",
          "Use minutes consistently",
        ],
      },
      {
        id: "que_wwic_lq_tail",
        text: "A one-NP walk-in clinic has arrivals lambda = 6.2/hour and service rate mu = 7.2/hour. What is the probability that more than 2 patients are waiting?",
        answer:
          "For M/M/1, rho = lambda/mu = 6.2/7.2 = 31/36. More than 2 waiting means at least 4 in system, so P(Lq > 2) = rho^4 = (31/36)^4 = 923,521/1,679,616 = 0.5498, about 0.55.",
        explanation:
          "Queue length excludes the patient in service. Translate more-than-2-waiting into the equivalent system-count tail before using the geometric M/M/1 distribution.",
        traps: [
          "Do not confuse number waiting with number in system",
          "Use rho^4 for more than 2 waiting in this M/M/1 setup",
        ],
      },
      {
        id: "que_restaurant_tables",
        text: "A restaurant has 28 two-person tables, parties arrive at 16/hour, and each party uses a table for 90 minutes on average. Assuming M/M/28, what is the probability an arriving party does not wait?",
        answer:
          "Use s = 28, lambda = 16/hour, mu = 1/1.5 = 0.6667/hour. Offered load is a = lambda/mu = 24 and rho = 24/28 = 0.857. Erlang-C gives P(wait) about 0.333, so P(no wait) = 1 - 0.333 = 0.667, or 66.7%.",
        explanation:
          "The spreadsheet reports the probability of waiting; the requested probability is its complement.",
        traps: [
          "Convert 90 minutes to 1.5 hours before computing mu",
          "Do not report P(wait) when the question asks P(no wait)",
        ],
      },
    ],
    rootCauses: [
      { id: "que_rc1", label: "Used inconsistent time units" },
      { id: "que_rc2", label: "Entered service time instead of service rate" },
      { id: "que_rc3", label: "Confused waiting with total system time" },
      { id: "que_rc4", label: "Missed pooling or priority interpretation" },
    ],
  },
  {
    id: "inventory_timing",
    name: "Inventory Timing / Batch Replenishment",
    shortName: "Inventory Timing",
    description:
      "Track deterministic inventory paths, reorder timing, batch arrivals, stockouts, and end-of-horizon leftovers.",
    verificationStatus: "verified",
    triggers: [
      "batch arrives all at once",
      "holding pan",
      "cook time",
      "start a new batch",
      "time-varying demand",
      "closing inventory",
      "inventory path",
      "base-stock timing",
    ],
    disqualifiers: [
      "ordering plus holding cost minimization",
      "random one-period demand",
      "safety stock service level",
      "queue waiting time",
    ],
    derivedCondition:
      "Known demand rates and deterministic replenishment lead time; draw the inventory path and time the batch arrivals against depletion.",
    formula:
      "depletion = demand_rate * time | time_to_zero = inventory / demand_rate | reorder_point = demand_rate * lead_time",
    formulaVars: {
      demand_rate: "Servings or units consumed per minute or hour",
      lead_time: "Time between starting and receiving the replenishment batch",
      batch_size: "Units added when replenishment arrives",
      inventory: "Units currently available before the next demand segment",
    },
    trapNotes: [
      "Track jump times separately from batch start times",
      "Demand-rate changes can move the zero time after a reorder point is reached",
      "A full batch arrival jumps inventory up; it is not a gradual fill",
      "End-of-day leftovers are computed from the last batch arrival to closing",
    ],
    workedExample: {
      stem: "Big Z's makes rice in full 90-serving batches with a 30-minute cook time. Demand is 1/min from 11:00-12:00, 80/hour from 12:00-13:30, and 0.9/min from 13:30-16:00. When do batch arrivals happen and how much rice remains at closing?",
      solution:
        "At 11:00 inventory is 90. It falls to 30 by 12:00, then at 80/hour it reaches zero at 12:22.5 and jumps to 90. That batch lasts 67.5 minutes, so it reaches zero and jumps again at 13:30. At 0.9/min, 90 servings last 100 minutes, so the next jump is 15:10. From 15:10 to 16:00 demand is 45 servings, leaving 45 at closing.",
      steps: [
        "Start at 90 servings at 11:00",
        "Use each demand segment to find when inventory reaches zero",
        "Add a 90-serving jump at each timed batch arrival",
        "Subtract final segment demand from the last 90-serving batch",
      ],
    },
    practiceStems: [
      {
        id: "inv_batch_rice",
        text: "Big Z's makes only full 90-serving rice batches. Cooking takes 30 minutes. The first batch arrives at 11:00. Demand is 1/min from 11:00-12:00, 80/hour from 12:00-13:30, and 0.9/min from 13:30-16:00. A new batch is timed to arrive just as inventory would run out. When do batch arrivals occur, and how much rice remains at closing?",
        answer:
          "Batch arrivals after opening occur at 12:22.5, 13:30, and 15:10. Closing inventory is 45 servings. Inventory starts at 90 at 11:00, falls to 30 by noon, then reaches zero 22.5 minutes later at the 80/hour rate. The 12:22.5 batch lasts 67.5 minutes, reaching zero at 13:30. The 13:30 batch lasts 100 minutes at 0.9/min, reaching zero at 15:10. The final 90-serving batch sells 0.9*50 = 45 servings before 16:00, leaving 45.",
        explanation:
          "This is deterministic inventory-path accounting. The important move is to recompute time-to-zero when demand rates change, then treat each completed batch as an instant jump of 90 servings.",
        traps: [
          "Do not average the demand rates across the day",
          "Distinguish cook start times from batch arrival jump times",
        ],
      },
    ],
    rootCauses: [
      {
        id: "inv_time_rc1",
        label: "Averaged demand instead of segmenting time",
      },
      { id: "inv_time_rc2", label: "Confused batch start with batch arrival" },
      { id: "inv_time_rc3", label: "Missed a demand-rate change" },
      { id: "inv_time_rc4", label: "Forgot the final leftover calculation" },
    ],
  },
];

export const ARCHETYPE_MAP: Record<string, Archetype> = Object.fromEntries(
  ARCHETYPES.map(a => [a.id, a])
);

const VERIFIED_ROUTER_STEM_QA: RouterStem["semanticQa"] = {
  verificationStatus: "verified",
  checks: {
    hasStableArchetypeLink: true,
    hasSourceBackedAnswer: true,
    hasExplanation: true,
    hasTrapCoverage: true,
  },
  warnings: [],
};

// Router stems for practice
const ROUTER_STEM_DATA: Array<Omit<RouterStem, "semanticQa">> = [
  {
    id: "router_eoq_direct_1",
    stem: "A plant uses 12,000 identical fasteners per year, pays a fixed cost each time it orders, and pays an annual holding cost per fastener. What order quantity minimizes ordering plus holding cost?",
    correctId: "eoq",
    kind: "direct",
  },
  {
    id: "router_eoq_direct_2",
    stem: "Demand is constant and known, replenishment is immediate, and the manager wants the batch size that balances setup cost against inventory carrying cost.",
    correctId: "eoq",
    kind: "direct",
  },
  {
    id: "router_eoq_direct_3",
    stem: "A distributor can reorder the same SKU repeatedly through the year and needs the quantity per order, not the reorder trigger point.",
    correctId: "eoq",
    kind: "direct",
  },
  {
    id: "router_eoq_near_miss_1",
    stem: "The buyer can place another replenishment order next week, so this is not a one-season buy. The task is to choose the recurring order size from ordering and holding costs.",
    correctId: "eoq",
    kind: "near-miss",
    confuserIds: ["newsvendor"],
  },
  {
    id: "router_eoq_near_miss_2",
    stem: "The question asks for the order quantity that minimizes annual cost, while safety stock and service level are handled in a separate reorder-point calculation.",
    correctId: "eoq",
    kind: "near-miss",
    confuserIds: ["safety_stock"],
  },
  {
    id: "router_eoq_conceptual_1",
    stem: "At the optimal repeated order quantity, the annual ordering cost equals the annual holding cost. Which bucket explains that balance?",
    correctId: "eoq",
    kind: "conceptual-trap",
    confuserIds: ["newsvendor"],
  },
  {
    id: "router_safety_direct_1",
    stem: "Daily demand has mean 80 and standard deviation 12, lead time is 9 days, and the target service level is 95%. Which bucket finds the buffer stock?",
    correctId: "safety_stock",
    kind: "direct",
  },
  {
    id: "router_safety_direct_2",
    stem: "A retailer needs the inventory position that triggers replenishment when lead-time demand is uncertain.",
    correctId: "safety_stock",
    kind: "direct",
  },
  {
    id: "router_safety_direct_3",
    stem: "The problem gives mean demand, demand variability, lead time, and a z-score target for avoiding stockouts.",
    correctId: "safety_stock",
    kind: "direct",
  },
  {
    id: "router_safety_near_miss_1",
    stem: "The order quantity is already fixed; the manager now needs the extra inventory buffer caused by uncertain demand during lead time.",
    correctId: "safety_stock",
    kind: "near-miss",
    confuserIds: ["eoq"],
  },
  {
    id: "router_safety_near_miss_2",
    stem: "This item is replenished continuously rather than bought once for a selling season, and the focus is stockout risk during lead time.",
    correctId: "safety_stock",
    kind: "near-miss",
    confuserIds: ["newsvendor"],
  },
  {
    id: "router_safety_conceptual_1",
    stem: "Multiplying daily standard deviation by lead time directly would overstate the buffer; the exam expects scaling by the square root of lead time.",
    correctId: "safety_stock",
    kind: "conceptual-trap",
    confuserIds: ["spc"],
  },
  {
    id: "router_pooling_direct_1",
    stem: "Four regional warehouses face independent demand, and the company is considering one central inventory pool to reduce total safety stock.",
    correctId: "risk_pooling",
    kind: "direct",
  },
  {
    id: "router_pooling_direct_2",
    stem: "A firm aggregates demand streams from multiple locations and wants to know how combined variance changes.",
    correctId: "risk_pooling",
    kind: "direct",
  },
  {
    id: "router_pooling_direct_3",
    stem: "The question compares separate safety stocks against a centralized stockpile when demands are not perfectly correlated.",
    correctId: "risk_pooling",
    kind: "direct",
  },
  {
    id: "router_pooling_near_miss_1",
    stem: "The service level is unchanged, but the company can consolidate multiple uncertain demand streams before computing the required buffer.",
    correctId: "risk_pooling",
    kind: "near-miss",
    confuserIds: ["safety_stock"],
  },
  {
    id: "router_pooling_near_miss_2",
    stem: "This is not a single-season purchase decision; the benefit comes from aggregating independent location demand to lower variability.",
    correctId: "risk_pooling",
    kind: "near-miss",
    confuserIds: ["newsvendor"],
  },
  {
    id: "router_pooling_conceptual_1",
    stem: "The trap is assuming safety stock falls in proportion to the number of locations. With independent demand, variability falls with a square-root relationship.",
    correctId: "risk_pooling",
    kind: "conceptual-trap",
    confuserIds: ["safety_stock"],
  },
  {
    id: "router_newsvendor_direct_1",
    stem: "A bakery decides each morning how many pastries to make, with leftover units salvaged cheaply and unmet demand lost.",
    correctId: "newsvendor",
    kind: "direct",
  },
  {
    id: "router_newsvendor_direct_2",
    stem: "A retailer buys winter coats once before the season and must choose the quantity using overage and underage costs.",
    correctId: "newsvendor",
    kind: "direct",
  },
  {
    id: "router_newsvendor_direct_3",
    stem: "Demand is uncertain, the purchase is single-period, and the optimal quantity comes from a critical ratio.",
    correctId: "newsvendor",
    kind: "direct",
  },
  {
    id: "router_newsvendor_near_miss_1",
    stem: "There is no chance to reorder after demand is observed; the order must be set before the one selling period begins.",
    correctId: "newsvendor",
    kind: "near-miss",
    confuserIds: ["eoq"],
  },
  {
    id: "router_newsvendor_near_miss_2",
    stem: "The service level is not an external target; it is implied by the cost of ordering too few versus too many units.",
    correctId: "newsvendor",
    kind: "near-miss",
    confuserIds: ["safety_stock"],
  },
  {
    id: "router_newsvendor_conceptual_1",
    stem: "The key fraction uses underage cost over underage plus overage cost, not ordering cost over holding cost.",
    correctId: "newsvendor",
    kind: "conceptual-trap",
    confuserIds: ["eoq"],
  },
  {
    id: "router_experiment_direct_1",
    stem: "A platform randomly shows some riders a new matching rule, fits wait = β₀ + β₁·treatment, and reads β₁ and its p-value to decide whether to roll it out.",
    correctId: "experimentation",
    kind: "direct",
  },
  {
    id: "router_experiment_direct_2",
    stem: "A team randomly assigns users to a new feature versus the current one and asks whether the difference in signup rate is statistically significant.",
    correctId: "experimentation",
    kind: "direct",
  },
  {
    id: "router_experiment_direct_3",
    stem: "A switchback alternates the whole marketplace between old and new pricing by time block to estimate the effect on delivery time.",
    correctId: "experimentation",
    kind: "direct",
  },
  {
    id: "router_experiment_near_miss_1",
    stem: "The measured difference comes from a deliberate randomized treatment, not a production process drifting against its control limits over time.",
    correctId: "experimentation",
    kind: "near-miss",
    confuserIds: ["spc"],
  },
  {
    id: "router_experiment_near_miss_2",
    stem: "The two arms are treatment and control users, not independent demand streams being combined to cut safety stock.",
    correctId: "experimentation",
    kind: "near-miss",
    confuserIds: ["risk_pooling"],
  },
  {
    id: "router_experiment_conceptual_1",
    stem: "The result is significant at p = 0.01, but treatment and control share one driver pool — the trap is trusting an A/B test when the arms interfere.",
    correctId: "experimentation",
    kind: "conceptual-trap",
    confuserIds: ["spc"],
  },
  {
    id: "router_spc_direct_1",
    stem: "A part has USL 2.05, LSL 1.95, process mean 2.00, and σ 0.025; the question asks the sigma-capability and the percent of output that conforms.",
    correctId: "spc",
    kind: "direct",
  },
  {
    id: "router_spc_direct_2",
    stem: "A control chart shows observations against upper and lower control limits to decide whether variation is common-cause or special-cause.",
    correctId: "spc",
    kind: "direct",
  },
  {
    id: "router_spc_direct_3",
    stem: "Given a target, a tolerance, and a desired yield, the problem asks what process σ keeps output within spec.",
    correctId: "spc",
    kind: "direct",
  },
  {
    id: "router_spc_near_miss_1",
    stem: "There is no randomized treatment group; the question is whether an ongoing production process is stable and centered.",
    correctId: "spc",
    kind: "near-miss",
    confuserIds: ["experimentation"],
  },
  {
    id: "router_spc_near_miss_2",
    stem: "The standard deviation describes process output versus specs, not demand during replenishment lead time.",
    correctId: "spc",
    kind: "near-miss",
    confuserIds: ["safety_stock"],
  },
  {
    id: "router_spc_conceptual_1",
    stem: "The trap is reading the 0.3% of points outside 3σ control limits as a defect rate — it is the false-alarm rate, a control-chart property, not capability.",
    correctId: "spc",
    kind: "conceptual-trap",
    confuserIds: ["experimentation"],
  },
  {
    id: "router_littles_direct_1",
    stem: "The problem gives an average number of items inside a stable system plus a throughput rate and asks how long an item spends inside.",
    correctId: "littles_law",
    kind: "direct",
  },
  {
    id: "router_littles_direct_2",
    stem: "A service department reports WIP inventory and request completions per day; the question asks average flow time through the department.",
    correctId: "littles_law",
    kind: "direct",
  },
  {
    id: "router_littles_direct_3",
    stem: "A process has several phases, each with its own inventory or time, and the task is to sum inventories before finding total time in the system.",
    correctId: "littles_law",
    kind: "direct",
  },
  {
    id: "router_littles_near_miss_1",
    stem: "The question mentions inventory and demand, but it is not asking for order quantity or safety stock; it asks average time from average WIP and throughput.",
    correctId: "littles_law",
    kind: "near-miss",
    confuserIds: ["eoq", "safety_stock"],
  },
  {
    id: "router_littles_near_miss_2",
    stem: "A stable promotion pipeline asks for hires, promotions, and average tenure across ranks, so internal transfers must be separated from external flow.",
    correctId: "littles_law",
    kind: "near-miss",
    confuserIds: ["experimentation", "spc"],
  },
  {
    id: "router_littles_conceptual_1",
    stem: "A boundary-crossing rate counts both entries and exits; the exam trap is to use one-direction throughput before applying I = R*T.",
    correctId: "littles_law",
    kind: "conceptual-trap",
    confuserIds: ["spc"],
  },
  {
    id: "router_queueing_direct_1",
    stem: "The problem gives arrival rate, service rate, and number of servers, then asks for utilization, average waiting time, or average number waiting.",
    correctId: "queueing",
    kind: "direct",
  },
  {
    id: "router_queueing_direct_2",
    stem: "An M/M/s spreadsheet setup asks for lambda, mu, servers, and the probability that queue wait exceeds a threshold.",
    correctId: "queueing",
    kind: "direct",
  },
  {
    id: "router_queueing_direct_3",
    stem: "A single-server line has exponential arrivals and service, and the task is to compute Wq before service begins.",
    correctId: "queueing",
    kind: "direct",
  },
  {
    id: "router_queueing_near_miss_1",
    stem: "The question mentions waiting and flow, but service-time variability and server count matter; it is not just Little's Law with a known average inventory.",
    correctId: "queueing",
    kind: "near-miss",
    confuserIds: ["littles_law"],
  },
  {
    id: "router_queueing_near_miss_2",
    stem: "Pooling multiple service lines keeps utilization unchanged but lowers stochastic waiting time, so the answer is not risk-pooling safety stock.",
    correctId: "queueing",
    kind: "near-miss",
    confuserIds: ["risk_pooling"],
  },
  {
    id: "router_queueing_conceptual_1",
    stem: "The trap is entering mean service time as mu instead of converting it into service rate before using the M/M/s sheet.",
    correctId: "queueing",
    kind: "conceptual-trap",
    confuserIds: ["littles_law"],
  },
  {
    id: "router_inventory_timing_direct_1",
    stem: "A full batch arrives all at once after a fixed cook time, and the question asks when inventory jumps occur.",
    correctId: "inventory_timing",
    kind: "direct",
  },
  {
    id: "router_inventory_timing_direct_2",
    stem: "Known demand rates deplete inventory across time segments, and the task is to find stockout times and closing leftovers.",
    correctId: "inventory_timing",
    kind: "direct",
  },
  {
    id: "router_inventory_timing_direct_3",
    stem: "The policy starts replenishment when enough stock remains to cover lead-time demand, then a fixed batch arrives as a jump.",
    correctId: "inventory_timing",
    kind: "direct",
  },
  {
    id: "router_inventory_timing_near_miss_1",
    stem: "There is a batch size and inventory path, but no ordering or holding cost tradeoff to optimize.",
    correctId: "inventory_timing",
    kind: "near-miss",
    confuserIds: ["eoq"],
  },
  {
    id: "router_inventory_timing_near_miss_2",
    stem: "Demand is deterministic by time segment, so the task is timing replenishment arrivals rather than choosing a single-period critical-fractile quantity.",
    correctId: "inventory_timing",
    kind: "near-miss",
    confuserIds: ["newsvendor"],
  },
  {
    id: "router_inventory_timing_conceptual_1",
    stem: "The trap is confusing the time a batch is started with the later moment when that batch is finished and inventory jumps up.",
    correctId: "inventory_timing",
    kind: "conceptual-trap",
    confuserIds: ["safety_stock"],
  },
];

export const ROUTER_STEMS: RouterStem[] = ROUTER_STEM_DATA.map(stem => ({
  ...stem,
  semanticQa: VERIFIED_ROUTER_STEM_QA,
}));
