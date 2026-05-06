const express = require('express');
const ctrl = require('../controllers/tableController');

const router = express.Router();

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);

module.exports = router;
