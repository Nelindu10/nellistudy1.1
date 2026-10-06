import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ObjectId } from 'mongodb';
import { connectToDatabase, DisciplineDocument, StudyTopicDocument } from './src/db/mongodb.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// 1. DATABASE CONNECTION RETRIEVAL
// ============================================================================
async function getCollections() {
  return await connectToDatabase();
}

// ============================================================================
// 2. DISCIPLINE REALM CRUD ROUTES (study_quest_db.disciplines)
// ============================================================================

// GET all disciplines
const handleGetDisciplines = async (_req: express.Request, res: express.Response) => {
  try {
    const { disciplines } = await getCollections();
    const cursor = disciplines.find().sort({ name: 1 });
    const docs = await cursor.toArray();
    const data = docs.map((d) => ({
      id: d._id?.toString(),
      name: d.name,
      created_at: d.created_at
    }));
    res.json({ success: true, disciplines: data });
  } catch (err: any) {
    console.error('Error in get_disciplines:', err);
    res.status(500).json({ success: false, error: err.message || 'Database error' });
  }
};
app.get('/get_disciplines', handleGetDisciplines);
app.get('/api/get_disciplines', handleGetDisciplines);

// ADD new discipline
const handleAddDiscipline = async (req: express.Request, res: express.Response) => {
  try {
    const { disciplines } = await getCollections();
    const name = (req.body.name || '').trim();

    if (!name) {
      return res.status(400).json({ success: false, error: 'Discipline realm name cannot be empty.' });
    }

    const existing = await disciplines.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    if (existing) {
      return res.status(409).json({ success: false, error: `Realm "${existing.name}" already exists.` });
    }

    const doc: DisciplineDocument = {
      name,
      created_at: new Date()
    };
    const result = await disciplines.insertOne(doc);

    res.status(201).json({
      success: true,
      message: `Discipline realm "${name}" forged successfully in study_quest_db!`,
      discipline: {
        id: result.insertedId.toString(),
        name
      }
    });
  } catch (err: any) {
    console.error('Error in add_discipline:', err);
    res.status(500).json({ success: false, error: err.message || 'Database error' });
  }
};
app.post('/add_discipline', handleAddDiscipline);
app.post('/api/add_discipline', handleAddDiscipline);

// EDIT / RENAME discipline
const handleEditDiscipline = async (req: express.Request, res: express.Response) => {
  try {
    const { disciplines, studyTopics } = await getCollections();
    const id = req.body.id || req.body._id;
    const oldName = (req.body.old_name || '').trim();
    const newName = (req.body.name || '').trim();

    if (!newName) {
      return res.status(400).json({ success: false, error: 'New realm name cannot be empty.' });
    }

    let query: any = {};
    if (id) {
      try {
        query._id = new ObjectId(id);
      } catch {
        query._id = id;
      }
    } else if (oldName) {
      query.name = { $regex: new RegExp(`^${oldName}$`, 'i') };
    } else {
      return res.status(400).json({ success: false, error: 'Discipline ID or old name required.' });
    }

    const currentDoc = await disciplines.findOne(query);
    if (!currentDoc) {
      return res.status(404).json({ success: false, error: 'Discipline realm not found.' });
    }

    const previousName = currentDoc.name;

    // Check for naming conflicts
    const conflict = await disciplines.findOne({
      _id: { $ne: currentDoc._id },
      name: { $regex: new RegExp(`^${newName}$`, 'i') }
    });
    if (conflict) {
      return res.status(409).json({ success: false, error: `Realm "${newName}" already exists.` });
    }

    // Update in disciplines collection
    await disciplines.updateOne(
      { _id: currentDoc._id },
      { $set: { name: newName, updated_at: new Date() } }
    );

    // Cascade rename to study_topics
    await studyTopics.updateMany(
      { subject: { $regex: new RegExp(`^${previousName}$`, 'i') } },
      { $set: { subject: newName, updated_at: new Date() } }
    );

    res.json({
      success: true,
      message: `Discipline renamed to "${newName}". Topics synchronized in study_quest_db.`,
      discipline: {
        id: currentDoc._id.toString(),
        name: newName
      }
    });
  } catch (err: any) {
    console.error('Error in edit_discipline:', err);
    res.status(500).json({ success: false, error: err.message || 'Database error' });
  }
};
app.post('/edit_discipline', handleEditDiscipline);
app.post('/api/edit_discipline', handleEditDiscipline);

