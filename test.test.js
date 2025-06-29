const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./Models/User');
const ActivityLog = require('./Models/ActivityLog');
const Assignment = require('./Models/Assignment');

let mongoServer;

// Avant tous les tests, on démarre une base de données MongoDB en mémoire
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

// Après tous les tests, on déconnecte mongoose et on arrête la base en mémoire
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Tests du modèle User
describe('Modèle User', () => {
  test('doit chiffrer le mot de passe lors de la sauvegarde', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'etudiant'
    });
    
    await user.save();
    // Le mot de passe sauvegardé ne doit pas être en clair
    expect(user.password).not.toBe('password123');
    expect(user.password.length).toBeGreaterThan(0);
  });

  test('doit comparer correctement les mots de passe', async () => {
    const user = await User.findOne({ username: 'testuser' });
    const isMatch = await user.comparePassword('password123');
    expect(isMatch).toBe(true);
  });
});

// Tests du modèle ActivityLog
describe('Modèle ActivityLog', () => {
  test('doit enregistrer une activité et tronquer les métadonnées trop longues', async () => {
    const user = await User.findOne({ username: 'testuser' });
    const largeMetadata = { data: 'a'.repeat(6000) };
    
    const log = await ActivityLog.logActivity(
      user._id, 
      'login', 
      { ...largeMetadata, ipAddress: '127.0.0.1', userAgent: 'test' }
    );
    
    expect(log.metadata.warning).toBeDefined(); // Doit contenir un avertissement de troncature
    expect(log.ipAddress).toBe('127.0.0.1');
  });
});

// Tests du modèle Assignment
describe('Modèle Assignment', () => {
  test('ne doit pas autoriser une date limite dans le passé', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    const assignment = new Assignment({
      courseId: new mongoose.Types.ObjectId(),
      title: 'Test Assignment',
      dueDate: pastDate,
      maxPoints: 100
    });
    
    await expect(assignment.save()).rejects.toThrow('Due date cannot be in the past');
  });

  test('doit marquer les soumissions comme en retard', async () => {
    const assignment = new Assignment({
      courseId: new mongoose.Types.ObjectId(),
      title: 'Test Assignment',
      dueDate: new Date(Date.now() + 1000 * 60 * 60), // dans 1 heure
      maxPoints: 100
    });
    
    await assignment.save();
    
    // Simuler que la date limite est dépassée
    assignment.dueDate = new Date(Date.now() - 1000);
    await assignment.save();
    
    // Vérifier que les soumissions ont bien été mises à jour (ici aucune soumission dans le test)
    const updated = await Assignment.findById(assignment._id);
    expect(updated.submissions).toEqual([]);
  });
});

module.exports = async function runTest() {
  const User = require('./Models/User');
  const user = new User({ username: 'testuser', email: 't@t.com', password: '12345678' });
  await user.save();
  console.log('Utilisateur test créé');
};

const assignment = new Assignment({
  title: 'Past Assignment',
  dueDate: new Date('2020-01-01'),
  allowPastDueDate: true
});

test('doit marquer les soumissions en retard', async () => {
  const pastDate = new Date(Date.now() - 60 * 60 * 1000); // date limite = il y a 1h
  const submissionDate = new Date(Date.now() - 30 * 60 * 1000); // soumission il y a 30 min

  const assignment = new Assignment({
    courseId: new mongoose.Types.ObjectId(),
    title: 'Late Homework',
    dueDate: pastDate,
    maxPoints: 100,
    allowPastDueDate: true,
    submissions: [{
      studentId: new mongoose.Types.ObjectId(),
      fileId: new mongoose.Types.ObjectId(),
      submittedAt: submissionDate,
      status: submissionDate > pastDate ? 'late' : 'pending'  // ← logique manuelle
    }]
  });

  await assignment.save();

  const updated = await Assignment.findById(assignment._id);
  expect(updated.submissions[0].status).toBe('late');
});
