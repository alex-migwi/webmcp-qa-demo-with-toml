import { parse } from 'smol-toml';

const LM_STUDIO_BASE = "http://localhost:1234/v1";

const SYSTEM_INSTRUCTION = `You are an Autonomous AI QA & Testing Engineer evaluating WebMCP tool invocations.

Your task:
1. Verify if the tool identified in the test step is registered in the provided WebMCP tools configuration.
2. Evaluate if the input arguments and expected output assertion match expected tool behavior.
3. If the test step is valid and matches assertions, output "STATUS: PASSED".
4. If the test step fails (missing tool, invalid arguments, or assertion mismatch):
   - Output "STATUS: FAILED"
   - Provide a clear "FAILURE REASON"
   - Provide a "SUGGESTED CODE FIX" (showing TypeScript/TOML code to resolve the failure).`;

async function getActiveModel() {
    try {
        const response = await fetch(`${LM_STUDIO_BASE}/models`);
        if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.length > 0) {
                return data.data[0].id;
            }
        }
    } catch (err) {
        console.warn("Could not fetch model list from LM Studio, using default.");
    }
    return "qwen3.5-4b-typescript-coder";
}

async function queryLmStudio(modelId, prompt) {
    const response = await fetch(`${LM_STUDIO_BASE}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: modelId,
            messages: [
                { role: "system", content: SYSTEM_INSTRUCTION },
                { role: "user", content: prompt }
            ],
            temperature: 0.1,
            stream: false
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`LM Studio HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

async function runAiTest() {
    console.log("Fetching test plan from Angular app (http://localhost:4200/assets/webmcp-tools.toml)...");
    const planRes = await fetch('http://localhost:4200/assets/webmcp-tools.toml');
    if (!planRes.ok) {
        throw new Error(`Failed to load TOML plan: ${planRes.status} ${planRes.statusText}`);
    }
    const plan = parse(await planRes.text());
    const tools = plan.tools;

    const modelId = await getActiveModel();
    console.log(`\n🚀 Connected to local LM Studio (Model: '${modelId}') at ${LM_STUDIO_BASE}\n`);

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
                const aiResult = await queryLmStudio(modelId, prompt);
                console.log(`\n🤖 LM Studio Response:\n${aiResult.trim()}\n`);
            } catch (err) {
                console.error(`❌ Error querying LM Studio:`, err.message);
            }
        }
    }
}

runAiTest().catch(console.error);