// DELETE / BANISH discipline
const handleDeleteDiscipline = async (req: express.Request, res: express.Response) => {
  try {
    const { disciplines } = await getCollections();
    const id = req.body.id || req.body._id || req.query.id;
    const name = (req.body.name || req.query.name || '').toString().trim();

    if (!id && !name) {
      return res.status(400).json({ success: false, error: 'Discipline ID or name required to banish.' });
    }

    let query: any = {};
    if (id) {
      try {
        query._id = new ObjectId(id);
      } catch {
        query._id = id;
      }
    } else if (name) {
      query.name = { $regex: new RegExp(`^${name}$`, 'i') };
    }

    const target = await disciplines.findOne(query);
    if (!target) {
      return res.status(404).json({ success: false, error: 'Discipline realm not found.' });
    }

    const targetName = target.name;
    const targetIdStr = target._id.toString();

    await disciplines.deleteOne({ _id: target._id });

    res.json({
      success: true,
      message: `Discipline realm "${targetName}" banished from study_quest_db.`,
      deleted_id: targetIdStr,
      deleted_name: targetName
    });
  } catch (err: any) {
    console.error('Error in delete_discipline:', err);
    res.status(500).json({ success: false, error: err.message || 'Database error' });
  }
};
app.post('/delete_discipline', handleDeleteDiscipline);
app.delete('/delete_discipline', handleDeleteDiscipline);
app.post('/api/delete_discipline', handleDeleteDiscipline);
app.delete('/api/delete_discipline', handleDeleteDiscipline);

// ============================================================================
// 3. STUDY TOPIC CRUD ROUTES (study_quest_db.study_topics)
// ============================================================================

// GET topics
const handleGetTopics = async (req: express.Request, res: express.Response) => {
  try {
    const { studyTopics } = await getCollections();
    const subject = (req.query.subject || '').toString().trim();

    let query: any = {};
    if (subject && subject !== 'All') {
      query.subject = { $regex: new RegExp(`^${subject}$`, 'i') };
    }

    const docs = await studyTopics.find(query).sort({ created_at: -1 }).toArray();
    const topics = docs.map((t) => ({
      id: t._id?.toString(),
      topic: t.topic,
      subject: t.subject,
      rating: t.rating,
      domain: t.domain || 'Knowledge',
      description: t.description || '',
      repetitions: t.repetitions || 1,
      retentionRate: t.retentionRate || 75,
      lastReviewed: t.lastReviewed || 'Just now',
      lastReviewedDays: t.lastReviewedDays || 0,
      created_at: t.created_at
    }));

    res.json({ success: true, count: topics.length, topics });
  } catch (err: any) {
    console.error('Error in get topics:', err);
    res.status(500).json({ success: false, error: err.message || 'Database error' });
  }
};
app.get('/api/topics', handleGetTopics);

// CHECK TOPIC
const handleCheckTopic = async (req: express.Request, res: express.Response) => {
  try {
    const { studyTopics } = await getCollections();
    const queryTopic = (req.body.topic || req.query.topic || '').toString().trim();
    const querySubject = (req.body.subject || req.query.subject || '').toString().trim();

    if (!queryTopic) {
      return res.json({ exists: false, message: 'Empty query' });
    }

    let query: any = {
      topic: { $regex: new RegExp(`^${queryTopic}$`, 'i') }
    };
    if (querySubject && querySubject !== 'All') {
      query.subject = { $regex: new RegExp(`^${querySubject}$`, 'i') };
    }

    const existing = await studyTopics.findOne(query);

    if (existing) {
      const tierNames: Record<number, string> = {
        1: 'Tier I: Novice',
        2: 'Tier II: Apprentice',
        3: 'Tier III: Adept',
        4: 'Tier IV: Expert',
        5: 'Tier V: Archmage'
      };
      const r = Math.max(1, Math.min(5, existing.rating || 3));
      res.json({
        exists: true,
        topic: existing.topic,
        subject: existing.subject,
        rating: r,
        tier_name: tierNames[r] || `Rank ${r}`,
        message: `Inscribed in [${existing.subject}] as ${tierNames[r]}!`
      });
    } else {
      res.json({
        exists: false,
        topic: queryTopic,
        subject: querySubject,
        message: `Uncharted node in [${querySubject || 'General'}]. Ready to forge!`
      });
    }
  } catch (err: any) {
    console.error('Error in check_topic:', err);
    res.status(500).json({ exists: false, error: err.message || 'Database error' });
  }
};
app.post('/check_topic', handleCheckTopic);
app.post('/api/check_topic', handleCheckTopic);

