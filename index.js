const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const path = require('path');

dotenv.config();
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

// Set up OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const conversation = req.body.conversation || [];

  // Add instructions to help guide the assistant
  const messages = [
    {
      role: "system",
      content: `
        You are an assistant that helps collect information for AI services. 
        First, ask the user what they need help with. Then, based on their response, 
        ask for the required details (name, email, address, availability). 
        Ask if they'd like to sign up for a free account to receive updates and newsletters. 
        Keep responses short and friendly. 
        After gathering all info, thank them and let them know someone will contact them soon.
      `,
    },
    ...conversation,
    { role: "user", content: userMessage },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 150,  // Limited response to ensure brevity
      temperature: 0.7,  // Maintain conversation flow
    });

    const reply = response.choices[0]?.message?.content || "Sorry, I didn’t get that.";
    res.json({ message: reply });
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(200).json({ message: "Something went wrong. Please try again later." });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
