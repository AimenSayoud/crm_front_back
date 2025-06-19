const express = require('express');
const router = express.Router();
const skillsController = require('../../controllers/skills.controller');
const { authenticateToken, requireRole } = require('../../middleware/auth.middleware');

// ============== SKILL MANAGEMENT ==============

router.get('/', authenticateToken, requireRole(['admin', 'superadmin', 'consultant', 'employer']), skillsController.getSkillsWithSearch);
router.post('/', authenticateToken, requireRole(['admin', 'superadmin']), skillsController.createSkillWithCategory);
router.post('/category', authenticateToken, requireRole(['admin', 'superadmin']), skillsController.createSkillCategory);
router.post('/merge', authenticateToken, requireRole(['admin', 'superadmin']), skillsController.mergeDuplicateSkills);

// ============== TRENDING SKILLS ==============

router.get('/trending', authenticateToken, requireRole(['admin', 'superadmin', 'consultant', 'employer']), skillsController.getTrendingSkills);

// ============== MARKET DEMAND ANALYSIS ==============

router.get('/market-demand/:skill_id', authenticateToken, requireRole(['admin', 'superadmin', 'consultant', 'employer']), skillsController.getSkillMarketDemand);

// ============== SKILL GAP ANALYSIS ==============

router.get('/gap-analysis', authenticateToken, requireRole(['admin', 'superadmin', 'consultant', 'employer']), skillsController.getSkillGapAnalysis);

// ============== SKILL SUGGESTIONS ==============

router.get('/suggest/:candidate_id', authenticateToken, requireRole(['admin', 'superadmin', 'consultant']), skillsController.suggestSkillsForCandidate);

// ============== BULK OPERATIONS ==============

router.post('/bulk-import', authenticateToken, requireRole(['admin', 'superadmin']), skillsController.bulkImportSkills);

// ============== CATEGORY MANAGEMENT ==============

router.get('/categories', authenticateToken, requireRole(['admin', 'superadmin', 'consultant', 'employer']), skillsController.getSkillCategoriesWithSearch);

module.exports = router;
