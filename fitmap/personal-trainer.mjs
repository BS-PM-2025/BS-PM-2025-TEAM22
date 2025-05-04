import OpenAI from "openai";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// התחברות ל-OpenRouter
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://fitmap22.vercel.app",
    "X-Title": "FitDray Personal Trainer"
  }
});

app.post("/api/gpt", async (req, res) => {
  const { message, userProfile } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // 🔥 עברית טובה! אפשר גם: "openchat/openchat-3.5-1210"
      messages: [
        {
          role: "system",
          content: "אתה מאמן כושר אישי. כל התשובות שלך בעברית בלבד. היה מקצועי, תומך ומעודד.",
        },
        {
          role: "user",
          content: `פרטי משתמש:
שם: ${userProfile?.name || 'משתמש'}
רמת כושר: ${userProfile?.fitness_level || 'מתחיל'}
העדפות אימון: ${userProfile?.preferred_workouts?.join(', ') || 'לא צויין'}

שאלה: ${message}`
        }
      ]
    });

    res.json({ content: completion.choices[0].message.content });

  } catch (error) {
    console.error("❌ שגיאה מ־OpenRouter:", error.message);
    res.status(500).json({ error: "שגיאה בשרת הפרוקסי" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ OpenRouter Proxy running at https://0.0.0.0:${PORT}`);
});
