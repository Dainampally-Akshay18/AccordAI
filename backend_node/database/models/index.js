/**
 * Database Models Index
 * Exports all database models for the Legal AI Platform
 */

const User = require('./user');
const Document = require('./document');
const Analysis = require('./analysis');
const Audit = require('./audit');

// Model relationships (if using Sequelize in the future)
function setupAssociations() {
    // User has many Documents
    User.hasMany(Document, {
        foreignKey: 'user_id',
        as: 'documents',
        onDelete: 'CASCADE'
    });
    Document.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // User has many Analyses
    User.hasMany(Analysis, {
        foreignKey: 'user_id',
        as: 'analyses',
        onDelete: 'CASCADE'
    });
    Analysis.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    // Document has many Analyses
    Document.hasMany(Analysis, {
        foreignKey: 'document_id',
        as: 'analyses',
        onDelete: 'CASCADE'
    });
    Analysis.belongsTo(Document, {
        foreignKey: 'document_id',
        as: 'document'
    });

    // User has many Audit Logs
    User.hasMany(Audit, {
        foreignKey: 'user_id',
        as: 'audit_logs',
        onDelete: 'CASCADE'
    });
    Audit.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });
}

module.exports = {
    User,
    Document,
    Analysis,
    Audit,
    setupAssociations
};
