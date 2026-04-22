const { Sequelize } = require('sequelize');
const sequelize = require('../config/connection');

// ─── Import All Models ────────────────────────────────────────────
const User             = require('./User');
const Post             = require('./Post');
const Comment          = require('./Comment');
const Like             = require('./Like');
const SavedPost        = require('./SavedPost');
const Follower         = require('./Follower');
const FollowRequest    = require('./FollowRequest');
const MessageThread    = require('./MessageThread');
const ThreadParticipant = require('./ThreadParticipant');
const Message          = require('./Message');
const MessageRead      = require('./MessageRead');
const Notification     = require('./Notification');

// ─── Relationships ────────────────────────────────────────────────
// These tell Sequelize HOW tables are connected
// So when you query a Post you can also get the User who wrote it

// USER ↔ POSTS
// One user can have many posts
// Each post belongs to one user
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// USER ↔ COMMENTS
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// POST ↔ COMMENTS
// One post can have many comments
Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// COMMENT ↔ COMMENT (nested replies)
// A comment can have many replies (children)
// Each reply belongs to a parent comment
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });

// USER ↔ LIKES
User.hasMany(Like, { foreignKey: 'userId', as: 'likes' });
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// POST ↔ LIKES
// Frontend: post.likesCount = count of likes for this post
// Frontend: post.isLiked = does a Like row exist for currentUser + this post
Post.hasMany(Like, { foreignKey: 'postId', as: 'likes' });
Like.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// USER ↔ SAVED POSTS
User.hasMany(SavedPost, { foreignKey: 'userId', as: 'savedPosts' });
SavedPost.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// POST ↔ SAVED POSTS
Post.hasMany(SavedPost, { foreignKey: 'postId', as: 'saves' });
SavedPost.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// USER ↔ FOLLOWERS
// Frontend socialSlice: followingByUserId
// follower = the person who follows
// following = the person being followed
User.hasMany(Follower, { foreignKey: 'followerId', as: 'following' });
User.hasMany(Follower, { foreignKey: 'followingId', as: 'followers' });
Follower.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
Follower.belongsTo(User, { foreignKey: 'followingId', as: 'following' });

// USER ↔ FOLLOW REQUESTS
// Frontend socialSlice: requestsById
User.hasMany(FollowRequest, { foreignKey: 'fromUserId', as: 'sentRequests' });
User.hasMany(FollowRequest, { foreignKey: 'toUserId', as: 'receivedRequests' });
FollowRequest.belongsTo(User, { foreignKey: 'fromUserId', as: 'sender' });
FollowRequest.belongsTo(User, { foreignKey: 'toUserId', as: 'receiver' });

// USER ↔ MESSAGE THREADS (through ThreadParticipants)
// Frontend: thread.participantIds
User.hasMany(ThreadParticipant, { foreignKey: 'userId', as: 'threadParticipations' });
MessageThread.hasMany(ThreadParticipant, { foreignKey: 'threadId', as: 'participants' });
ThreadParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ThreadParticipant.belongsTo(MessageThread, { foreignKey: 'threadId', as: 'thread' });

// THREAD ↔ MESSAGES
// Frontend: thread.messageIds → messages in this thread
MessageThread.hasMany(Message, { foreignKey: 'threadId', as: 'messages' });
Message.belongsTo(MessageThread, { foreignKey: 'threadId', as: 'thread' });

// USER ↔ MESSAGES (sender)
// Frontend: message.senderId
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// THREAD ↔ MESSAGE READS
// Frontend: thread.lastReadMessageIdByUserId
MessageThread.hasMany(MessageRead, { foreignKey: 'threadId', as: 'readCursors' });
MessageRead.belongsTo(MessageThread, { foreignKey: 'threadId', as: 'thread' });
User.hasMany(MessageRead, { foreignKey: 'userId', as: 'readCursors' });
MessageRead.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// USER ↔ NOTIFICATIONS
// Frontend: NotificationsPage — recipient sees their notifications
User.hasMany(Notification, { foreignKey: 'recipientId', as: 'notifications' });
User.hasMany(Notification, { foreignKey: 'senderId', as: 'sentNotifications' });
Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });
Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Post.hasMany(Notification, { foreignKey: 'postId', as: 'notifications' });
Notification.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// ─── Export Everything ────────────────────────────────────────────
module.exports = {
  sequelize,
  Sequelize,
  User,
  Post,
  Comment,
  Like,
  SavedPost,
  Follower,
  FollowRequest,
  MessageThread,
  ThreadParticipant,
  Message,
  MessageRead,
  Notification,
};
