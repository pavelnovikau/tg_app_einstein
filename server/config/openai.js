const openaiConfig = {
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  assistantId: process.env.OPENAI_ASSISTANT_ID,
  settings: {
    temperature: 1,
    max_tokens: 3000,
    presence_penalty: 0.1,
    frequency_penalty: 0.1
  },
  prompts: {
    system: "",
    chat_naming: "Analyze this conversation and decide if the current chat name needs to be changed. If needed - suggest a new name (no more than 4-5 words). Reply strictly in format: 'KEEP: current_name' or 'CHANGE: new_name'.",
    error: "I apologize, but I encountered an error. Could you please rephrase your question or try again?"
  }
};

module.exports = openaiConfig; 