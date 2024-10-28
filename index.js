const express = require('express');
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { log } = require('console');
const app = express();
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid'); // Import uuid (optional for unique string IDs)
const cors = require('cors');  // Import CORS
const nodemailer = require('nodemailer');
const sharp = require('sharp');

// Helper function to generate 12-digit random number

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

const transporter = nodemailer.createTransport({
  service: 'gmail', // Or use another email service provider
  auth: {
    user: 'karitonscraps.ph@gmail.com', // Your email
    pass: 'fegx cchl nsyk zwaq' // Your email password or app-specific password
  }
});

mongoose.connect('mongodb+srv://russ:Mpe38rRSRP36zWW@cluster0.oswowdu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/JunkShopDB', {
  useNewUrlParser: true
})  



const userSchema = {
  email: {
    required: true,
    type: String,
    trim: true,
    validate: {
      validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: "Enter valid Email",
    },
  },
  password: {
    required: true,
    type: String,
  },
  userID:String,
  fullname: String,
  phone: Number,
  dateOfReg: String,
  otp:String,
  token: String,
  customerType:String,
  dateOfBirth: String,
  barangay:String,
  points:String
};

const junkShopSchema = {
  email:String,
  password: {
    required: true,
    type: String,
  },

  jShopName: String,
  address:String,
  ownerName: String,
  isApproved: Boolean,
  dateOfReg: String,
  phone:String,
  isRejected: Boolean,
  jShopImg:String,
  description:String,
  otp:String,
  jShopLocation: String,
  validID:String,
  token:String,
  products:{},
  permit:String,
  customerType:String,
 
};

const barangaySchema = {
  email:String,
  password: {
    required: true,
    type: String,
  },

  bName: String,
  capName: String,
  phone:String,
  isApproved: Boolean,
  otp:String,
  dateOfReg: String,
  redeemDate:String,
  isRejected: Boolean,
  bImg:String,
  description:String,
  permit:String,
  validID:String,
  bLocation: String,
  token:String,
  products:{},
  customerType:String,
  approvedMessage:{},
  pendingMessage:{},
  declinedMessage:{},
  bSchedule: {},
  moneyRewards:{},
  goodsRewards:{},
  redeemIsActive:Boolean
};

const logSchema = {
  logs: String,
  time: String,
  date: String,
  type: String,
  name:String,
  id:String,
  scrapType:String,
  points:String,
  weight:String,
  userID:String
};

const adminCred = {
  uName: String,
  password: String,
  isLogged: Boolean
};

const bookingSchema = {
  setScheduledDate: String,
  time:String,
  uID: String,
  jID:String,
  jShop:String,
  location: String,
  phone:String,
  weight:String,
  scrapType:String,
  img: String,
  description: String,
  status: String,
  name:String,
  
};
const collectionScheduleSchema = {
  dayOfWeek:String,
  startTime:String,
  scrapType:String,
  barangayID:String
}
const redeemScheduleSchema = {
  date:String,
  startTime:String,
  description:String,
  barangayID:String,
  endTime:String

}

const rewardSchema = {
  nameOfGood:String,
  pointsEquivalent:String,
  barangayID:String
}

const scrapMaterialPoints ={
  scrapType:String,
  pointsEquivalent:String,
  barangayID:String,
  junkID:String
}

const collectedScrap = {
  userID:String,
  junkID:String,
  barangayID:String,
  scrapType:String,
  weight:String,

}
const adminScraps = {
  scrapType:String,
  pointsEquivalent:String,
}

const User = mongoose.model('User', userSchema);
const JunkShop = mongoose.model('JunkShop', junkShopSchema);
const Logs = mongoose.model('Logs', logSchema);
const Admin = mongoose.model('Admin', adminCred);
const Book = mongoose.model("Booking", bookingSchema);
const Barangay = mongoose.model('Barangay',barangaySchema);
const Collection = mongoose.model('Collection',collectionScheduleSchema);
const RedeemSched = mongoose.model('RedeemSced',redeemScheduleSchema);
const Reward = mongoose.model("Reward",rewardSchema);
const Scrap = mongoose.model("Scrap",scrapMaterialPoints);
const Collected = mongoose.model("Collected",collectedScrap);
const AdminScrap = mongoose.model("AdminScrap",adminScraps);




const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
      fileSize: 12 * 1024 * 1024 ,
      fieldSize:  12 * 1024 * 1024 // 10 MB limit
    }
});

