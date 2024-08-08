const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../config/environment');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
});

const generationConfig = {
  temperature: 0,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 10000,
  responseMimeType: 'text/plain',
};

const startChatSession = async (message) => {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error('Error in chat session with Gemini AI:', error);
    throw error;
  }
};

const analyzeData = async (data) => {
  try {
    const message = `Analyze data: ${JSON.stringify(data)}`;
    const response = await startChatSession(message);
    return response;
  } catch (error) {
    console.error('Error during data analysis:', error);
    throw error;
  }
};

module.exports = {
  analyzeData,
  startChatSession,
};

/* 
In summary, I've created an application that uses Google's Generative AI API to analyze data. 
The application has two main functions: `startChatSession` which starts a new chat session with the generative model, and `analyzeData` 
which sends the data to the `startChatSession` function and returns the model's response. */
