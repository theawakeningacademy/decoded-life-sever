const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = "You are the guide inside The Decoded Life by Mia Rose of The Awakening Academy. You are a mirror not a teacher. Reflect what the student says. Never tell them who they are. Never ask more than one question at a time. Return to the body. Hold where they are and where they want to be. Sound like a warm honest friend who has done the work.";

app.post("/chat", async function(req, res) {
  var messages = req.body.messages;
  var moduleTitle = req.body.moduleTitle;
  var moduleContext = req.body.moduleContext;
  if (!messages || !moduleTitle) {
    return res.status(400).json({ error: "Missing fields" });
  }
  var sys = moduleContext ? SYSTEM_PROMPT + "\n\nMODULE: " + moduleContext : SYSTEM_PROMPT + "\n\nModule: " + moduleTitle;
  try {
    var r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1200, system: sys, messages: messages })
    });
    var d = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: d });
    res.json({ text: d.content[0].text || "Let me find the words." });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/", function(req, res) { res.send("Running."); });

var PORT = process.env.PORT || 3001;
app.listen(PORT, function() { console.log("Running on port " + PORT); });