const date = new Date();
const dateOptions = { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' };
const timeOptions = { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit' };
function generateUserID() {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit number as string
}

// Send OTP
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    // Find the email in User, Junkshop, and Barangay collections
    const user = await User.findOne({ email });
    const junkshop = await JunkShop.findOne({ email });
    const barangay = await Barangay.findOne({ email });

    const entity = user || junkshop || barangay;

    if (!entity) {
      return res.status(404).send({
        status_code: 404,
        message: "Email not found"
      });
    }

    const otp = generateOTP();

    // Save OTP in the corresponding entity (User, Junkshop, or Barangay)
    await entity.constructor.findOneAndUpdate({ email }, { otp });

    // Send the OTP to the user's email
    const mailOptions = {
      from: 'karitonscraps.ph@gmail.com',
      to: email,
      subject: 'Your Password Reset OTP',
      text: `Your OTP for password reset is ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).send({
          status_code: 500,
          message: "Failed to send OTP"
        });
      }
      res.status(200).send({
        status_code: 200,
        message: "OTP sent to email"
      });
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({
      status_code: 500,
      message: "Internal server error"
    });
  }
});

// Verify OTP
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find the email in User, Junkshop, and Barangay collections
    const user = await User.findOne({ email });
    const junkshop = await JunkShop.findOne({ email });
    const barangay = await Barangay.findOne({ email });

    const entity = user || junkshop || barangay;
    
    if (!entity || entity.otp !== otp) {
      return res.status(400).send({
        status_code: 400,
        message: "Invalid OTP"
      });
    }

    // OTP verified, clear OTP from the corresponding entity
    await entity.constructor.findOneAndUpdate({ email }, { otp: null });

    res.status(200).send({
      status_code: 200,
      message: "OTP verified successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({
      status_code: 500,
      message: "Internal server error"
    });
  }
});

// Reset Password (after OTP verification)
// Reset Password (after OTP verification)
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the email in User, Junkshop, and Barangay collections
    const user = await User.findOne({ email });
    const junkshop = await JunkShop.findOne({ email });
    const barangay = await Barangay.findOne({ email });

    const entity = user || junkshop || barangay;

    if (!entity) {
      return res.status(404).send({
        status_code: 404,
        message: "Email not found"
      });
    }

    // Hash the new password and update the corresponding entity
    const hashedPassword = await bcryptjs.hash(password, 8);
    await entity.constructor.findOneAndUpdate({ email }, { password: hashedPassword });

    // Create a new date instance to capture time and date for the log
    // Get current date and time in PHT
    const options = { timeZone: 'Asia/Manila', hour12: true, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    const currentDate = new Intl.DateTimeFormat('en-PH', options).format(new Date());
    const [date, time] = currentDate.split(', ');

    // Log the password reset action
    await Logs.create({
      logs: `Password reset for ${email}`,
      time: time,
      date: date,
      type: "Reset Password",
      name:"Resident",
      id: entity._id
    });

    res.status(200).send({
      status_code: 200,
      message: "Password reset successful"
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({
      status_code: 500,
      message: "Internal server error"
    });
  }
});

app.post('/api/checkUserExist', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Find the email in User, Junkshop, and Barangay collections
    const user = await User.findOne({ userID:userId });
  

    
    if (!user) {
      return res.status(400).send({
        status_code: 400,
        message: "Invalid UserID"
      });
    }


    res.status(200).send({
      status_code: 200,
      exist:true,
      message: "UserID verified successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({
      status_code: 500,
      message: "Internal server error"
    });
  }
});


// Start your server (adjust the port if necessary)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided

    // Find the user by email
    const user = await User.findOne({ email });
    const barangay = await Barangay.findOne({ email });
    const junkOwner = await JunkShop.findOne({ email });
    const junk = await JunkShop.find();
    const x = await Barangay.find();
    console.log(x);

    // Check if either user or junkOwner exists
    if (!user && !junkOwner && !barangay) {
      return res.status(401).send({
        "status_code": 401,
        "message": "Please check incorrect email or password."
      });
    }

    const createLog = async (logMessage, userType, userId) => {
      // Get current date and time in PHT
    const options = { timeZone: 'Asia/Manila', hour12: true, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    const currentDate = new Intl.DateTimeFormat('en-PH', options).format(new Date());
    const [date, time] = currentDate.split(', ');
      
      await Logs.create({
        logs: `${userType} with ID ${userId} logged in`,
        time: time,
        date: date,
        type: "Logins",
        name:userType 
      });
    };

    // Check if the user is logging in
    if (user) {
      const isMatch = await bcryptjs.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).send({
          "status_code": 401,
          "message": "Invalid email or password"
        });
      }

      // Generate token
      const token = jwt.sign({ id: user._id }, "passwordKey");

      // Update user's token
      await User.findOneAndUpdate({ email }, { token });

      // Log the login activity
      await createLog("User", "User", user._id);

      return res.status(200).send({
        "status_code": 200,
        "message": "User logged in",
        "user": user,
        "token": token,
        "userType": user.userType
      });
    }

    // Check if the junk shop owner is logging in
    if (junkOwner) {
      const isMatch = await bcryptjs.compare(password, junkOwner.password);
      if (!isMatch) {
        return res.status(401).send({
          "status_code": 401,
          "message": "Invalid email or password",
          'barangay': x
        });
      }

      const book = await Book.find({ jID: junkOwner._id });
      const token = jwt.sign({ id: junkOwner._id }, "passwordKey");

      // Update junk shop owner's token
      await JunkShop.findOneAndUpdate({ email }, { token });

      // Log the login activity
      await createLog("Junk Shop Owner", "Junk Shop Owner", junkOwner._id);

      return res.status(200).send({
        "status_code": 200,
        "message": "User logged in",
        "user": junkOwner,
        "token": token,
        "userType": junkOwner.customerType,
        "junk": junk,
        "book": book
      });
    }

    // Check if the barangay is logging in
    if (barangay) {
      const isMatch = await bcryptjs.compare(password, barangay.password);
      if (!isMatch) {
        return res.status(401).send({
          "status_code": 401,
          "message": "Invalid email or password",
          "barangay": x
        });
      }

      const token = jwt.sign({ id: barangay._id }, "passwordKey");

      // Update barangay's token
      await Barangay.findOneAndUpdate({ email }, { token });

      // Log the login activity
      await createLog("Barangay", "Barangay", barangay._id);

      return res.status(200).send({
        "status_code": 200,
        "message": "User logged in",
        "user": barangay,
        "token": token,
        "userType": barangay.userType,
        "junk": junk
      });
    }

  } catch (error) {
    console.error(error);
    res.status(500).send({
      "status_code": 500,
      "message": "Internal server error"
    });
  }
});

app.post('/api/registerCommunity', async (req, res) => {

  // Get current date and time in PHT
  const options = { timeZone: 'Asia/Manila', hour12: true, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
  const currentDate = new Intl.DateTimeFormat('en-PH', options).format(new Date());
  const [date, time] = currentDate.split(', ');

  try {
    const { name, phone, email, district, barangay, password, confirmPassword, userType, dateofbirth, address } = req.body;

    // Validate input
    if (!email || !password || !confirmPassword || !userType) {
      return res.status(400).json({ msg: "Required fields are missing." });
    }

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ msg: "User with same email exists." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match." });
    }

    const hashedPassword = await bcryptjs.hash(password, 8);
    const hashedConfirmPassword = await bcryptjs.hash(confirmPassword, 8);

    if (userType === 'Community') {
      const generatedUserID = generateUserID();

      const register = new User({
        email: email,
        userID: generatedUserID,
        fullname: name,
        password: hashedPassword,
        confirmPassword: hashedConfirmPassword,
        phone: phone,
        barangay: barangay,
        district: district,
        dateOfReg: `${date} at ${time}`,
        customerType: userType,
        dateOfBirth: dateofbirth,
        points: '0'
      });

      await register.save();

      // Log the registration activity
      await Logs.create({
        logs: `Community user with ID ${generatedUserID} registered`,
        time: time,
        date: date,
        type: "Registers",
        userType:userType,
        id:generatedUserID,
        name: name
      });

      return res.status(200).send({
        "status_code": 200,
        "message": "User registration successful",
        "userID": generatedUserID
      });
    } else {
      return res.status(400).json({ msg: "Invalid user type." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      "status_code": 500,
      "message": "Internal server error"
    });
  }
});

app.post('/api/register', upload.single('img'), async (req, res) => {
  // Get current date and time in PHT
  const options = {
    timeZone: 'Asia/Manila',
    hour12: true,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  };

  const currentDate = new Intl.DateTimeFormat('en-PH', options).format(new Date());
  const [date, time] = currentDate.split(', ');

  try {
    const img = req.file ? req.file.buffer : null;
    const {
      name,
      phone,
      email,
      district,
      barangay,
      barangayHall,
      ownerName,
      barangayPermit,
      junkshopImage,
      barangayHallImage,
      captainName,
      validIdImage,
      password,
      confirmPassword,
      userType,
      dateofbirth,
      address,
      barangayName,
      junkShopName,
    } = req.body;

    // Validate required fields
    if (!email || !password || !confirmPassword || !userType) {
      return res.status(400).json({ msg: "Required fields are missing." });
    }

    const existingUser = await User.findOne({ email });
    const existingJunk = await JunkShop.findOne({ email });
    const existingBarangay = await Barangay.findOne({ email });

    if (existingUser || existingJunk || existingBarangay) {
      return res.status(400).json({ msg: "User with same email already exists." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match." });
    }

    const hashedPassword = await bcryptjs.hash(password, 8);

    let register;

    if (userType === 'Community') {
      register = new User({
        email,
        fullname: name,
        password: hashedPassword,
        phone,
        barangay,
        district,
        dateOfReg: `${date} at ${time}`,
        customerType: userType,
        dateOfBirth: dateofbirth,
        points: '0',
      });
    } else if (userType === 'Junkshop') {
      register = new JunkShop({
        email,
        ownerName,
        password: hashedPassword,
        phone,
        validID: validIdImage,
        dateOfReg: `${date} at ${time}`,
        isApproved: null,
        address,
        jShopName: junkShopName,
        permit: barangayPermit,
        customerType: userType,
      });
    } else if (userType === 'Barangay') {
      register = new Barangay({
        email,
        capName:captainName,
        bName: barangayName,
        password: hashedPassword,
        validID: validIdImage,
        bLocation: address,
        phone,
        dateOfReg: `${date} at ${time}`,
        isApproved: null,
        district,
        permit: barangayPermit,
        bImg: barangayHall,
        customerType: userType,
        bSchedule: {},
        moneyRewards: {},
        goodsRewards: {},
      });
    } else {
      return res.status(400).json({ msg: "Invalid user type." });
    }

    // Handle image compression if present
    if (img) {
      console.log(`Image size before compression: ${img.length} bytes`);
      
      const compressedImageBuffer = await sharp(img)
        .resize({ width: 800 }) // Adjust size as needed
        .jpeg({ quality: 80 }) // Compress image to JPEG format
        .toBuffer();

      console.log(`Compressed image size: ${compressedImageBuffer.length} bytes`);

      if (compressedImageBuffer.length > 17825792) { // Check again after compression
        return res.status(400).json({ msg: "Image size exceeds limit after compression." });
      }

      // Store the compressed image as Base64 if necessary
      register.jShopImg = compressedImageBuffer.toString('base64'); 
    }

    await register.save();

    // Log the registration activity
    await Logs.create({
      logs: `${userType} with email ${email} registered`,
      time,
      date,
      type: "Registers",
      name: userType,
    });

    return res.status(200).send({
      status_code: 200,
      message: "User registration successful",
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).send({
      status_code: 500,
      message: "Internal server error",
    });
  }
});






app.post('/api/userData', async (req, res) => {
  const { token } = req.body;

  try {
    // Find the user by token
    const existingUser = await User.findOne({ token });
    
    // Find all junk shops
    const junk = await JunkShop.find();
    
   const existingBarangay = await Barangay.findOne({token});
    // Find the junk shop owner by token
    const existingJunk = await JunkShop.findOne({token});


   
    if (existingUser!=null) {
     
      const book = await Book.find({uID:existingUser._id})
     const barangay =  await Barangay.findOne({bName:existingUser.barangay})
     const cash = await Reward.findOne({nameOfGood:"Cash", barangayID: barangay._id});
     const reward = await Reward.find({ barangayID: barangay._id});
     const collection = await Collection.find({barangayID:barangay._id});
const date = await RedeemSched.findOne({barangayID:barangay._id});
const scrap =  await Scrap.find({barangayID:barangay._id})
const userLogs = await Logs.find({id:existingUser._id})
const history =  await Logs.find({userID:existingUser.userID})
const history1 =  await Logs.find({id:existingUser._id})

      
      return res.status(200).send({
        "status_code": 200,
        "message": "User data retrieved",
        "booking":book, 
        "history":{history,history1},  
        "userLogs":userLogs,
        "user": existingUser,
        "junk": junk,
        "token": token,
        "barangay":barangay,
        'junkOwner': existingJunk,
        "userType": existingUser.customerType,
       'cash':cash,
        "reward":reward,
        'collection':collection,
        'redeemDate':date,
        'scraps':scrap
      });
    } else if (existingJunk!=null) {
      const pending = await Book.find({
        jID: existingJunk._id,
        status: 'pending',
      });
      const declined = await Book.find({
        jID: existingJunk._id,
        status: 'declined',
      });
      const approved = await Book.find({
        jID: existingJunk._id,
        status: 'approved',
      });
      const done = await Book.find({
        jID: existingJunk._id,
        status: 'Done',
      });
      
      const scrap =  await Scrap.find({junkID:existingJunk._id});
      const adminscraps =  await AdminScrap.find()
      const userLogs = await Logs.find({id:existingJunk._id})
      
      return res.status(200).send({
        "status_code": 200,
        "message": "Junk shop owner data retrieved",
        "junkOwner": existingJunk,
        "junk": junk,
        "token": token,
        done:done,
        approved:approved,
        "userLogs":userLogs,
        "userType": existingJunk.customerType,
        'declined':declined,
        "adminscrap":adminscraps,
        'pending':pending,
        'image':existingJunk.jShopImg,
        'scrap':scrap
       
      });
    } 
    else if (existingBarangay!=null) {
     
      
      const scrap =  await Scrap.find({barangayID:existingBarangay._id})
      const reward = await Reward.find({barangayID:existingBarangay._id})
      const users = await User.find({barangay:existingBarangay.bName})
    
      const collected = await Collected.find();
      const cash = await Reward.findOne({
        nameOfGood: 'Cash', 
        barangayID: existingBarangay._id
      });
        const userLogs = await Logs.find({id:existingBarangay._id});
        const collectionLogs = await Logs.find({id:existingBarangay._id, type:"Collect"});  
      return res.status(200).send({
        "userLogs":userLogs,
        "status_code": 200,
        "message": "Junk shop owner data retrieved",
        "barangay": existingBarangay,
        "junk": junk,
        "collectionLogs":collectionLogs,
        "token": token,
        "scrap":scrap,
        'users':users,
        "userType": existingBarangay.customerType,
        "reward": reward,
        'cash':cash
      
       
      });
    } 
    else {
      return res.status(401).send({
        "status_code": 401,
        "message": "Invalid token"
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      "status_code": 500,
      "message": "Internal server error"
    });
  }
});



app.post('/api/booking', upload.single('img'), async (req, res) => {
  try {
    const {
      uID,
      selectedTime,
      setScheduledDate,
      location,
      weight,
      scrapType,
      note,
      jShopID
    } = req.body;

    if (!req.file) {
      return res.status(400).send({
        "status_code": 400,
        "message": "Image is required"
      });
    }

    const img = req.file.buffer;
    const name = await User.findOne({ _id: uID });
    const junkName = await JunkShop.findOne({ _id: jShopID });
    let resultObject = [];

    if (junkName && junkName.pendingMessage) {
      try {
        resultObject = JSON.parse(junkName.pendingMessage);
        if (!Array.isArray(resultObject)) {
          resultObject = [resultObject];
        }
      } catch (error) {
        console.error("Failed to parse JSON:", error);
        resultObject = []; // Initialize to empty array on error
      }
    } else {
      console.warn("junkName or junkName.pendingMessage is null or undefined");
    }

    const newObject = {
      date: setScheduledDate,
      name: name.fullname,
      content: note
    };

    resultObject.push(newObject);

    await JunkShop.findOneAndUpdate({ _id: jShopID }, { $set: { pendingMessage: resultObject } });

    const book = new Book({
      setScheduledDate: setScheduledDate,
      uID: uID,
      time: selectedTime,
      jID: jShopID,
      location: location,
      weight: weight,
      scrapType: scrapType,
      img: img,
      name: name.fullname,
      jShop: junkName.jShopName,
      description: note,
      status: 'pending',
      pendingMessage: {}
    });
    await book.save();

    const bookIDs = await Book.find({ uID: uID }); // Get all bookIDs for the user

    if (bookIDs.length > 0) {
      const latestBookID = bookIDs[bookIDs.length - 1]._id; // Get the latest bookID

      await User.updateOne(
        { _id: uID }, // Find the user by uID
        { $push: { bookingID: latestBookID } } // Update the user's bookingID with the latest bookID
      );
    }

    const user = await User.findOne({ _id: uID });
    const junk = await JunkShop.find();

    const imgBase64 = img.toString('base64');
 // Get current date and time in PHT
 const options = { timeZone: 'Asia/Manila', hour12: true, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
 const currentDate = new Intl.DateTimeFormat('en-PH', options).format(new Date());
 const [date, time] = currentDate.split(', ');
    // Log the schedule pick up activity
    await Logs.create({
      logs: `User with ID ${uID} scheduled a pick up with Junkshop ID ${jShopID}`,
      time: time,
      date: date,
      type: "Schedule Pick Up",
      name:"Junkshop",
      id:jShopID
    });

    res.status(200).send({
      "status_code": 200,
      "message": "Booking successful",
      "user": user,
      "junk": junk,
      "image": imgBase64,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      "status_code": 500,
      "message": "Internal server error"
    });
  }
});




app.post('/api/redeem', async (req, res) => {
  try {
    const { points, user_id, pendingMessages, barangay } = req.body;


    const theBarangay = await Barangay.findOne({ bName: barangay });
    const user = await User.findOne({ _id: user_id });
    const junk = await JunkShop.find();
    
    let userPoints = parseInt(user.points) || 0;  // Default to 0 if parsing fails
    let redeemPoints = parseInt(points) || 0;

    if (!theBarangay.redeemIsActive) {
      res.status(400).send({
        "status_code": 400,
        "message": "Redeem is not active in this barangay"
      });
    } else {
      if (userPoints < redeemPoints) {
        res.status(401).send({
          "status_code": 401,
          "message": "Not enough points to redeem"
        });
      } else {
        console.log(user_id);
        let result = userPoints - redeemPoints;
        await User.findOneAndUpdate({ _id: user_id }, { $set: { points: result } });
         // Get current date and time in PHT
    const options = { timeZone: 'Asia/Manila', hour12: true, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    const currentDate = new Intl.DateTimeFormat('en-PH', options).format(new Date());
    const [date1, time] = currentDate.split(', ');
        // Log the redemption activity
        await Logs.create({
          logs: `User with ID ${user_id} redeemed ${redeemPoints} points in Barangay ${barangay}`,
          time: time,
          date: date1,
          name: barangay,
          type: "Redemption",
          id:user_id
        });
        const existingUser = await User.findOne({_id:user_id});
        const book = await Book.find({uID:existingUser._id})
        const cash = await Reward.findOne({nameOfGood:"Cash", barangayID: barangay._id});
        const reward = await Reward.find({ barangayID: barangay._id});
        const collection = await Collection.find({barangayID:barangay._id});
   const date = await RedeemSched.findOne({barangayID:barangay._id});
   const scrap =  await Scrap.find({barangayID:barangay._id});
   const userLogs = await Logs.find({id:barangay._id});
         return res.status(200).send({
           "status_code": 200,
           "message": "User data retrieved",
           "booking":book,   
           "user": existingUser,
           "junk": junk,
           "userType": existingUser.customerType,
          'cash':cash,
           "reward":reward,
           'collection':collection,
           'redeemDate':date,
           'scraps':scrap
         });
      }
    }
  } catch (error) {
    console.log(error);

    res.status(500).send({
      "status_code": 500,
      "message": "Internal server error"
    });
  }
});



app.post('/api/updateClient', upload.single('img'), async (req, res) => {
  
 // Get current date and time in PHT

  try {
       // Get current date and time in PHT
       const options = { timeZone: 'Asia/Manila', hour12: true, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
       const currentDate = new Intl.DateTimeFormat('en-PH', options).format(new Date());
       const [date, time] = currentDate.split(', ');
  
    const img = req.file ? req.file.buffer : null; // Check if image file exists
    const { fullname, phone, email, district, ownerName, capName, userType, address, location, barangayName, junkShopName } = req.body;
    const imgBase64 = img ? img.toString('base64') : null;
    
    let updateData;

    if (userType === 'Community') {
      // Check if user exists
      const existingUser = await User.findOne({ email: email });
      if (!existingUser) {
        return res.status(400).json({ msg: "User does not exist." });
      }

      // Update user data
      updateData = {
        fullname: fullname,
        phone: phone,
      };

      await User.updateOne({ email: email }, updateData);
      await Logs.create({
        logs: `Profile updated for ${userType} with email: ${email}`,
        time: time,
        date: date,
        type: "Update profile details",
        name:userType,
        id: existingUser._id
  
      });

    } else if (userType === 'Junkshop') {
      // Check if junk shop exists
      const existingJunkShop = await JunkShop.findOne({ email: email });
      if (!existingJunkShop) {
        return res.status(400).json({ msg: "Junkshop does not exist." });
      }

      // Update junk shop data
      updateData = {
        phone: phone,
        address: address,
        jShopName: junkShopName,
        jShopImg: imgBase64,
        dateOfReg: `${date} at ${time}`,
        customerType: userType,
      };  await Logs.create({
        logs: `Profile updated for ${userType} with email: ${email}`,
        time: time,
        date: date,
        type: "Update profile details",
        name:userType,
        id: existingJunkShop._id
  
      });

      await JunkShop.updateOne({ email: email }, updateData);
      const existingJunk = await JunkShop.findOne({email:email});
      const pending = await Book.find({
        jID: existingJunk._id,
        status: 'pending',
      });
      const declined = await Book.find({
        jID: existingJunk._id,
        status: 'declined',
      });
      const scrap =  await Scrap.find({junkID:existingJunk._id});
      const userLogs = await Logs.find({id:existingJunk._id});
      return res.status(200).send({
        "status_code": 200,
        "userLogs":userLogs,
        "message": "Junk shop owner data retrieved",
        "junkOwner": existingJunk,
        "userType": existingJunk.customerType,
        'declined':declined,
        'pending':pending,
        'image':existingJunk.jShopImg,
        'scrap':scrap
       
      });
    } else if (userType === 'Barangay') {
      // Check if barangay exists
      const existingBarangay = await Barangay.findOne({ email: email });
      if (!existingBarangay) {
        return res.status(400).json({ msg: "Barangay does not exist." });
      }

      // Update barangay data
      updateData = {
        capName: capName,
        bName: barangayName,
        phone: phone,
        bLocation: location,
        district: district,
        bImg: imgBase64,
        dateOfReg: `${date} at ${time}`,
        customerType: userType,
      };

      await Barangay.updateOne({ email: email }, updateData);
      // Send a successful response
      const barangay = await Barangay.findOne({_id:existingBarangay._id})
      const scrap =  await Scrap.find({barangayID:existingBarangay._id})
      const reward = await Reward.find({barangayID:existingBarangay._id})
      const users = await User.find({barangay:existingBarangay.bName})
      const cash = await Reward.findOne({nameOfGood:'Cash',barangayID:existingBarangay._id})
      const junks = await JunkShop.find();
      const userLogs = await Logs.find({id:existingBarangay._id});
      await Logs.create({
        logs: `Profile updated for ${userType} with email: ${email}`,
        time: time,
        date: date,
        type: "Update profile details",
        name:userType,
        id: existingBarangay._id
  
      });
      
      return res.status(200).send({
        "status_code": 200,
        "message": "Schedule Saved",
        "barangay": barangay,
        "junk": junks,
        "token": barangay.token,
        "scrap":scrap,
        'users':users,
        "junks":junks,
        "userType": barangay.customerType,
        "reward": reward,
        'cash':cash,
      });

    } else {
      return res.status(400).json({ msg: "Invalid user type." });
    }

  
    // Log the profile update activity
  

    return res.status(200).send({
      "status_code": 200,
      "message": "User updated successfully",
      'image': imgBase64
    });

  } catch (err) {
    console.error(err);
    res.status(500).send({
      "status_code": 500,
      "message": "Internal server error"
    });
  }
});




app.post('/api/saveSched', async (req, res) => {
  try {
    const { Monday, Tuesday, Wednesday, Thursday, Friday, barangayID } = req.body;

    // Check if barangayID exists
    const sched = await Collection.find({ barangayID });

    // Define helper function to either update or create schedule
    const upsertSchedule = async (dayOfWeek, dayData) => {
      if (dayData) {
        await Collection.findOneAndUpdate(
          { dayOfWeek, barangayID },  // Find by dayOfWeek and barangayID
          {
            $set: {
              dayOfWeek,
              scrapType: dayData['scrapType'],
              startTime: dayData['collectionTime'],
              barangayID,
            }
          },
          { upsert: true, new: true }  // Create if not exists (upsert)
        );
      }
    };

    // Upsert each day's schedule
    await upsertSchedule('Monday', Monday);
    await upsertSchedule('Tuesday', Tuesday);
    await upsertSchedule('Wednesday', Wednesday);
    await upsertSchedule('Thursday', Thursday);
    await upsertSchedule('Friday', Friday);
    
     // Get current date and time in PHT
     const options = { timeZone: 'Asia/Manila', hour12: true, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
     const currentDate = new Intl.DateTimeFormat('en-PH', options).format(new Date());
     const [date, time] = currentDate.split(', ');
    // Log the schedule save activity
    await Logs.create({
      logs: `Schedule saved for Barangay ID: ${barangayID}`,
      time: time,
      date: date,
      type: "Barangay Schedule",
      name:"Barangay",
      id:barangayID
    }); 

    // Send a successful response
    const barangay = await Barangay.findOne({_id:barangayID})
    const scrap =  await Scrap.find({barangayID:barangayID})
    const reward = await Reward.find({barangayID:barangayID})
    const users = await User.find({barangay:barangay.bName})
    const cash = await Reward.findOne({nameOfGood:'Cash',barangayID:existingBarangay._id}) 
    const junks = await JunkShop.find();
    const collection = await Collection.find({barangayID:barangayID})
    const userLogs =  await Logs.find({id:barangayID});
    
    return res.status(200).send({
      "status_code": 200,
      userLogs:userLogs,
      "message": "Schedule Saved",
      "barangay": barangay,
      "junk": junks,
      "token": barangay.token,
      "scrap":scrap,
      'users':users,
      "junks":junks,
      "userType": barangay.customerType,
      "reward": reward,
      'cash':cash,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({
      status_code: 500,
      message: 'Internal server error',
    });
  }
});


app.post('/api/redeemDate', async (req, res) => {
  try {
    const { date, startTime, endTime, description, id } = req.body;

    // Find the barangay by ID
    const theBarangay = await Barangay.findById(id);
    if (!theBarangay) {
      return res.status(404).json({ message: "Barangay not found" });
    }

    // Find existing redeem schedule
    let redeemSched = await RedeemSched.findOne({ barangayID: id });

    // If redeem schedule does not exist, create a new one
    if (!redeemSched) {
      redeemSched = new RedeemSched({
        date: date,
        startTime: startTime,
        endTime: endTime,
        barangayID: id,
        description: description,
      });
      await redeemSched.save();
    } else {
      // Update the existing redeem schedule
      await RedeemSched.findOneAndUpdate(
        { barangayID: id },
        { $set: { date, startTime, endTime, description } }
      );
    }

    // Update barangay redeemDate field
    theBarangay.redeemDate = `Redeeming of goods is on ${date} at ${startTime}`;
    await theBarangay.save();
    const options = { timeZone: 'Asia/Manila', hour12: true, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    const currentDate = new Intl.DateTimeFormat('en-PH', options).format(new Date());
    const [date1, time] = currentDate.split(', ');
    // Log the redemption schedule update
    await Logs.create({
      logs: `Redemption schedule saved for Barangay ID: ${id}`,
      time: time,
      date: date1,
      type: "Redemption",
      name: theBarangay.bName,
      id: id,
    });

    // Fetch related data
    const [barangay, scrap, reward, users, cash, junks, userLogs] = await Promise.all([
      Barangay.findById(id),
      Scrap.find({ barangayID: id }),
      Reward.find({ barangayID: id }),
      User.find({ barangay: theBarangay.bName }),
      Reward.findOne({ nameOfGood: 'Cash' }),
      JunkShop.find({isApproved:true}),
      Logs.find({ id: theBarangay._id }),
    ]);

    // Send a successful response
    return res.status(200).send({
      "status_code": 200,
      "message": "Schedule saved",
      "barangay": barangay,
      "scrap": scrap,
      "reward": reward,
      "users": users,
      "cash": cash,
      "junks": junks,
      "userLogs": userLogs,
      "token": barangay.token,
      "userType": barangay.customerType,
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({
      "status_code": 500,
      "message": "Internal server error",
    });
  }
});



// Background task to update redeemIsActive
setInterval(async () => {
  try {
 // Get current date and time in PHT
 const options = { 
  timeZone: 'Asia/Manila', 
  hour12: true, 
  year: 'numeric', 
  month: '2-digit', 
  day: '2-digit', 
  hour: 'numeric', 
  minute: 'numeric'
};

const currentDate = new Intl.DateTimeFormat('en-PH', options).format(new Date());
const [datePart, currentTime] = currentDate.split(', '); // Split date and time

// Split the date part into month, day, and year
const [month, day, year] = datePart.split('/');

// Reformat date to YYYY-MM-DD
const formattedDate = `${year}-${month}-${day}`;




    // Normalize current time by converting to 12-hour format and removing leading zeros
    
    // Find all redemption schedules
    const allRedeemScheds = await RedeemSched.find();
    
    
    allRedeemScheds.forEach(async (sched) => {
      const requestDate = new Date(sched.date).toISOString().split('T')[0];
      const startime = sched.startTime.toUpperCase(); // Ensure startime is in uppercase
      const endtime = sched.endTime.toUpperCase(); // Ensure endtime is in uppercase


      // Check if the current date and time match the scheduled date and time
      if (requestDate === formattedDate && currentTime === startime) {
        const barangay = await Barangay.findOne({ _id: sched.barangayID });
        if (barangay) {
          barangay.redeemIsActive = true;
          await barangay.save();
          console.log(`Redemption active for Barangay ID: ${sched.barangayID}`);
        }
      } 
      
      // Check if the current time matches the end time
      if (requestDate === formattedDate && currentTime === endtime) {
        const barangay = await Barangay.findOne({ _id: sched.barangayID });
        if (barangay) {
          barangay.redeemIsActive = false;
          await barangay.save();
          console.log(`Redemption end for Barangay ID: ${sched.barangayID}`);
        }
      }
    });
  } catch (error) {
    console.error("Error in redemption schedule check:", error);
  }
}, 1000);




app.post('/api/rewardConversion', async (req, res) => {
  try {
    const { conversion_rate, name, id, action } = req.body;

    // Log the incoming action and name
    const options = { timeZone: 'Asia/Manila', hour12: true, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    const currentDate = new Intl.DateTimeFormat('en-PH', options).format(new Date());
    const [date1, time] = currentDate.split(', ');
    // Find an existing reward with the given name and barangayID
    const existingReward = await Reward.findOne({ nameOfGood: name, barangayID: id });

    // Handle Delete action
    if (action === "Delete") {
      if (existingReward) {
        await Reward.deleteOne({ nameOfGood: name, barangayID: id });
        console.log('Reward deleted successfully');

        // Log the deletion
        await Logs.create({
          logs: `Reward deleted: ${name} for Barangay ID: ${id}`,
          time: date1,
          date: time,
          type: "Rewards",
          id:id,
          name:"Barangay"
        });

        // Send the response after successful deletion
        return res.status(200).json({ message: 'Reward deleted successfully' });
      } else {
        return res.status(404).json({ message: 'Reward not found' });
      }
    }

    // If updating or creating a reward
    if (existingReward) {
      // Update the existing reward's pointsEquivalent
      existingReward.pointsEquivalent = conversion_rate;
      await existingReward.save();

      // Log the reward update
      await Logs.create({
        logs: `Reward updated: ${name} with new conversion rate: ${conversion_rate} for Barangay ID: ${id}`,
        time: time,
        date: date1,
        type: "Rewards",
        name: "Barangay",
        id:id
      });

      console.log('Reward updated successfully');
    } else {
      // Create a new reward if not found
      const newReward = new Reward({
        nameOfGood: name,
        pointsEquivalent: conversion_rate,
        barangayID: id
      });
      await newReward.save();

      // Log the reward creation
      await Logs.create({
        logs: `New reward created: ${name} with conversion rate: ${conversion_rate} for Barangay ID: ${id}`,
        time: time,
        date: date1,
        type: "Rewards",
        id:id,
        name:"Barangay"
      });

      console.log('New reward created successfully');
    }

    // Retrieve and prepare the necessary data for response
    const barangay = await Barangay.findOne({ _id: id });
    const scrap = await Scrap.find({ barangayID: id });
    const rewards = await Reward.find({ barangayID: id });
    const users = await User.find({ barangay: barangay.bName });
    const cash = await Reward.findOne({ nameOfGood: 'Cash' ,  barangayID: id });

    const junkShops = await JunkShop.find();
    const userLogs = await Logs.find({id:barangay._id})
    return res.status(200).send({
      userLogs:userLogs,
      status_code: 200,
      message: 'Reward processed successfully',
      barangay: barangay,
      scrap: scrap,
      users: users,
      cash: cash,
      junk: junkShops,
      userType: barangay.customerType,
      reward: rewards
    });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send({
      status_code: 500,
      message: 'Internal server error'
    });
  }
});



app.post('/api/scrapConversion', async (req, res) => {
  try {
    const { conversion_rate, name, id, type, action } = req.body;


    // Log the incoming action and name
    const options = { timeZone: 'Asia/Manila', hour12: true, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    const currentDate = new Intl.DateTimeFormat('en-PH', options).format(new Date());
    const [date1, time] = currentDate.split(', ');
    // Search for existing scrap by scrapType and id (barangay or junkshop)
    const existingBarangay = await Scrap.findOne({ scrapType: name, barangayID: id });
    const existingJunk = await Scrap.findOne({ scrapType: name, junkID: id });

    if (existingBarangay) {
      if (action === "Delete") {
        // Corrected the delete operation for Barangay
        await Scrap.deleteOne({ scrapType: name, barangayID: id });
        
        console.log('Barangay scrap deleted successfully');
      } else {
        // Update the existing scrap for the Barangay
        existingBarangay.pointsEquivalent = conversion_rate;
        await existingBarangay.save();

        // Log the scrap conversion for Barangay
        await Logs.create({
          logs: `Barangay scrap updated: ${name} with new conversion rate: ${conversion_rate} for Barangay ID: ${id}`,
          time: time,
          date: date1,
          type: "Conversion",
          name:"Barangay",
          id:id
          
        });

        console.log('Barangay scrap updated successfully');
      }

      // Fetch relevant data and send the response for Barangay
      const barangay = await Barangay.findOne({ _id: id });
      const scrap = await Scrap.find({ barangayID: id });
      const reward = await Reward.find({ barangayID: id });
      const users = await User.find({ barangay: barangay.bName });
      const cash = await Reward.findOne({ nameOfGood: 'Cash' });
      const junks = await JunkShop.find();
      const collect = await Collected.find()
      const userLogs =await Logs.find({id:id});
      return res.status(200).send({
        status_code: 200,
        message: action === "Delete" ? "Scrap deleted successfully" : "Scrap updated successfully",
        barangay: barangay,
        userLogs:userLogs,        junk: junks,
        token: barangay.token,
        scrap: scrap,
        users: users,
        junks: junks,
        userType: barangay.customerType,
        reward: reward,
        cash: cash,
      });

    } else if (existingJunk) {
      if (action === "Delete") {
        // Corrected the delete operation for Junkshop
        await Scrap.deleteOne({ scrapType: name, junkID: id });
        console.log('Junkshop scrap deleted successfully');
      } else {
        // Update the existing scrap for the Junkshop
        existingJunk.pointsEquivalent = conversion_rate;
        await existingJunk.save();

        // Log the scrap conversion for Junkshop
        await Logs.create({
          logs: `Junkshop scrap updated: ${name} with new conversion rate: ${conversion_rate} for Junkshop ID: ${id}`,
          time: time,
          date: date1,
          type: "Conversion",
          id:id,
          name:"Junkshop"
          
        });

        console.log('Junkshop scrap updated successfully');
      }
  
      const pending = await Book.find({
        jID: existingJunk._id,
        status: 'pending',
      });
      const declined = await Book.find({
        jID: existingJunk._id,
        status: 'declined',
      });
      const approved = await Book.find({
        jID: existingJunk._id,
        status: 'approved',
      });
      const done = await Book.find({
        jID: existingJunk._id,
        status: 'Done',
      });
      
      const scrap =  await Scrap.find({junkID:existingJunk._id});
      const adminscraps =  await AdminScrap.find()
      const userLogs = await Logs.find({id:existingJunk._id})
    
      
      return res.status(200).send({
        "status_code": 200,
        "message": "Junk shop owner data retrieved",
        "junkOwner": existingJunk,
                done:done,
        approved:approved,
        "userLogs":userLogs,
        "userType": existingJunk.customerType,
        'declined':declined,
        "adminscrap":adminscraps,
        'pending':pending,
        'image':existingJunk.jShopImg,
        'scrap':scrap
       
      });


    } else {
      // No existing scrap for either Barangay or Junkshop, create a new one
      let newScrap;
      const collect = await Collected.find()
      if (type === 'Junkshop') {
        newScrap = new Scrap({
          scrapType: name,
          pointsEquivalent: conversion_rate,
          junkID: id,
        });

        const collectedScrap = new Collected({
          junkID:id,
          scrapType:name,
        });
        await collectedScrap.save();
      } else {
        newScrap = new Scrap({
          scrapType: name,
          pointsEquivalent: conversion_rate,
          barangayID: id,
        });
        const collectedScrap = new Collected({
          barangayID:id,
          scrapType:name,
        });
        await collectedScrap.save();
      }

      await newScrap.save();
     
      // Log the creation of new scrap
      await Logs.create({
        logs: `New scrap created: ${name} with conversion rate: ${conversion_rate} for ID: ${id}`,
        time: time,
        date: date1,
        type: "Conversion",
        name: "Barangay",
          id:id
        
      });

      console.log('New scrap created successfully');
     
      
      return res.status(201).send({
        message: 'New scrap created successfully',
        scrap: newScrap,
      });
    }

  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).send({
      status_code: 500,
      message: 'Internal server error',
    });
  }
});




app.post('/api/getBarangay', async (req, res) => {  
  try {
    const { email, password } = req.body;
    // Check if email and password are provide  
    
  const x =  await Barangay.find({isApproved:true});

    
      return res.status(200).send({
        "status_code": 200,
        "message": "User logged in",
        "barangay":x
      });
  
    }

   catch (error) {
    console.error(error);
    res.status(500).send({
      "status_code": 500,
      "message": "Internal server error"
    });
  }
});app.post('/api/getScrap', async (req, res) => {  
  try {f
    const { email, password } = req.body;
    // Check if email and password are provide  
    
  const x =  await Scrap.find();

    
      return res.status(200).send({
        "status_code": 200,
        "message": "User logged in",
        "scrap":x
      });
  
    }

   catch (error) {
    console.error(error);
    res.status(500).send({
      "status_code": 500,
      "message": "Internal server error"
    });
  }
});

app.post('/api/collectScrap', async (req, res) => {
  try {
    const {
      conversion_rate,
      scrapType,
      weight,
      points,
      userId,
      barangayName,
      name,
      barangayID
    } = req.body;
    
    // Fetch the user and wait for the result
    const user = await User.findOne({ userID: userId });
    
    if (user) {
      // Convert user.points and points from String to int if necessary
      let userPoints = parseInt(user.points) || 0;  // Default to 0 if parsing fails
      let earnedPoints = parseInt(points) || 0;     // Convert the points to an integer

      // Add the points
      userPoints += earnedPoints;

      // Save the updated points back to the user
      user.points = userPoints;
      await user.save();


    const options = { timeZone: 'Asia/Manila', hour12: true, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    const currentDate = new Intl.DateTimeFormat('en-PH', options).format(new Date());
    const [date1, time] = currentDate.split(', ');
      // Fetch barangay data and related records
      const existingBarangay = await Barangay.findOne({ _id: barangayID });
      const scrap = await Scrap.find({ barangayID: barangayID });
      const users = await User.find({ barangay: existingBarangay.bName });
      const junks = await JunkShop.find();
      const collection = await Collected.findOne({ barangayID: barangayID, scrapType: scrapType });

      // Update or create a collection
      if (!collection) {
        const collect = new Collected({
          barangayID: barangayID,
          scrapType: scrapType,
          weight: weight,
          date: new Date().toLocaleDateString(),
          userId: userId,
          name: name,
        });
        await collect.save();
      } else {
        let currWeight = parseInt(collection.weight) || 0;  // Default to 0 if parsing fails
        let earnedWeight = parseInt(weight) || 0;     // Convert the points to an integer
        currWeight += earnedWeight;

        collection.weight = currWeight;
        
        // Increment the weight
        await collection.save();
      }

      // Create a new log entry
      const newLog = new Logs({
        userID: userId,
        id: barangayID,
        scrapType: scrapType,
        name:user.fullname,
        logs:`Successfully collected weight: ${weight}kg, scrap type: ${scrapType}. User:${user.fullname} gain ${points} ` ,
        weight: weight,
        points:points,
        time: time,
        date: date1,
        type:"Collect"// Capture the current timestamp

      });
      await newLog.save();
    
      
      // Fetch user logs
      const userLogs = await Logs.find({ id: existingBarangay._id });

      return res.status(200).send({
        userLogs: userLogs,
        status_code: 200,
        message: "Junk shop owner data retrieved",
        barangay: existingBarangay,
        member: user,
        junk: junks,
        scrap: scrap,
        users: users,
        userType: existingBarangay.customerType,
        points: points,
        scrapType: scrapType,
        weight: weight,
      });
    } else {
      // Handle case where user is not found
      return res.status(404).send({
        status_code: 404,
        message: "User not found",
      });
    }

  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).send({
      status_code: 500,
      message: 'Internal server error',
    });
  }
});


app.post('/api/pickUp', async (req, res) => {
  try {
    const {
      conversion_rate,
      name, id, phone, date, time, scrapType, weight, comments, location
    } = req.body;

    const adminscraps = await AdminScrap.find();

    const options = { timeZone: 'Asia/Manila', hour12: true, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    const currentDate = new Intl.DateTimeFormat('en-PH', options).format(new Date());
    const [date1, time1] = currentDate.split(', ');
    // Find an existing junk shop with the given id
    const existingJunk = await JunkShop.findOne({ _id: id }).lean();  // Use .lean() to get a plain object

    if (existingJunk) {
      // Create a new Book (booking) document
      const newScrap = new Book({
        setScheduledDate: date,
        time: time,
        jID: id,
        weight: weight,
        phone: phone,
        status: "pending",
        jShop: existingJunk.jShopName,
        location: location,
        scrapType: scrapType,
        description: comments,
        name: name,
      });

      await newScrap.save();

      // Create a new log entry
      const newLog = new Logs({
        logs: `Pickup scheduled for ${name}`,
        time: time1,
        date: date1,
        type: "Pick-up Schedule",
        name: existingJunk.jShopName,
        id: id,
        scrapType: scrapType,
        weight: weight,
      });

      await newLog.save();
    }

    // Fetch related data
    const pending = await Book.find({
      jID: existingJunk._id,
      status: 'pending'
    }).lean();
    const declined = await Book.find({
      jID: existingJunk._id,
      status: 'declined'
    }).lean();
    const scrap = await Scrap.find({ junkID: existingJunk._id }).lean();
    const userLogs = await Logs.find({id:existingJunk._id})
    // Send a response with only the necessary fields
    return res.status(200).send({
      userLogs:userLogs,
      status_code: 200,
      message: "Junk shop owner data retrieved",
      junkOwner: existingJunk,  // Only plain objects should be passed
      userType: existingJunk.customerType,
      declined: declined,
      pending: pending,
      image: existingJunk.jShopImg,
      scrap: scrap,
      adminscrap: adminscraps
    });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send({
      status_code: 500,
      message: 'Internal server error'
    });
  }
});


app.post('/api/junkShopList', async (req, res) => {
  try {
    const {
    id,bID
    } = req.body;
    const barangay = await Barangay.findOne({_id:bID})
    const scrap =  await Scrap.find({barangayID:bID})
    const reward = await Reward.find({barangayID:bID})
    const users = await User.find({barangay:barangay.bName})
    const cash = await Reward.findOne({nameOfGood:'Cash',barangayID:bID})
    const junkShop = await JunkShop.findOne({_id:id});
    const junks = await JunkShop.find();
    const jScrap = await Scrap.find({junkID:id});
    const userLogs = await Logs.find({id:id})
    return res.status(200).send({
      "userLogs":userLogs,
      "status_code": 200,
      "message": "Junk shop owner data retrieved",
      "barangay": barangay,
      "junk": junks,
      "token": barangay.token,
      "junkShop":junkShop,
      "scrap":scrap,
      'users':users,
      "userType": barangay.customerType,
      "reward": reward,
      'cash':cash,
      'junkScrap':jScrap
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send({
      status_code: 500,
      message: 'Internal server error'
    });
  }
});
app.post('/api/getHome', async (req, res) => {
  try {
    const {
    id , type} = req.body;
    if(type == "Community"){
      'hi'
      const existingUser = await User.findOne({_id:id})
      const book = await Book.find({uID: id})
      const barangay =  await Barangay.findOne({bName:existingUser.barangay})
      const cash = await Reward.findOne({nameOfGood:"Cash", barangayID: barangay._id});
      const reward = await Reward.find({ barangayID: barangay._id});
      const collection = await Collection.find({barangayID:barangay._id});
 const date = await RedeemSched.findOne({barangayID:barangay._id});
 const scrap =  await Scrap.find({barangayID:barangay._id})
 const userLogs = await Logs.find({id:id})
 const history =  await Logs.find({userID:existingUser.userID})
 const history1 =  await Logs.find({id:existingUser._id})
 console.log(existingUser.barangay);
 
 return res.status(200).send({
   "userLogs":userLogs,
         "status_code": 200,
         "history":{history,history1},  
         "message": "User data retrieved",
         "booking":book,   
         "user": existingUser,
         "barangay":barangay,
         "userType": existingUser.customerType,
        'cash':cash,
         "reward":reward,
         'collection':collection,
         'redeemDate':date,
         'scraps':scrap})
    }
    if(type == "Barangay"){
      const barangay = await Barangay.findOne({_id:id})
    const scrap =  await Scrap.find({barangayID:id})
    const reward = await Reward.find({barangayID:id})
    const users = await User.find({barangay:barangay.bName})
    const cash = await Reward.findOne({nameOfGood:'Cash',barangayID:barangay._id})
    const junkShop = await JunkShop.findOne({_id:id});
    const junks = await JunkShop.find();
    const userLogs = await Logs.find({id:barangay._id})
    return res.status(200).send({
      "userLogs":userLogs,
      "status_code": 200,
      "message": "Junk shop owner data retrieved",
      "barangay": barangay,
      "junk": junks,
      "token": barangay.token,
      "junkShop":junkShop,
      "scrap":scrap,
      'users':users,
      "userType": barangay.customerType,
      "reward": reward,
      'cash':cash,
    });

    }
    else{
      const existingJunk = await JunkShop.findOne({_id:id});
    const pending = await Book.find({
        jID: existingJunk._id,
        status: 'pending',
      });
      const declined = await Book.find({
        jID: existingJunk._id,
        status: 'declined',
      });
      const approved = await Book.find({
        jID: existingJunk._id,
        status: 'approved',
      });
      const done = await Book.find({
        jID: existingJunk._id,
        status: 'Done',
      });
      
      const scrap =  await Scrap.find({junkID:existingJunk._id});
      const adminscraps =  await AdminScrap.find()
      const userLogs = await Logs.find({id:existingJunk._id})
      
      return res.status(200).send({
        "status_code": 200,
        "message": "Junk shop owner data retrieved",
        "junkOwner": existingJunk,
        done:done,
        approved:approved,
        "userLogs":userLogs,
        "userType": existingJunk.customerType,
        'declined':declined,
        "adminscrap":adminscraps,
        'pending':pending,
        'image':existingJunk.jShopImg,
        'scrap':scrap
       
      });
    }
    
    
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send({
      status_code: 500,
      message: 'Internal server error'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
