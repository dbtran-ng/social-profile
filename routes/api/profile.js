const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route  GET api/profile/me
// @test   get profile based on user id
// @access Private
router.get('/me', auth, async (req,res) => {
    try{
        const profile = await Profile.findOne({user: req.user.id}).populate('user',['name','avatar']);
        if (!profile){
            return res.status(400).json({msg: 'No profile for this user'});
        }
        res.json(profile);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @route  POST api/profile
// @test   create or update user profile
// @access Private
router.post('/',  
    auth,
    check('status', 'Status is required').notEmpty(),
    check('skills', 'Skills is required').notEmpty(), 
    async (req, res) =>{
        const errors = validationResult(req);
     
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const {
            company,
            website,
            location,
            bio,
            status,
            github,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body;

        const profileFields= {};
        profileFields.user = req.user.id;
        if (company)    profileFields.company = company;
        if (website)    profileFields.website = website;
        if (location)    profileFields.company = location;
        if (bio)    profileFields.bio = bio;
        if (status)    profileFields.company = status;
        if (github)    profileFields.company = github;

        if(skills){
            profileFields.skills = skills.split(',').map(skill => skill.trim());
        }

        // Build social object
        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (linkedin) profileFields.social.youtube = linkedin;
        if (instagram) profileFields.social.youtube = instagram;
        
        try{
            let profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true, upsert: true, setDefaultsOnInsert: true }
              );        
            return res.json(profile);
        }catch(err){
            console.error(err.message);
            res.status(500).send('Server Error');
        }
        console.log(profileFields.social.twitter);
        res.send('hello');
    }
);


// @route  GET api/profile
// @test   get all profiles
// @access Public

router.get('/', async (req,res) => {
    try {
        const profiles = await Profile.find().populate('user',['name','avatar']);
        return res.json(profiles);
    }catch (err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

// @route  GET api/profile/user/:user_id
// @test   get profile by user id
// @access Public

router.get('/user/:user_id', async (req,res) => {
    try {
        const profile = await Profile.findOne({user: req.params.user_id}).populate('user',['name','avatar']);
        //if no profile found
        if (!profile){
            return res.status(400).json({msg: 'Profile not found'});
        }
        return res.json(profile);
    }catch (err){
        console.error(err.message);
        if(err.kind == 'ObjectId'){
            return res.status(400).json({msg: 'Profile not found'});
        }
        res.status(500).send('Server Error');
    }
});
// @route  DELETE api/profile
// @test   delete profile
// @access Public

router.delete('/', auth, async (req,res) => {
    try {
        await Profile.findOneAndRemove({user: req.user.id});
        await User.findOneAndRemove({_id: req.user.id});
        
        res.json({msg: 'User Profile Deleted'});
    }catch (err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route  PUT api/profile/experience
// @test   add profile experience
// @access Private

router.put(
    '/experience',[
        auth,
        [
            check('title', 'Title is required').not().isEmpty(),
            check('company', 'comany is required').not().isEmpty(),
            check('from', 'From date is required').not().isEmpty(),
        ]
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      try {
        const profile = await Profile.findOne({ user: req.user.id });
  
        profile.experience.unshift(req.body);
  
        await profile.save();
  
        return res.json(profile);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
    }
  );


router.put('/education',[auth, [
    check('school','School is required').not().isEmpty(),
    check('degree','Degree is required').not().isEmpty(),
    check('fieldofstudy','Field of study is required').not().isEmpty(),
    check('from','From date is required').not().isEmpty(),
]], async (req,res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const {school, degree, fieldofstudy, from, to, current, description} = req.body;
    const newEdu=  {school, degree, fieldofstudy, from, to, current, description};
    try{
        const profile = await Profile.findOne({user: req.user.id});
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

router.delete('/education/:edu_id', auth, async(req, res) => {
    try {
        const profile = await Profile.findOne({user: req.user.id});

        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);

        await profile.save();
        res.json(profile);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;