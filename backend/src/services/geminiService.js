const { GoogleGenerativeAI } = require("@google/generative-ai");
const { supabaseAdmin } = require('../config/supabase');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates daily financial insights using the Gemini LLM.
 * This takes real bills, cards, and debt data to produce personalized advice.
 *
 * @returns {Object} - { daily_quote, projected_savings, card_insights, health_explanation }
 */
const generateDailyInsights = async () => {
    try {
        // 1. Fetch real context data from Supabase
        // Include related cards data so we can access bankname
        const { data: bills, error: bErr } = await supabaseAdmin.from('bills').select('amountdue, duedate, cardid, cards(bankname, cardname)').neq('status', 'Paid');
        const { data: cards, error: cErr } = await supabaseAdmin.from('cards').select('*');

        if (bErr) {
            console.error('❌ Error fetching bills:', bErr.message);
            throw new Error(`Bills fetch error: ${bErr.message}`);
        }
        if (cErr) {
            console.error('❌ Error fetching cards:', cErr.message);
            throw new Error(`Cards fetch error: ${cErr.message}`);
        }

        console.log('🤖 AI Context Raw Debug:', { 
            foundBills: bills?.length || 0, 
            foundCards: cards?.length || 0
        });

        if (!cards || cards.length === 0) {
            console.log('⚠️ No cards found for AI insights.');
            throw new Error('No cards registered yet. Please add cards first.');
        }

        // Calculate total limits and filter cards with valid data
        const cardsWithLimits = cards.filter(c => c.creditlimit && c.creditlimit > 0);
        const totalCreditLimit = cardsWithLimits.reduce((sum, c) => sum + (c.creditlimit || 0), 0);
        const totalDebt = bills?.reduce((s, b) => s + (b.amountdue || 0), 0) || 0;
        
        const context = {
            total_active_bills: bills?.length || 0,
            total_debt: totalDebt,
            total_credit_limit: totalCreditLimit,
            card_count: cards.length,
            card_limits: cards.map(c => ({ name: c.cardname, limit: c.creditlimit || 'Not provided' })),
            upcoming_dues: bills?.map(b => ({ bank: b.cards?.bankname, amount: b.amountdue, due: b.duedate }))
        };

        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

        const prompt = `
            You are a senior financial advisor for a premium credit card management app.
            User Financial Context: ${JSON.stringify(context, null, 2)}
            
            User's Cards: ${JSON.stringify(cards.map(c => ({ bankName: c.bankname, cardName: c.cardname, limit: c.creditlimit || 'Unknown' })), null, 2)}
            
            CRITICAL REQUIREMENTS:
            1. Generate ONE insight entry for EACH card (${cards.length} total cards)
            2. For each card, provide 3 suggestions (mix of strategy, reward, and alert types)
            3. Calculate utilization as: (card's pending bills / card limit) * 100. If limit unknown, estimate as 25-50%
            4. Each suggestion must be max 20 words and actionable
            5. Daily quote should be a financial wisdom statement (max 15 words)
            6. Projected savings should be a realistic number based on the debt situation
            
            Generate ONLY a valid JSON response matching this schema:
            {
                "daily_quote": "Your wealth grows from what you keep, not just what you make.",
                "projected_savings": 5000,
                "card_insights": [
                    {
                        "bankName": "Card Bank Name Here",
                        "utilization": 45,
                        "suggestions": [
                            {"type": "strategy", "text": "Consider paying 50% of balance to reduce interest charges."},
                            {"type": "reward", "text": "You're earning rewards on every transaction."},
                            {"type": "alert", "text": "Payment due in 5 days. Set up auto-pay now."}
                        ]
                    }
                ],
                "health_explanation": "Your credit utilization is healthy at 40%. Maintain on-time payments."
            }
            
            CRITICAL: Always return ${cards.length} card_insights entries, one per card. Never return empty card_insights array.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Clean up markdown markers if Gemini adds them
        const cleanJSON = responseText.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanJSON);

        return parsed;
    } catch (err) {
        console.error("❌ Gemini Generation Error:", err.message);
        console.error("❌ Stack trace:", err.stack);
        // Throw error instead of returning fallback, so caller knows generation failed
        throw new Error(`Failed to generate AI insights: ${err.message}`);
    }
};

/**
 * Persists the latest AI insights to Supabase.
 */
const syncAIInsights = async () => {
    try {
        const insights = await generateDailyInsights();
        console.log('✅ Generated AI Insights:', JSON.stringify(insights, null, 2));
        
        const { error } = await supabaseAdmin.from('ai_insights').insert([insights]);
        if (error) throw error;
        console.log("✅ AI Insights synchronized and stored for the next 24 hours.");
        return insights;
    } catch (err) {
        console.error("❌ Failed to sync AI Insights:", err.message);
        console.error("❌ Stack trace:", err.stack);
        // Don't return fallback data - let the error propagate so the endpoint can handle it
        throw err;
    }
};

module.exports = { generateDailyInsights, syncAIInsights };
