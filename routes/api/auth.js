const express = require('express');
const router = express.Router();
const bcrypt = require("bcryptjs");
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User')
// @route  GET api/auth
// @test   Test route
// @access Public
router.get('/', auth, async (req,res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err)
    {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @route  POST api/users
// @test   authenticate user and get token
// @access Public
router.post(
    '/',
    [
      check('email', 'A valid email is required').isEmail(),
      check('password', 'Required password').exists(),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { email, password } = req.body;
      try {
        // See if user exists
        let user = await User.findOne({email});
        if (!user){
            return res.status(400).json({errors: [{msg: 'Invalid user'}]});
        }
  

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch){
            return res.status(400).json({errors: [{msg: 'Invalid user'}]});
        }

        const payload = {
            user: {
                id: user.id
            }
        }
      
        jwt.sign(
          payload,
          config.get('jwtSecret'),
          { expiresIn: '5 days' },
          (err, token) => {
            if (err) throw err;
            res.json({ token });
          }
        );
      } catch (err) {
          console.error(err.message);
          res.status(500).send('Users Server error');
      }
    }
  );
module.exports = router;