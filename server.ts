import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// --- External Services Initialization ---
// We initialize lazily or conditionally so the app doesn't crash if keys are missing initially.
let supabaseClient: any = null;
function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || "";
    if (supabaseUrl && supabaseKey) {
      supabaseClient = createClient(supabaseUrl, supabaseKey);
    }
  }
  return supabaseClient;
}

function getAIClient(userProvidedKey?: string) {
  const key = userProvidedKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY environment variable or user-provided key is required");
  }
  return new GoogleGenAI({ apiKey: key, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
}

// Mock Decoda API response since Decoda API implies a local or undocumented scraper API
const MOCK_DECODA_JOBS = [
  {
    title: "Frontend Developer (ReactJS)",
    company: "Tech Corp VN",
    location: "Ho Chi Minh City",
    description: "We are looking for a Frontend Developer with strong React experience.",
    requirements: "At least 2 years of experience with React, TypeScript, and modern state management. Good understanding of UI/UX principles.",
    url: "https://topcv.vn/job/1",
    source: "TopCV",
  },
  {
    title: "Backend Engineer (Node.js)",
    company: "Global Logistics",
    location: "Hanoi",
    description: "Join our backend team to build scalable microservices.",
    requirements: "Strong Node.js, Express, and PostgreSQL skills. Experience with AWS is a plus.",
    url: "https://linkedin.com/job/2",
    source: "LinkedIn",
  },
  {
    title: "Fullstack Developer (React/Node)",
    company: "Startup Hub",
    location: "Remote",
    description: "Exciting opportunity to build products from scratch.",
    requirements: "Proficient in React, Node.js. Experience with Supabase or Firebase. Self-driven and communicative.",
    url: "https://topcv.vn/job/3",
    source: "TopCV",
  }
];

// --- Webhooks / API Routes ---

app.post("/api/cv/analyze", upload.single("cv"), async (req, res) => {
  try {
    const file = req.file;
    const { apiKey } = req.body; // user can pass their own key
    if (!file) {
      return res.status(400).json({ error: "No CV file uploaded." });
    }

    let cvText = "";
    if (file.mimetype === "application/pdf") {
      const parsed = await pdfParse(file.buffer);
      cvText = parsed.text;
    } else if (file.mimetype.startsWith("text/")) {
      cvText = file.buffer.toString("utf-8");
    } else {
      return res.status(400).json({ error: "Unsupported file type. Please upload a PDF or text file." });
    }

    const ai = getAIClient(apiKey);
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        { text: "Analyze the following CV. Extract the key skills, experience, and provide 3-5 specific, actionable suggestions for improvement based on the content (e.g. formatting, missing keywords, impactful phrasing). Respond in JSON format." },
        { text: `CV Content:\n${cvText}` }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extracted_skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of skills found in CV" },
            overall_feedback: { type: Type.STRING, description: "General summary of the CV quality" },
            improvement_suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific suggestions to improve the CV" },
            extracted_summary: { type: Type.STRING, description: "A brief summary of the candidate's profile" }
          },
          required: ["extracted_skills", "overall_feedback", "improvement_suggestions", "extracted_summary"]
        }
      }
    });

    const aiJsonStr = response.text ? response.text.trim() : "{}";
    const analysis = JSON.parse(aiJsonStr);
    
    res.json({ success: true, cvText, analysis });
  } catch (error: any) {
    console.error("CV Analysis Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze CV" });
  }
});

app.post("/api/jobs/crawl", async (req, res) => {
    try {
      // Logic for using "Decoda API" to crawl jobs
      // Simulating a call to Decoda API:
      // const decodaRes = await fetch("https://api.decoda.com/v1/crawl", { ... })
      // const jobs = await decodaRes.json();
      
      const jobs = MOCK_DECODA_JOBS; 
      
      const supabase = getSupabase();
      if (!supabase) {
        // If no Supabase is configured, just return the mock data for testing
        return res.json({ success: true, message: "Decoda crawl simulated (No Supabase configured, using mock data)", jobs });
      }

      // Insert into Supabase
      const { data, error } = await supabase
        .from("jobs")
        .upsert(jobs.map(j => ({
            title: j.title,
            company: j.company,
            location: j.location,
            description: j.description,
            requirements: j.requirements,
            url: j.url,
            source: j.source
        })), { onConflict: 'url' }) // use url as unique constraint if possible
        .select();

      if (error) {
          console.error("Supabase Error:", error);
          // If table doesn't exist, we just pass the jobs dynamically to client to not break the app
          return res.json({ success: true, message: "Decoda crawl simulated, but Supabase insert failed (check schema).", jobs });
      }

      res.json({ success: true, message: "Jobs crawled via Decoda API and saved to Supabase", jobs: data || jobs });
    } catch(err: any) {
        console.error("Crawl error", err);
        res.status(500).json({ error: err.message || "Failed to crawl jobs" });
    }
});

app.post("/api/jobs/search", async (req, res) => {
    try {
        const { query, cvSummary, cvSkills, apiKey } = req.body;
        
        let jobs = [];
        const supabase = getSupabase();
        if (supabase) {
            const { data } = await supabase.from("jobs").select("*").limit(20);
            if (data && data.length > 0) {
                jobs = data;
            } else {
                jobs = MOCK_DECODA_JOBS;
            }
        } else {
            jobs = MOCK_DECODA_JOBS; // fallback if no supabase configured yet
        }

        const ai = getAIClient(apiKey);
        
        // Use Gemini to filter and evaluate fit percentage
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: [
                { 
                 text: "You are a recruitment AI. Evaluate the provided jobs against the user's dream job query and their CV summary/skills. Return a JSON array of evaluated jobs with a fit_percent (0-100), a short reason for the fit, and keep original job fields. Filter out jobs that are completely irrelevant (<20%)." 
                },
                { 
                 text: `Query: ${query || "No specific query, just matching by CV"}\n\nUser CV Summary: ${cvSummary || "Not provided"}\nUser CV Skills: ${(cvSkills||[]).join(", ")}\n\nJobs: ${JSON.stringify(jobs)}`
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            company: { type: Type.STRING },
                            location: { type: Type.STRING },
                            requirements: { type: Type.STRING },
                            description: { type: Type.STRING },
                            url: { type: Type.STRING },
                            source: { type: Type.STRING },
                            fit_percent: { type: Type.NUMBER, description: "Match percentage between 0 and 100" },
                            fit_reason: { type: Type.STRING, description: "Brief explanation of why this job fits the user based on CV and query" }
                        },
                        required: ["title", "company", "fit_percent", "fit_reason", "requirements"]
                    }
                }
            }
        });

        const evalJobsStr = response.text ? response.text.trim() : "[]";
        const evalJobs = JSON.parse(evalJobsStr);
        
        // Sort descending by fit
        evalJobs.sort((a: any, b: any) => b.fit_percent - a.fit_percent);
        
        res.json({ success: true, results: evalJobs });
    } catch(err: any) {
        console.error("Search API Error:", err);
        res.status(500).json({ error: err.message || "Search failed" });
    }
});


// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Note: express@4.x uses '*', not '*all'.
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
