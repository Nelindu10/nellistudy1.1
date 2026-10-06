import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB Atlas Connection String from environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dahamithawickramasinghe_db_user:daha2004@cluster0.uiwpse0.mongodb.net/study_quest_db?appName=Cluster0';
const DB_NAME = process.env.MONGODB_DB_NAME || 'study_quest_db';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

export interface DisciplineDocument {
  _id?: ObjectId;
  name: string;
  created_at: Date;
  updated_at?: Date;
}

export interface StudyTopicDocument {
  _id?: ObjectId;
  topic: string;
  subject: string;
  rating: number; // 1 to 5
  domain?: string;
  description?: string;
  repetitions: number;
  retentionRate: number;
  lastReviewed?: string;
  lastReviewedDays?: number;
  created_at: Date;
  updated_at?: Date;
}

const INITIAL_DISCIPLINES = [
  'Software Engineering',
  'Business Analysis',
  'Data Science & AI',
  'Cybersecurity',
  'Mathematics & Cryptography',
  'Neuroscience & Biology'
];

/**
 * Connects to MongoDB Atlas cluster and initializes collections and indexes.
 */
export async function connectToDatabase(): Promise<{
  db: Db;
  disciplines: Collection<DisciplineDocument>;
  studyTopics: Collection<StudyTopicDocument>;
}> {
  if (dbInstance && client) {
    return {
      db: dbInstance,
      disciplines: dbInstance.collection<DisciplineDocument>('disciplines'),
      studyTopics: dbInstance.collection<StudyTopicDocument>('study_topics')
    };
  }

  try {
    console.log(`Connecting to MongoDB Atlas (database: ${DB_NAME})...`);
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });

    await client.connect();
    // Verify connection with ping
    await client.db('admin').command({ ping: 1 });
    console.log(`Successfully connected to MongoDB Atlas [${DB_NAME}]!`);

    dbInstance = client.db(DB_NAME);
    const disciplinesCollection = dbInstance.collection<DisciplineDocument>('disciplines');
    const studyTopicsCollection = dbInstance.collection<StudyTopicDocument>('study_topics');

    // Create unique index on discipline name
    try {
      await disciplinesCollection.createIndex({ name: 1 }, { unique: true });
      await studyTopicsCollection.createIndex({ subject: 1, topic: 1 });
    } catch {
      // Index may already exist
    }

    // Seed default disciplines if empty
    try {
      const count = await disciplinesCollection.countDocuments();
      if (count === 0) {
        console.log('Seeding initial discipline realms into study_quest_db...');
        const initialDocs = INITIAL_DISCIPLINES.map((name) => ({
          name,
          created_at: new Date()
        }));
        await disciplinesCollection.insertMany(initialDocs);
        console.log(`Seeded ${initialDocs.length} disciplines into study_quest_db.`);
      }
    } catch (err) {
      console.warn('Discipline seeding notice:', err);
    }

    return {
      db: dbInstance,
      disciplines: disciplinesCollection,
      studyTopics: studyTopicsCollection
    };
  } catch (err) {
    console.error(`MongoDB Atlas connection error (${DB_NAME}):`, err);
    throw err;
  }
}

export async function getDatabase(): Promise<Db> {
  if (!dbInstance) {
    const { db } = await connectToDatabase();
    return db;
  }
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    dbInstance = null;
    console.log('MongoDB Atlas connection closed.');
  }
}
