/* ============================================================
   REPS — OPNS-430 Archetype Bank (Deterministic, Verified)
   6 core archetypes from the PRD
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
    formula: "effect = β₁ in  Y = β₀ + β₁·treatment ;  significant if p(β₁) < 0.05",
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
      { id: "exp_rc3", label: "Misclassified bucket (SPC vs experiment / p-flip)" },
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
      { id: "spc_rc3", label: "Treated the 3σ false-alarm rate as a defect rate" },
      { id: "spc_rc4", label: "Widened limits for a critical process (should narrow)" },
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
];

export const ROUTER_STEMS: RouterStem[] = ROUTER_STEM_DATA.map(stem => ({
  ...stem,
  semanticQa: VERIFIED_ROUTER_STEM_QA,
}));
