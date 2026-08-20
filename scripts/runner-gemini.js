import { GoogleGenerativeAI } from "@google/generative-ai";
import { parse } from 'smol-toml';

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
    console.error("❌ Error: GEMINI_API_KEY environment variable is not set.");
    console.error("   Run with: GEMINI_API_KEY=your_key node scripts/runner-gemini.js");
    process.exit(1);
}

const ai = new GoogleGenerativeAI(apiKey);

// Fallback helper to support flexible model identifiers
function getModel(modelName = "gemini-3.5-flash") {
    try {
        return ai.getGenerativeModel({ model: modelName });
    } catch (e) {
        return ai.getGenerativeModel({ model: "gemini-3.5-flash" });
    }
}

const model = getModel("gemini-3.5-flash");

const SYSTEM_INSTRUCTION = `You are an Autonomous AI QA & Testing Engineer evaluating WebMCP tool invocations.

Your task:
1. Verify if the tool identified in the test step is registered in the provided WebMCP tools configuration.
2. Evaluate if the input arguments and expected output assertion match expected tool behavior.
3. If the test step is valid and matches assertions, output "STATUS: PASSED".
4. If the test step fails (missing tool, invalid arguments, or assertion mismatch):
   - Output "STATUS: FAILED"
   - Provide a clear "FAILURE REASON"
   - Provide a "SUGGESTED CODE FIX" (showing TypeScript/TOML code to resolve the failure).`;

async function queryGemini(prompt) {
    const fullPrompt = `${SYSTEM_INSTRUCTION}\n\n${prompt}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
}

async function runGeminiAiTest() {
    console.log("Fetching test plan from Angular app (http://localhost:4200/assets/webmcp-tools.toml)...");
    const planRes = await fetch('http://localhost:4200/assets/webmcp-tools.toml');
    if (!planRes.ok) {
        throw new Error(`Failed to load TOML plan: ${planRes.status} ${planRes.statusText}`);
    }
    const plan = parse(await planRes.text());
    const tools = plan.tools;

    console.log(`\n🚀 Connected to Google Gemini API (Model: 'gemini-3.5-flash')\n`);

    for (const test of plan.tests) {
        console.log(`========================================`);
        console.log(`🧪 Test Suite: ${test.name}`);
        console.log(`   Description: ${test.description}`);
        console.log(`========================================`);

        for (const step of test.steps) {
            console.log(`\n➡️  Step: Call tool '${step.tool}'`);
            console.log(`    Args:`, JSON.stringify(step.args));
            console.log(`    Assert:`, JSON.stringify(step.assert));

            const prompt = `Available Registered WebMCP Tools:\n${JSON.stringify(tools, null, 2)}\n\n` +
                `Test Step Under Evaluation:\n` +
                `- Tool Identifier: ${step.tool}\n` +
                `- Input Arguments: ${JSON.stringify(step.args)}\n` +
                `- Expected Output Assertion: ${JSON.stringify(step.assert)}\n\n` +
                `Perform QA analysis. Check if tool '${step.tool}' exists and if the expected assertion is satisfied. If it fails, suggest code fixes in TypeScript or TOML.`;

            try {
                const aiResult = await queryGemini(prompt);
                console.log(`\n🤖 Gemini QA Analysis:\n${aiResult.trim()}\n`);
            } catch (err) {
                console.error(`❌ Error querying Gemini:`, err.message);
            }
        }
    }
}

runGeminiAiTest().catch(console.error);
