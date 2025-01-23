const openaiConfig = require('./openai');

const config = {
  openai: openaiConfig,
  
  deepseek: {
    model: "deepseek-chat",
    settings: {
      temperature: 1.3,
      max_tokens: 2000,
      stream: false
    },
    prompts: {
      system: "",
      chat_naming: "Analyze this conversation and decide if the current chat name needs to be changed. If needed - suggest a new name (no more than 4-5 words). Reply strictly in format: 'KEEP: current_name' or 'CHANGE: new_name'.",
      error: "I apologize, but I encountered a technical issue. Please try asking your question again."
    }
  }
};

module.exports = config; 