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

    const aiJsonStr = response.text ? response.text.trim() : "{}";
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
        
        // Fetch directly from RapidAPI APIs (Google Jobs & LinkedIn Jobs)
        try {
            const titleFilter = query || "software engineer";
            const locationQuery = cvLocation || "";
            const rapidApiKey = process.env.RAPIDAPI_KEY || "";

            const fetchGooglePage = async (page: number) => {
                try {
                    const rapidApiRes = await fetch(`https://google-jobs-api.p.rapidapi.com/google-jobs/relocation?include=${encodeURIComponent(titleFilter)}${locationQuery ? `&location=${encodeURIComponent(locationQuery)}` : ""}&page=${page}`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "x-rapidapi-host": "google-jobs-api.p.rapidapi.com",
                            "x-rapidapi-key": rapidApiKey
                        }
                    });
                    if (rapidApiRes.ok) {
                        const dataJson = await rapidApiRes.json();
                        return Array.isArray(dataJson.jobs) ? dataJson.jobs : [];
                    }
                } catch (e) { console.error(e); }
                return [];
            };

            const fetchLinkedInJobs = async () => {
                 try {
                     const rapidApiRes = await fetch(`https://linkedin-job-search-api.p.rapidapi.com/active-jb-1h?offset=0&title_filter=${encodeURIComponent(titleFilter)}&location_filter=${encodeURIComponent(locationQuery)}&description_type=text`, {
                         method: "GET",
                         headers: {
                             "Content-Type": "application/json",
                             "x-rapidapi-host": "linkedin-job-search-api.p.rapidapi.com",
                             "x-rapidapi-key": rapidApiKey
                         }
                     });
                     if (rapidApiRes.ok) {
                         const dataJson = await rapidApiRes.json();
                         // API might return array directly or within `data`
                         return Array.isArray(dataJson) ? dataJson : (Array.isArray(dataJson.data) ? dataJson.data : []);
                     }
                 } catch (e) { console.error(e); }
                 return [];
            };

            const fetchApifyJobs = async () => {
                 const apifyToken = process.env.APIFY_API_TOKEN;
                 if (!apifyToken) return [];
                 
                 try {
                     const { ApifyClient } = await import('apify-client');
                     const client = new ApifyClient({ token: apifyToken });
                     
                     // Run the johnvc/google-jobs-scraper actor
                     const run = await client.actor("johnvc/google-jobs-scraper").call({
                         queries: locationQuery ? `${titleFilter} in ${locationQuery}` : titleFilter,
                         maxItems: 15,
                         maxPagesPerQuery: 1
                     });
                     
                     const { items } = await client.dataset(run.defaultDatasetId).listItems();
                     return items;
                 } catch (e) {
                     console.error("Apify Error:", e);
                     return [];
                 }
            };

            // Fetch from multiple sources in parallel
            const pagesToFetch = [1, 2, 3];
            const [googlePages, linkedinJobs, apifyJobs] = await Promise.all([
                Promise.all(pagesToFetch.map(p => fetchGooglePage(p))),
                fetchLinkedInJobs(),
                fetchApifyJobs()
            ]);
            
            const rawJobs = [...googlePages.flat(), ...linkedinJobs, ...apifyJobs];
            
            if (rawJobs.length > 0) {
                const truncate = (s: string, max: number) => typeof s === 'string' && s.length > max ? s.substring(0, max) : s;

                jobs = rawJobs.map((j: any) => ({
                    title: truncate(j.title || "Unknown Title", 255),
                    company: truncate(j.company || j.companyName || j.company_name || j.organization || "Unknown Company", 255),
                    location: truncate(j.location || j.company_location || (j.locations_derived && j.locations_derived[0]) || "Unknown Location", 255),
                    description: truncate(j.snippet || j.description || j.description_text || "", 15000),
                    requirements: truncate(j.snippet || j.description || j.description_text || "", 15000),
                    url: truncate(j.url || j.applyLink || j.googleJobsUrl || j.job_url || j.link || j.external_apply_url || (j.apply_options && j.apply_options.length > 0 ? j.apply_options[0].link : '') || `https://google.com/search?q=${encodeURIComponent(j.title || '')}`, 500),
                    source: truncate(j.source || (j.apply_options ? "Apify (Google Jobs)" : (j.job_url || j.external_apply_url ? "LinkedIn (RapidAPI)" : "Google Jobs (RapidAPI)")), 255)
                }));
            } else {
                console.warn("RapidAPI search returned no jobs, falling back to mock jobs");
                jobs = MOCK_DECODA_JOBS;
            }
        } catch (err) {
            console.warn("RapidAPI search errored, falling back to mock jobs", err);
            jobs = MOCK_DECODA_JOBS;
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
