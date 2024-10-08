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

// Helper function to generate 12-digit random number

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

mongoose.connect('mongodb+srv://ads:YGWygUxHRZAxd1NT@cluster0.zchxmu8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/JunkShopDB', {
  useNewUrlParser: true
});

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
  confirmPassword: {
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
  confirmPassword: {
    required: true,
    type: String,
  },
  bName: String,
  capName: String,
  phone:String,
  isApproved: Boolean,
  dateOfReg: String,
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
const upload = multer({ storage: storage });
const date = new Date();
const dateOptions = { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' };
const timeOptions = { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit' };
function generateUserID() {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}


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
        "message": "Invalid email or password"
      });
    }

    const createLog = async (logMessage, userType, userId) => {
      const date = new Date();
      const time = date.toLocaleTimeString();
      const logDate = date.toLocaleDateString();
      
      await Logs.create({
        logs: `${userType} with ID ${userId} logged in`,
        time: time,
        date: logDate,
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

  const date = new Date();
  const dateOptions = { year: 'numeric', month: 'numeric', day: 'numeric' };
  const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
  const dateOfReg = date.toLocaleDateString('en-PH', dateOptions);
  const timeOfReg = date.toLocaleTimeString('en-PH', timeOptions);

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
        dateOfReg: `${dateOfReg} at ${timeOfReg}`,
        customerType: userType,
        dateOfBirth: dateofbirth,
        points: '0'
      });

      await register.save();

      // Log the registration activity
      await Logs.create({
        logs: `Community user with ID ${generatedUserID} registered`,
        time: timeOfReg,
        date: dateOfReg,
        type: "Registers",
        userType:userType
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
  const date = new Date();
  const dateOptions = { year: 'numeric', month: 'numeric', day: 'numeric' };
  const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
  const dateOfReg = date.toLocaleDateString('en-PH', dateOptions);
  const timeOfReg = date.toLocaleTimeString('en-PH', timeOptions);

  try {
    const img = req.file ? req.file.buffer : null;
    const { name, phone, email, district, barangay,barangayHall, ownerName,barangayPermit,junkshopImage, capName,validIdImage, password, confirmPassword, userType, dateofbirth, address, barangayName, junkShopName } = req.body;
    const imgBase64 = img ? img.toString('base64') : null;
    console.log(barangayPermit);
    

    if (!email || !password || !confirmPassword || !userType) {
      return res.status(400).json({ msg: "Required fields are missing." });
    }

    const existingUser = await User.findOne({ email: email });
    const existingJunk = await JunkShop.findOne({ email: email });
    const existingBarangay = await Barangay.findOne({ email: email });

    if (existingUser || existingJunk || existingBarangay) {
      return res.status(400).json({ msg: "User with same email already exists." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match." });
    }

    const hashedPassword = await bcryptjs.hash(password, 8);
    const confirmPasswordHashed = await bcryptjs.hash(confirmPassword, 8);
    let register;

    if (userType === 'Community') {
      register = new User({
        email: email,
        fullname: name,
        password: hashedPassword,
        confirmPassword: confirmPasswordHashed,
        phone: phone,
        barangay: barangay,
        district: district,
        dateOfReg: `${dateOfReg} at ${timeOfReg}`,
        customerType: userType,
        dateOfBirth: dateofbirth,
        points: '0'
      });
    } else if (userType === 'Junkshop') {
      register = new JunkShop({
        email: email,
        ownerName: ownerName,
        password: hashedPassword,
        confirmPassword: confirmPasswordHashed,
        phone: phone,
        validID:validIdImage,
        dateOfReg: `${dateOfReg} at ${timeOfReg}`,
        isApproved: null,
        address: address,
        jShopName: junkShopName,
        permit:barangayPermit,
        jShopImg: junkshopImage,
        customerType: userType
      });
    } else if (userType === 'Barangay') {
      register = new Barangay({
        email: email,
        capName: capName,
        bName: barangayName,
        password: hashedPassword,
        confirmPassword: confirmPasswordHashed,
        validID:validIdImage,
        bLocation:address,
        phone: phone,
        dateOfReg: `${dateOfReg} at ${timeOfReg}`,
        isApproved: null,
        district: district,
        permit:barangayPermit,
        bImg: barangayHall,
        customerType: userType,
        bSchedule: {},
        moneyRewards: {},
        goodsRewards: {}
      });
   
      
    } else {
      return res.status(400).json({ msg: "Invalid user type." });
    }

    await register.save();

    // Log the registration activity
    await Logs.create({
      logs: `${userType} with email ${email} registered`,
      time: timeOfReg,
      date: dateOfReg,
      type: "Registers",
      name:userType
    });

    return res.status(200).send({
      "status_code": 200,
      "message": "User registration successful",
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





app.post('/api/userData', async (req, res) => {
  const { token } = req.body;

  try {
    // Find the user by token
    const existingUser = await User.findOne({ token });
    console.log(token);
    
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

      console.log(history);
      
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
      console.log(userLogs);
      
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
        console.log(userLogs);
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
    console.log(resultObject);

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

    // Log the schedule pick up activity
    await Logs.create({
      logs: `User with ID ${uID} scheduled a pick up with Junkshop ID ${jShopID}`,
      time: new Date().toLocaleTimeString('en-PH'),
      date: new Date().toLocaleDateString('en-PH'),
      type: "Schedule Pick Up",
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

    console.log(barangay);

    const theBarangay = await Barangay.findOne({ bName: barangay });
    const user = await User.findOne({ _id: user_id });
    const junk = await JunkShop.find();
    console.log(theBarangay.redeemIsActive);
    
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

        // Log the redemption activity
        await Logs.create({
          logs: `User with ID ${user_id} redeemed ${redeemPoints} points in Barangay ${barangay}`,
          time: new Date().toLocaleTimeString('en-PH'),
          date: new Date().toLocaleDateString('en-PH'),
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
  
  const dateOfReg = new Date().toLocaleDateString('en-PH', dateOptions);
  const timeOfReg = new Date().toLocaleTimeString('en-PH', timeOptions);
  
  try {
    const img = req.file ? req.file.buffer : null; // Check if image file exists
    const { fullname, phone, email, district, ownerName, capName, userType, address, location, barangayName, junkShopName } = req.body;
    const imgBase64 = img ? img.toString('base64') : null;
    console.log(location);
    
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
        dateOfReg: `${dateOfReg} at ${timeOfReg}`,
        customerType: userType,
      };

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
  
      return res.status(200).send({
        "status_code": 200,
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
        dateOfReg: `${dateOfReg} at ${timeOfReg}`,
        customerType: userType,
      };

      await Barangay.updateOne({ email: email }, updateData);
      // Send a successful response
      const barangay = await Barangay.findOne({_id:existingBarangay._id})
      const scrap =  await Scrap.find({barangayID:existingBarangay._id})
      const reward = await Reward.find({barangayID:existingBarangay._id})
      const users = await User.find({barangay:existingBarangay.bName})
      const cash = await Reward.findOne({nameOfGood:'Cash'})
      const junks = await JunkShop.find();
      console.log(cash);
      
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
    await Logs.create({
      logs: `Profile updated for ${userType} with email: ${email}`,
      time: new Date().toLocaleTimeString('en-PH'),
      date: new Date().toLocaleDateString('en-PH'),
      type: "Update profile details",

    });

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
    console.log(sched);

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

    // Log the schedule save activity
    await Logs.create({
      logs: `Schedule saved for Barangay ID: ${barangayID}`,
      time: new Date().toLocaleTimeString('en-PH'),
      date: new Date().toLocaleDateString('en-PH'),
      type: "Barangay Schedule",
      id:barangayID
    }); 

    // Send a successful response
    const barangay = await Barangay.findOne({_id:barangayID})
    const scrap =  await Scrap.find({barangayID:barangayID})
    const reward = await Reward.find({barangayID:barangayID})
    const users = await User.find({barangay:barangay.bName})
    const cash = await Reward.findOne({nameOfGood:'Cash'})
    const junks = await JunkShop.find();
    const collection = await Collection.find({barangayID:barangayID})
    console.log(cash);
    
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
    console.log(id);

    // Find the barangay by ID
    const theBarangay = await Barangay.findOne({ _id: id });
    const redeemSched = await RedeemSched.findOne({ barangayID: id });

    if (!theBarangay) {
      console.log('hi');
      return res.status(404).json({ message: "Barangay not found" });
    }

    if (!redeemSched) {
      const sched = new RedeemSched({
        date: date,
        startTime: startTime,
        endTime: endTime,
        barangayID: id,
        description: description
      });
      await sched.save();
    } else {
      await RedeemSched.findOneAndUpdate(
        { barangayID: id },
        { $set: { date: date, startTime: startTime, endTime: endTime, description: description } }
      );
    }

    // Log the redemption schedule update
    await Logs.create({
      logs: `Redemption schedule saved for Barangay ID: ${id}`,
      time: new Date().toLocaleTimeString('en-PH'),
      date: new Date().toLocaleDateString('en-PH'),
      type: "Redemption",
      id:id
    });
    console.log(redeemSched);
    
        // Send a successful response
        const barangay = await Barangay.findOne({_id:id})
        const scrap =  await Scrap.find({barangayID:id})
        const reward = await Reward.find({barangayID:id})
        const users = await User.find({barangay:barangay.bName})
        const cash = await Reward.findOne({nameOfGood:'Cash'})
        const junks = await JunkShop.find();
     
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
    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      "status_code": 500,
      "message": "Internal server error"
    });
  }
});


// Background task to update redeemIsActive
setInterval(async () => {
  try {
    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split('T')[0];

    // Normalize current time by converting to 12-hour format and removing leading zeros
    let currentTime = currentDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
    
    // Find all redemption schedules
    const allRedeemScheds = await RedeemSched.find();

    allRedeemScheds.forEach(async (sched) => {
      const requestDate = new Date(sched.date).toISOString().split('T')[0];
      const startime = sched.startTime.toUpperCase(); // Ensure startime is in uppercase
      const endtime = sched.endTime.toUpperCase(); // Ensure endtime is in uppercase

     

      // Check if the current date and time match the scheduled date and time
      if (requestDate === currentDateString && currentTime === startime) {
        const barangay = await Barangay.findOne({ _id: sched.barangayID });
        if (barangay) {
          barangay.redeemIsActive = true;
          await barangay.save();
          console.log(`Redemption active for Barangay ID: ${sched.barangayID}`);
        }
      } 
      
      // Check if the current time matches the end time
      if (requestDate === currentDateString && currentTime === endtime) {
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
    console.log('Action:', action);
    console.log('Name:', name);

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
          time: new Date().toLocaleTimeString('en-PH'),
          date: new Date().toLocaleDateString('en-PH'),
          type: "Rewards",
          id:id
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
        time: new Date().toLocaleTimeString('en-PH'),
        date: new Date().toLocaleDateString('en-PH'),
        type: "Rewards",
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
        time: new Date().toLocaleTimeString('en-PH'),
        date: new Date().toLocaleDateString('en-PH'),
        type: "Rewards",
        id:id
      });

      console.log('New reward created successfully');
    }

    // Retrieve and prepare the necessary data for response
    const barangay = await Barangay.findOne({ _id: id });
    const scrap = await Scrap.find({ barangayID: id });
    const rewards = await Reward.find({ barangayID: id });
    const users = await User.find({ barangay: barangay.bName });
    const cash = await Reward.findOne({ nameOfGood: 'Cash' });
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

    console.log(type);

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
          time: new Date().toLocaleTimeString('en-PH'),
          date: new Date().toLocaleDateString('en-PH'),
          type: "Conversion",
          name:name,
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
      return res.status(200).send({
        status_code: 200,
        message: action === "Delete" ? "Scrap deleted successfully" : "Scrap updated successfully",
        barangay: barangay,
        junk: junks,
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
          time: new Date().toLocaleTimeString('en-PH'),
          date: new Date().toLocaleDateString('en-PH'),
          type: "Conversion",
          id:id
          
        });

        console.log('Junkshop scrap updated successfully');
      }
  
      return res.status(200).send({
        message: action === "Delete" ? "Scrap deleted successfully" : "Scrap updated successfully",
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
        logs: `New scrap created: ${name} with conversion rate: ${conversion_rate} for ${type} ID: ${id}`,
        time: new Date().toLocaleTimeString('en-PH'),
        date: new Date().toLocaleDateString('en-PH'),
        type: "Conversion",
          id:id
        
      });

      console.log('New scrap created successfully');
     
      console.log(collect);
      
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
    console.log(email);
    
  const x =  await Barangay.find();

    console.log(x);
    
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
    console.log(email);
    
  const x =  await Scrap.find();

    console.log(x);
    
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
    console.log(barangayID);
    
    if (user) {
      // Convert user.points and points from String to int if necessary
      let userPoints = parseInt(user.points) || 0;  // Default to 0 if parsing fails
      let earnedPoints = parseInt(points) || 0;     // Convert the points to an integer

      // Add the points
      userPoints += earnedPoints;

      // Save the updated points back to the user
      user.points = userPoints;
      await user.save();

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
        collection.weight += parseFloat(weight);  // Increment the weight
        await collection.save();
      }

      // Create a new log entry
      const newLog = new Logs({
        userID: userId,
        id: barangayID,
        scrapType: scrapType,
        name:user.fullname,
        logs:`Successfully collected weight: ${weight}kg, scrap type: ${scrapType}. User:${scrapType} gain ${points} ` ,
        weight: weight,
        points:points,
        time: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString(),
        type:"Collect"// Capture the current timestamp

      });
      await newLog.save();
      console.log(`Successfully collected weight: ${weight}kg, scrap type: ${scrapType}. User:${scrapType} gain ${conversion_rate} `);
      
      // Fetch user logs
      const userLogs = await Logs.find({ barangayID: existingBarangay._id });

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

    console.log(location);
    const adminscraps = await AdminScrap.find();
    console.log(adminscraps);

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
        time: time,
        date: date,
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

    // Send a response with only the necessary fields
    return res.status(200).send({
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
    console.log(id);
    const barangay = await Barangay.findOne({_id:bID})
    const scrap =  await Scrap.find({barangayID:bID})
    const reward = await Reward.find({barangayID:bID})
    const users = await User.find({barangay:barangay.bName})
    const cash = await Reward.findOne({nameOfGood:'Cash'})
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
    console.log(id); console.log(type);
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

 console.log(userLogs);
 
 return res.status(200).send({
   "userLogs":userLogs,
         "status_code": 200,
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
    const cash = await Reward.findOne({nameOfGood:'Cash'})
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
      const pending = await Book.find({
        jID: id,
        status: 'pending',
      });
      const declined = await Book.find({
        jID: id,
        status: 'declined',
      });
      const scrap =  await Scrap.find({junkID:id});
      const existingJunk = await JunkShop.findOne({_id:id})
  
      return res.status(200).send({
        "status_code": 200,
        "message": "Junk shop owner data retrieved",
        "junkOwner": existingJunk,
        'declined':declined,
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