// ADD / FORGE TOPIC
const handleAddTopic = async (req: express.Request, res: express.Response) => {
  try {
    const { studyTopics } = await getCollections();
    const topic = (req.body.topic || '').trim();
    const subject = (req.body.subject || 'Software Engineering').trim();
    let rating = parseInt(req.body.rating || '3', 10);
    if (isNaN(rating) || rating < 1) rating = 1;
    if (rating > 5) rating = 5;

    if (!topic) {
      return res.status(400).json({ success: false, error: 'Topic name cannot be empty.' });
    }

    const result = await studyTopics.findOneAndUpdate(
      {
        topic: { $regex: new RegExp(`^${topic}$`, 'i') },
        subject: { $regex: new RegExp(`^${subject}$`, 'i') }
      },
      {
        $set: {
          topic,
          subject,
          rating,
          updated_at: new Date()
        },
        $setOnInsert: {
          repetitions: 1,
          retentionRate: 60 + rating * 8,
          domain: subject.includes('Engineering') ? 'Engineering' :
                  subject.includes('Business') ? 'Business Strategy' : 'Knowledge',
          description: `Transmuted node for ${topic} in ${subject} at Rank ${rating}.`,
          lastReviewed: 'Just now',
          lastReviewedDays: 0,
          created_at: new Date()
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(201).json({
      success: true,
      message: `Node "${topic}" forged under [${subject}] at Rank ${rating}!`,
      topic: result
    });
  } catch (err: any) {
    console.error('Error in add_topic:', err);
    res.status(500).json({ success: false, error: err.message || 'Database error' });
  }
};
app.post('/add_topic', handleAddTopic);
app.post('/api/add_topic', handleAddTopic);

// DELETE / BANISH TOPIC
const handleDeleteTopic = async (req: express.Request, res: express.Response) => {
  try {
    const { studyTopics } = await getCollections();
    const id = req.body.id || req.body._id || req.query.id;
    const topic = (req.body.topic || req.query.topic || '').toString().trim();
    const subject = (req.body.subject || req.query.subject || '').toString().trim();

    if (!id && !topic) {
      return res.status(400).json({ success: false, error: 'Topic ID or name required to banish.' });
    }

    let query: any = {};
    if (id) {
      try {
        query._id = new ObjectId(id);
      } catch {
        query._id = id;
      }
    } else if (topic) {
      query.topic = { $regex: new RegExp(`^${topic}$`, 'i') };
      if (subject && subject !== 'All') {
        query.subject = { $regex: new RegExp(`^${subject}$`, 'i') };
      }
    }

    const result = await studyTopics.deleteOne(query);

    if (result.deletedCount > 0) {
      res.json({
        success: true,
        message: `Node "${topic || id}" banished from study_quest_db.`,
        deleted_count: result.deletedCount
      });
    } else {
      res.status(404).json({ success: false, message: 'Node not found.' });
    }
  } catch (err: any) {
    console.error('Error in delete_topic:', err);
    res.status(500).json({ success: false, error: err.message || 'Database error' });
  }
};
app.post('/delete_topic', handleDeleteTopic);
app.delete('/delete_topic', handleDeleteTopic);
app.post('/api/delete_topic', handleDeleteTopic);
app.delete('/api/delete_topic', handleDeleteTopic);

// STATUS / HEALTH ENDPOINT
app.get('/api/status', async (_req, res) => {
  try {
    const { db, disciplines, studyTopics } = await getCollections();
    const pingResult = await db.command({ ping: 1 });
    const disciplinesCount = await disciplines.countDocuments();
    const topicsCount = await studyTopics.countDocuments();

    res.json({
      status: 'online',
      database: db.databaseName,
      connected: !!pingResult.ok,
      counts: {
        disciplines: disciplinesCount,
        study_topics: topicsCount
      },
      envConfigured: !!process.env.MONGODB_URI
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      connected: false,
      error: err.message
    });
  }
});

// ============================================================================
// 4. VITE MIDDLEWARE MOUNTING (Dev vs Prod)
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚔️ Nelli Study Server running on port ${PORT}`);
    console.log(`Database: MongoDB Atlas (study_quest_db)`);
  });
}

startServer();
