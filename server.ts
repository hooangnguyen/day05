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



// --- Webhooks / API Routes ---

app.get("/api/test-apify", async (req, res) => {
  try {
    const apifyToken = process.env.APIFY_API_TOKEN;
    const { ApifyClient } = await import('apify-client');
    const client = new ApifyClient({ token: apifyToken });
    const store = await client.store().list({ search: "google jobs" });
    const fs = await import('fs');
    fs.writeFileSync('/app/applet/output.txt', JSON.stringify(store.items.map(i => i.name)));
    res.json(store);
  } catch (e: any) {
    const fs = await import('fs');
    fs.writeFileSync('/app/applet/output.txt', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/cv/analyze", upload.single("cv"), async (req, res) => {
  try {
    const file = req.file;
    const { apiKey, role } = req.body; // user can pass their own key
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
        { text: `You are a recruitment AI for Project X Vietnam. Analyze the following CV, with the user's target role being: ${role || "Not specified"}. Extract the key skills, experience, and provide 3-5 actionable, track-specific suggestions for improvement based on the content (e.g. formatting, missing keywords, impactful phrasing) focused on their target role. Respond in JSON format.\n\nIMPORTANT: All string fields in the JSON response MUST be written in Vietnamese (tiếng Việt).` },
        { text: `CV Content:\n${cvText}` }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extracted_skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of skills found in CV" },
            overall_feedback: { type: Type.STRING, description: "General summary of the CV quality (in Vietnamese)" },
            improvement_suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific suggestions to improve the CV (in Vietnamese)" },
            extracted_summary: { type: Type.STRING, description: "A brief summary of the candidate's profile (in Vietnamese)" },
            extracted_location: { type: Type.STRING, description: "The candidate's current location or preferred location based on the CV. Set to empty string if not found. (in Vietnamese)" },
            parsed_cv: {
              type: Type.OBJECT,
              description: "Structured representation of the CV. (in Vietnamese)",
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING, description: "Current or target role" },
                email: { type: Type.STRING },
                location: { type: Type.STRING },
                links: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Links like LinkedIn, GitHub" },
                summary: { type: Type.STRING },
                experience: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT, 
                    properties: {
                      title: { type: Type.STRING },
                      company: { type: Type.STRING },
                      period: { type: Type.STRING },
                      bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                  } 
                }
              }
            }
          },
          required: ["extracted_skills", "overall_feedback", "improvement_suggestions", "extracted_summary", "extracted_location"]
        }
      }
    });

    let aiJsonStr = response.text ? response.text.trim() : "{}";
    if (aiJsonStr.startsWith("```json")) aiJsonStr = aiJsonStr.replace(/^```json/i, "");
    if (aiJsonStr.endsWith("```")) aiJsonStr = aiJsonStr.replace(/```$/, "");
    aiJsonStr = aiJsonStr.trim();
    const analysis = JSON.parse(aiJsonStr);
    
    res.json({ success: true, cvText, analysis });
  } catch (error: any) {
    console.error("CV Analysis Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze CV" });
  }
});

app.post("/api/jobs/search", async (req, res) => {
    try {
        const { query, cvData, cvSummary, cvSkills, cvLocation, apiKey } = req.body;
        
        let jobs = [];
        
        // Fetch from free public APIs (Remotive and Arbeitnow)
        try {
            const titleFilter = query || "software engineer";
            const locationQuery = cvLocation || "";
            
            const fetchRemotiveJobs = async () => {
                 try {
                     const searchTerm = encodeURIComponent(titleFilter + (locationQuery ? " " + locationQuery : ""));
                     const res = await fetch(`https://remotive.com/api/remote-jobs?search=${searchTerm}&limit=15`);
                     if (res.ok) {
                         const dataJson = await res.json();
                         return Array.isArray(dataJson.jobs) ? dataJson.jobs : [];
                     }
                 } catch (e) { console.error("Remotive error", e); }
                 return [];
            };

            const fetchArbeitnowJobs = async () => {
                 try {
                     const res = await fetch(`https://www.arbeitnow.com/api/job-board-api`);
                     if (res.ok) {
                         const dataJson = await res.json();
                         let arbeitJobs = Array.isArray(dataJson.data) ? dataJson.data : [];
                         if (titleFilter) {
                             const lowerTitle = titleFilter.toLowerCase();
                             arbeitJobs = arbeitJobs.filter((j: any) => (j.title || '').toLowerCase().includes(lowerTitle) || (j.description || '').toLowerCase().includes(lowerTitle));
                         }
                         return arbeitJobs;
                     }
                 } catch (e) { console.error("Arbeitnow error", e); }
                 return [];
            };

            const [remotiveJobs, arbeitnowJobs] = await Promise.all([
                fetchRemotiveJobs(),
                fetchArbeitnowJobs()
            ]);
            
            const rawJobs = [...remotiveJobs.slice(0, 15), ...arbeitnowJobs.slice(0, 15)];
            
            if (rawJobs.length > 0) {
                const truncate = (s: string, max: number) => typeof s === 'string' && s.length > max ? s.substring(0, max) : s;

                jobs = rawJobs.map((j: any) => ({
                    title: truncate(j.title || "Unknown Title", 255),
                    company: truncate(j.company || j.company_name || "Unknown Company", 255),
                    location: truncate(j.candidate_required_location || j.location || "Remote", 255),
                    description: truncate(j.description || "", 15000),
                    requirements: truncate(j.description || "", 15000),
                    url: truncate(j.url || j.applyLink || `https://google.com/search?q=${encodeURIComponent(j.title || '')}`, 500),
                    source: truncate(j.source || (j.candidate_required_location ? "Remotive" : "Arbeitnow"), 255)
                }));
            } else {
                console.warn("Public APIs search returned no jobs.");
                jobs = [];
            }
        } catch (err) {
            console.warn("Public APIs search errored.", err);
            jobs = [];
        }

        if (jobs.length === 0) {
            return res.json({ success: true, results: [] });
        }

        const ai = getAIClient(apiKey);
        
        // Prepare context based on whether structured CV Data is available
        const userContextString = cvData ? `User CV Structure Details:\n${JSON.stringify(cvData, null, 2)}` : `User CV Summary: ${cvSummary || "Not provided"}\nUser CV Skills: ${(cvSkills||[]).join(", ")}`;

        // Use Gemini to filter and evaluate fit percentage
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: [
                { 
                 text: "You are a recruitment AI for Project X Vietnam. Evaluate the provided jobs against the user's dream job query and their structured CV data. Return a JSON array of evaluated jobs with a fit_percent (0-100), a short reason for the fit based on concrete skills/experience matches or gaps, and keep original job fields. Filter out jobs that are completely irrelevant (<20%). IMPORTANT: You MUST keep the EXACT original `url` field from the provided jobs array, do not modify or make up URLs." 
                },
                { 
                 text: `Query: ${query || "No specific query, matching by CV"}\n\n${userContextString}\n\nJobs: ${JSON.stringify(jobs)}`
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
    try {
      const apifyToken = process.env.APIFY_API_TOKEN || "apify_api_h4tLof5F3295xK0Oq16zS96y1r8R4f00RXXP";
      if (apifyToken) {
        const { ApifyClient } = await import('apify-client');
        const client = new ApifyClient({ token: apifyToken });
        const store = await client.store().list({ search: "google jobs" });
        const fs = await import('fs');
        fs.writeFileSync('/app/applet/output.txt', JSON.stringify(store.items.map(i => i.name)));
      }
    } catch(e) {
      console.log("Error querying apify", e);
    }
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
