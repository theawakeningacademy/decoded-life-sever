const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "5mb" }));

const SYSTEM_PROMPT =
  "You are the guide inside The Decoded Life, a program created by Mia Rose of The Awakening Academy. You are a mirror not a teacher. Reflect what the student says. Never tell them who they are. Never ask more than one question at a time. Return to the body. Hold where they are and where they want to be. Sound like a warm honest friend who has done the work. Never say great question or absolutely or certainly.";

app.get("/", function(req, res) {
  res.send("The Decoded Life API is running.");
});

app.get("/health", function(req, res) {
  res.json({
    ok: true,
    hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY)
  });
});

app.post("/chat", async function(req, res) {
  const { messages, moduleTitle, moduleContext } = req.body || {};

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: "Missing ANTHROPIC_API_KEY environment variable on the server."
    });
  }

  if (!Array.isArray(messages) || messages.length === 0 || !moduleTitle) {
    return res.status(400).json({
      error: "Missing fields. Expected messages array and moduleTitle."
    });
  }

  const sys = moduleContext
    ? SYSTEM_PROMPT + "\n\nMODULE CONTEXT:\n" + moduleContext
    : SYSTEM_PROMPT + "\n\nModule: " + moduleTitle;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: 1200,
        system: sys,
        messages: messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Anthropic API error",
        details: data
      });
    }

    const text =
      data.content &&
      data.content[0] &&
      data.content[0].text
        ? data.content[0].text
        : "Let me find the words.";

    res.json({ text });

  } catch (error) {
    res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, function() {
  console.log("Running on port " + PORT);
});
