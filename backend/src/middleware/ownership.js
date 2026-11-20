const mongoose = require('mongoose');
const Project = require('../models/Project');

/**
 * Return the project only if it exists AND belongs to the authenticated user.
 * Every route that takes a project id must go through this; otherwise any logged-in
 * user could read or modify another user's data by guessing ids (IDOR).
 */
async function findOwnedProject(req, projectId) {
    if (typeof projectId !== 'string' || !mongoose.Types.ObjectId.isValid(projectId)) return null;
    return Project.findOne({ _id: projectId, owner: req.user.userId });
}

/** Express middleware: loads req.project from :projectId or responds 404. */
function requireOwnedProject(param = 'projectId') {
    return async (req, res, next) => {
        try {
            const project = await findOwnedProject(req, req.params[param]);
            if (!project) return res.status(404).json({ message: 'Project not found' });
            req.project = project;
            return next();
        } catch (err) {
            return next(err);
        }
    };
}

module.exports = { findOwnedProject, requireOwnedProject };
