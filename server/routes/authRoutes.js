const express = require("express")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();



router.post("/signup",async (req,res)=>{
    try{

        if(req.body === undefined){
            return res.status(400).json({
                message:"All fileds are empty"
            })
        }

        const {email,name,password} = req.body;

        
        if(!email || !name || !password){
             return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({email:normalizedEmail});
        if(existingUser){
            return res.status(409).json({
                message:"Email is already registered"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });
        res.status(201).json({
            message: "Account created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    }
    catch(error){
        res.status(500).json({
            message:"Internal server error"
        })
        console.log(error);
    }
    
})

router.post("/login",async (req,res)=>{
    try{
        const { email, password } = req.body;

        if(typeof email !== "string" || typeof password !== "string" || !email.trim() || !password){
            return res.status(401).json({
                message:"Email and password  are required!"
            })
        }

        const user = await User.findOne({
            email:email.trim().toLowerCase()
        }).select("+password");

        if(!user){
            return res.status(401).json({
                message:"User not found"
            })
        }

        const isPasswordCorrect = await bcrypt.compare(password,user.password);

        if(!isPasswordCorrect){
            return res.status(401).json({
                message:"Invalid email or password"
            });
        }

        const token = jwt.sign(
            {userId : user._id.toString()},
            process.env.JWT_SECRET,
            {expiresIn:"1hr"});

        return res.status(200).json({
            message:"Login Successful",
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email
            }
        });
    }
    catch(error){
         console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
})


router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Fetch user error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

module.exports = router;