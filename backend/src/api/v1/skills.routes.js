const express = require('express');
const router = express.Router();
const skillsController = require('../../controllers/skills.controller');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth.middleware');

// ============== SKILL MANAGEMENT ==============

router.get('/', authMiddleware, roleMiddleware('admin', 'superadmin', 'consultant', 'employer'), skillsController.getSkillsWithSearch);
router.post('/', authMiddleware, roleMiddleware('admin', 'superadmin'), skillsController.createSkillWithCategory);
router.post('/category', authMiddleware, roleMiddleware('admin', 'superadmin'), skillsController.createSkillCategory);
router.post('/merge', authMiddleware, roleMiddleware('admin', 'superadmin'), skillsController.mergeDuplicateSkills);

// ============== TRENDING SKILLS ==============

router.get('/trending', authMiddleware, roleMiddleware('admin', 'superadmin', 'consultant', 'employer'), skillsController.getTrendingSkills);

// ============== MARKET DEMAND ANALYSIS ==============

router.get('/market-demand/:skill_id', authMiddleware, roleMiddleware('admin', 'superadmin', 'consultant', 'employer'), skillsController.getSkillMarketDemand);

// ============== SKILL GAP ANALYSIS ==============

router.get('/gap-analysis', authMiddleware, roleMiddleware('admin', 'superadmin', 'consultant', 'employer'), skillsController.getSkillGapAnalysis);

// ============== SKILL SUGGESTIONS ==============

router.get('/suggest/:candidate_id', authMiddleware, roleMiddleware('admin', 'superadmin', 'consultant'), skillsController.suggestSkillsForCandidate);

// ============== BULK OPERATIONS ==============

router.post('/bulk-import', authMiddleware, roleMiddleware('admin', 'superadmin'), skillsController.bulkImportSkills);

// ============== CATEGORY MANAGEMENT ==============

router.get('/categories', authMiddleware, roleMiddleware('admin', 'superadmin', 'consultant', 'employer'), skillsController.getSkillCategoriesWithSearch);

module.exports = router;
