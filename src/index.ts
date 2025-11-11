import * as core from "@actions/core";
import * as github from "@actions/github";
import OpenAI from "openai";


async function run(): Promise<void> {
  try {
    // Check if the PR is in draft (if it is, exit early)
    const pr = github.context.payload.pull_request;
    if (pr && pr.draft) {
      core.info("Pull request is not ready for review. Exiting...");
      return;
    }

    // Get GH Token
    const token = process.env['GITHUB_TOKEN']
    if (token === undefined) {
      throw new Error('GITHUB_TOKEN is not set')
    }

    // Read inputs
    const endpoint = core.getInput('endpoint')
    const model = core.getInput('model') || 'gpt-4o'
    const maxTokens = parseInt(core.getInput('max_tokens')) || 1024

    // Create client
    const client = new OpenAI({
      apiKey: token,
      baseURL: endpoint,
    });

    // Run inference
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: "You are a bot that runs in a GitHub Action. Your purpose is to look at the diff for the PR and determine if there have been significant changes to the repository that warrant a change to the current version of documentation." },
        {role: "user", content: "Here is the diff for the current PR:\n\n" + pr?.body + "\n\nBased on this diff, please respond with a concise summary of the changes and whether they require updates to the documentation. Do not provide recommended documentation changes, just say if documentation changes are needed."}
      ],
      max_tokens: maxTokens,
    });

    core.info(`Response: ${response.choices[0].message.content}`);
      
    
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run()


