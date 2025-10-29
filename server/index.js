import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || '';

app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083'
  ],
  credentials: true
}));

let dbConnected = false;

// Simple in-memory fallback data when DB is not connected
const memoryProjects = [
  {
    _id: 'demo-1',
    title: 'Sample Project',
    description: 'This is a sample project served from memory. Add MongoDB URI to use Atlas.',
    image_url: null,
    status: 'active',
    apply_url: 'https://example.com/apply/sample-project',
    skills: ['React', 'TypeScript'],
    owner_name: 'Demo User',
    created_at: new Date().toISOString()
  }
];

// In-memory applications store
const memoryApplications = [];

const memoryInternships = [
  {
    _id: 'demo-1',
    title: 'Frontend Intern',
    company_name: 'Example Co',
    description: 'Sample internship served from memory. Add MongoDB URI to use Atlas.',
    status: 'active',
    location: 'Remote',
    remote: true,
    duration: '3 months',
    stipend: '₹10,000/month',
    skills: ['React', 'CSS'],
    apply_url: 'https://example.com/apply/frontend-intern',
    created_at: new Date().toISOString()
  }
];

// Mongoose models
let Project;
let Internship;

const initDb = async () => {
  if (!MONGODB_URI) {
    console.warn('[InternHub] No MONGODB_URI provided. Running with in-memory data.');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    dbConnected = true;

    const projectSchema = new mongoose.Schema({
      title: { type: String, required: true },
      description: { type: String, required: true },
      image_url: { type: String },
      status: { type: String, default: 'active' },
      apply_url: { type: String },
      skills: { type: [String], default: [] },
      owner_name: { type: String },
      created_at: { type: Date, default: Date.now }
    }, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

    const internshipSchema = new mongoose.Schema({
      title: { type: String, required: true },
      company_name: { type: String, required: true },
      description: { type: String, required: true },
      status: { type: String, default: 'active' },
      location: { type: String },
      remote: { type: Boolean, default: false },
      duration: { type: String },
      stipend: { type: String },
      skills: { type: [String], default: [] },
      apply_url: { type: String },
      source: { type: String },
      source_id: { type: String },
      created_at: { type: Date, default: Date.now }
    }, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

    // Unique index on source/source_id for deduplication when aggregating
    internshipSchema.index({ source: 1, source_id: 1 }, { unique: true, sparse: true });

    Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
    Internship = mongoose.models.Internship || mongoose.model('Internship', internshipSchema);

    console.log('[InternHub] Connected to MongoDB Atlas');
  } catch (err) {
    dbConnected = false;
    console.error('[InternHub] MongoDB connection error:', err.message);
    console.warn('[InternHub] Falling back to in-memory data.');
  }
};

// Add Profile schema & routes
const profileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // will store auth provider id
  email: { type: String },
  full_name: { type: String },
  avatar_url: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Profile = mongoose.models.Profile || mongoose.model('Profile', profileSchema);

// Upsert profile
app.post('/profiles', async (req, res) => {
  try {
    const { id, email, full_name, avatar_url, metadata } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const profile = await Profile.findOneAndUpdate(
      { id },
      { $set: { email, full_name, avatar_url, metadata } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(profile);
  } catch (err) {
    console.error('Profile save error', err);
    res.status(500).json({ error: 'internal' });
  }
});

// Get profile
app.get('/profiles/:id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ id: req.params.id });
    if (!profile) return res.status(404).json({ error: 'not found' });
    res.json(profile);
  } catch (err) {
    console.error('Profile fetch error', err);
    res.status(500).json({ error: 'internal' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to InternHub API', version: '1.0.0' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: dbConnected ? 'connected' : 'not_connected' });
});

// Projects endpoints
app.get('/projects', async (req, res) => {
  try {
    if (dbConnected && Project) {
      const projects = await Project.find().sort({ created_at: -1 });
      return res.json(projects);
    }
    return res.json(memoryProjects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects', details: err.message });
  }
});

// Create project
app.post('/projects', async (req, res) => {
  try {
    const { title, description, image_url, status = 'active', apply_url, skills = [], owner_name, github_url, demo_url } = req.body || {};
    if (!title || !description) {
      return res.status(400).json({ error: 'title and description are required' });
    }

    if (dbConnected && Project) {
      const project = await Project.create({ title, description, image_url, status, apply_url, skills, owner_name, github_url, demo_url });
      return res.status(201).json(project);
    }

    const newProject = {
      _id: `mem-${Date.now()}`,
      title,
      description,
      image_url: image_url || null,
      status,
      apply_url: apply_url || null,
      skills: Array.isArray(skills) ? skills : String(skills || '').split(',').map(s => s.trim()).filter(Boolean),
      owner_name: owner_name || 'Anonymous',
      github_url: github_url || null,
      demo_url: demo_url || null,
      created_at: new Date().toISOString(),
    };
    memoryProjects.unshift(newProject);
    return res.status(201).json(newProject);
  } catch (err) {
    console.error('Create project error', err);
    res.status(500).json({ error: 'Failed to create project', details: err.message });
  }
});

// Apply to join project (collaboration request)
app.post('/projects/:id/applications', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, applicant_name, applicant_email } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message is required' });

    // Verify project exists
    let project;
    if (dbConnected && Project) {
      project = await Project.findById(id);
    } else {
      project = memoryProjects.find(p => String(p._id) === String(id));
    }
    if (!project) return res.status(404).json({ error: 'project not found' });

    const record = {
      _id: `app-${Date.now()}`,
      project_id: dbConnected ? project._id : project._id,
      message,
      applicant_name: applicant_name || 'Anonymous',
      applicant_email: applicant_email || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // For simplicity, store in-memory when DB not connected. If DB connected, you may later persist in a collection.
    memoryApplications.unshift(record);
    return res.status(201).json(record);
  } catch (err) {
    console.error('Apply to project error', err);
    res.status(500).json({ error: 'Failed to apply', details: err.message });
  }
});

// Recommend projects based on skills overlap
app.get('/projects/recommend', async (req, res) => {
  try {
    const skillsParam = req.query.skills;
    const skills = Array.isArray(skillsParam)
      ? skillsParam
      : String(skillsParam || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);

    // Load projects
    let projects = [];
    if (dbConnected && Project) {
      projects = await Project.find().sort({ created_at: -1 });
    } else {
      projects = memoryProjects;
    }

    if (skills.length === 0) return res.json(projects);

    // Score by overlap count
    const scored = projects.map(p => {
      const overlap = (p.skills || []).filter(s => skills.includes(s)).length;
      return { score: overlap, project: p };
    });
    scored.sort((a, b) => b.score - a.score);
    res.json(scored.map(s => s.project));
  } catch (err) {
    res.status(500).json({ error: 'Failed to recommend projects', details: err.message });
  }
});

// Internships endpoints
app.get('/internships', async (req, res) => {
  try {
    // Query params: skills (comma), remote (true/false), location (string), q (search), page, limit
    const skillsParam = req.query.skills;
    const skills = Array.isArray(skillsParam)
      ? skillsParam
      : String(skillsParam || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
    const remoteParam = String(req.query.remote || '').toLowerCase();
    const remote = remoteParam === 'true' ? true : remoteParam === 'false' ? false : undefined;
    const location = req.query.location ? String(req.query.location) : undefined;
    const q = req.query.q ? String(req.query.q) : undefined;
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || '20'), 10) || 20));

    if (dbConnected && Internship) {
      const query = {};
      if (skills && skills.length > 0) {
        query.skills = { $in: skills };
      }
      if (typeof remote === 'boolean') {
        query.remote = remote;
      }
      if (location) {
        query.location = { $regex: new RegExp(location, 'i') };
      }
      // Perform base query
      let cursor = Internship.find(query).sort({ created_at: -1 });
      // Apply pagination
      cursor = cursor.skip((page - 1) * limit).limit(limit);
      let results = await cursor.exec();
      // Fallback text filter client-side if q provided
      if (q) {
        const qLower = q.toLowerCase();
        results = results.filter(r =>
          (r.title || '').toLowerCase().includes(qLower) ||
          (r.company_name || '').toLowerCase().includes(qLower) ||
          (r.description || '').toLowerCase().includes(qLower)
        );
      }
      return res.json(results);
    }

    // In-memory filtering
    let list = [...memoryInternships];
    if (skills && skills.length > 0) {
      list = list.filter(i => (i.skills || []).some(s => skills.includes(s)));
    }
    if (typeof remote === 'boolean') {
      list = list.filter(i => Boolean(i.remote) === remote);
    }
    if (location) {
      const re = new RegExp(location, 'i');
      list = list.filter(i => re.test(String(i.location || '')));
    }
    if (q) {
      const qLower = q.toLowerCase();
      list = list.filter(i =>
        (i.title || '').toLowerCase().includes(qLower) ||
        (i.company_name || '').toLowerCase().includes(qLower) ||
        (i.description || '').toLowerCase().includes(qLower)
      );
    }
    const start = (page - 1) * limit;
    const end = start + limit;
    return res.json(list.slice(start, end));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch internships', details: err.message });
  }
});

// Sync internships from external sources (stubbed aggregator)
app.post('/internships/sync', async (req, res) => {
  try {
    // Stubbed external data. Replace with real connectors (AICTE, Internshala, LinkedIn)
    const externalItems = [
      {
        title: 'AICTE Software Intern',
        company_name: 'AICTE Partner Org',
        description: 'Work on educational software projects. Basic JS required.',
        status: 'active',
        location: 'Bengaluru',
        remote: false,
        duration: '6 months',
        stipend: '₹12,000/month',
        skills: ['JavaScript', 'Node.js'],
        apply_url: 'https://aicte.example/apply/soft-intern',
        source: 'aicte',
        source_id: 'aicte-001',
        created_at: new Date(),
      },
      {
        title: 'Internshala React Intern',
        company_name: 'Startup Labs',
        description: 'Build UI components and polish UX.',
        status: 'active',
        location: 'Remote',
        remote: true,
        duration: '3 months',
        stipend: '₹8,000/month',
        skills: ['React', 'CSS'],
        apply_url: 'https://internshala.example/apply/react-intern',
        source: 'internshala',
        source_id: 'internshala-123',
        created_at: new Date(),
      },
    ];

    let upserted = 0;
    if (dbConnected && Internship) {
      for (const item of externalItems) {
        await Internship.findOneAndUpdate(
          { source: item.source, source_id: item.source_id },
          { $set: item },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        upserted += 1;
      }
    } else {
      // Merge into in-memory list with simple dedupe by apply_url or title,
      // and ensure unique IDs to avoid React key collisions
      externalItems.forEach((item, idx) => {
        const exists = memoryInternships.find(i => i.apply_url === item.apply_url || (i.title === item.title && i.company_name === item.company_name));
        const uniqueId = `mem-${Date.now()}-${Math.random().toString(36).slice(2,8)}-${idx}`;
        const toPush = {
          _id: exists?._id || uniqueId,
          ...item,
          created_at: new Date().toISOString(),
        };
        if (!exists) {
          memoryInternships.unshift(toPush);
          upserted += 1;
        }
      });
    }
    res.json({ status: 'ok', upserted });
  } catch (err) {
    console.error('Internships sync error', err);
    res.status(500).json({ error: 'Failed to sync internships', details: err.message });
  }
});

// Recommend internships based on skills overlap
app.get('/internships/recommend', async (req, res) => {
  try {
    const skillsParam = req.query.skills;
    const skills = Array.isArray(skillsParam)
      ? skillsParam
      : String(skillsParam || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);

    // Load internships
    let internships = [];
    if (dbConnected && Internship) {
      internships = await Internship.find().sort({ created_at: -1 });
    } else {
      internships = memoryInternships;
    }

    if (skills.length === 0) return res.json(internships);

    const scored = internships.map(i => {
      const overlap = (i.skills || []).filter(s => skills.includes(s)).length;
      return { score: overlap, internship: i };
    });
    scored.sort((a, b) => b.score - a.score);
    res.json(scored.map(s => s.internship));
  } catch (err) {
    res.status(500).json({ error: 'Failed to recommend internships', details: err.message });
  }
});

// Start server
app.listen(PORT, async () => {
  await initDb();
  console.log(`[InternHub] API server listening on http://localhost:${PORT}`);
});