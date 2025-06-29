const mongoose = require('mongoose');

// Schéma du forum lié à un cours
const forumSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }, // Référence au cours
  title: { type: String, required: true },         // Titre du forum
  description: String,                             // Description facultative

  // Tableau des posts dans le forum
  posts: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Auteur du post
    content: { type: String, required: true },                                     // Contenu du post
    createdAt: { type: Date, default: Date.now },                                  // Date de création du post

    // Réponses au post
    replies: [{
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Auteur de la réponse
      content: { type: String, required: true },                                     // Contenu de la réponse
      createdAt: { type: Date, default: Date.now }                                   // Date de création de la réponse
    }]
  }],

  createdAt: { type: Date, default: Date.now } // Date de création du forum
});

// Index pour optimiser les recherches par cours et ordre chronologique décroissant
forumSchema.index({ courseId: 1, createdAt: -1 });

// Méthode statique pour ajouter un post à un forum
forumSchema.statics.addPost = async function(forumId, authorId, content) {
  return this.findByIdAndUpdate(
    forumId,
    {
      $push: {
        posts: {
          author: authorId,
          content: content
        }
      }
    },
    { new: true } // Retourner le document modifié
  );
};

// Méthode statique pour ajouter une réponse à un post
forumSchema.statics.addReply = async function(forumId, postId, authorId, content) {
  return this.findOneAndUpdate(
    { _id: forumId, 'posts._id': postId },
    {
      $push: {
        'posts.$.replies': {
          author: authorId,
          content: content
        }
      }
    },
    { new: true }
  );
};

// Middleware avant sauvegarde pour nettoyer (trim) les contenus des posts et réponses
forumSchema.pre('save', function(next) {
  if (this.posts) {
    this.posts.forEach(post => {
      if (post.content) {
        post.content = post.content.trim();
      }
      if (post.replies) {
        post.replies.forEach(reply => {
          if (reply.content) {
            reply.content = reply.content.trim();
          }
        });
      }
    });
  }
  next();
});

// Méthode statique pour obtenir des statistiques sur les forums d’un cours
forumSchema.statics.getForumStats = async function(courseId) {
  return this.aggregate([
    { $match: { courseId: mongoose.Types.ObjectId(courseId) } },
    {
      $project: {
        title: 1,
        totalPosts: { $size: "$posts" }, // Nombre total de posts
        totalReplies: {                  // Nombre total de réponses à tous les posts
          $sum: {
            $map: {
              input: "$posts",
              as: "post",
              in: { $size: "$$post.replies" }
            }
          }
        },
        mostActiveAuthor: {              // Exemple simple d’auteur actif (compte le nombre de posts)
          $reduce: {
            input: "$posts",
            initialValue: { count: 0, author: null },
            in: {
              count: { $add: ["$$value.count", 1] },
              author: "$$this.author"
            }
          }
        }
      }
    }
  ]);
};

// Middleware pour limiter la taille maximale des contenus des posts et réponses
forumSchema.pre('save', function(next) {
  const MAX_POST_LENGTH = 10000;  // Max 10 000 caractères pour un post
  const MAX_REPLY_LENGTH = 5000;  // Max 5 000 caractères pour une réponse

  if (this.posts) {
    this.posts.forEach(post => {
      if (post.content && post.content.length > MAX_POST_LENGTH) {
        post.content = post.content.substring(0, MAX_POST_LENGTH) + '... [TRUNCATED]';
      }

      if (post.replies) {
        post.replies.forEach(reply => {
          if (reply.content && reply.content.length > MAX_REPLY_LENGTH) {
            reply.content = reply.content.substring(0, MAX_REPLY_LENGTH) + '... [TRUNCATED]';
          }
        });
      }
    });
  }
  next();
});

// Export du modèle Forum
module.exports = mongoose.model('Forum', forumSchema);
