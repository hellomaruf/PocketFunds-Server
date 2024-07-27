require("dotenv").config();
const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;

// middleware
app.use(express.json());
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

// const uri = `mongodb://PocketFunds:${process.env.PASS}@ac-dyjlgmy-shard-00-00.xq5doar.mongodb.net:27017,ac-dyjlgmy-shard-00-01.xq5doar.mongodb.net:27017,ac-dyjlgmy-shard-00-02.xq5doar.mongodb.net:27017/?replicaSet=atlas-45tt8x-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0`;
// const uri = `mongodb+srv://PocketFundsDB:qu4b5dRFgvsdKixF@cluster0.0o9qayn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const uri =
  "mongodb://PocketFundsDB:8DiLKXRbxWNKUEne@ac-tuztplb-shard-00-00.0o9qayn.mongodb.net:27017,ac-tuztplb-shard-00-01.0o9qayn.mongodb.net:27017,ac-tuztplb-shard-00-02.0o9qayn.mongodb.net:27017/?replicaSet=atlas-z73jlu-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Create collections*************
    const usersCollection = client.db("PocketFunds").collection("users");

    // Added user Data**************
    app.post("/users", async (req, res) => {
      const {
        name,
        email,
        phoneNum,
        roleRequest,
        password,
        pin,
        role,
        balance,
      } = req.body;
      const hashPin = bcrypt.hashSync(pin, 6);
      const users = req.body;
      console.log(users);
      const user = {
        name,
        email,
        phoneNum,
        roleRequest,
        password,
        pin: hashPin,
        status: "pending",
        role,
        balance,
      };
      console.log(user);
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/reqUser/:roleRequest", async (req, res) => {
      const roleRequest = req.params.roleRequest;
      const query = { roleRequest };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/loginUser", async (req, res) => {
      const userInfo = req.body;
      // console.log(userInfo);
      const email = userInfo.email;
      const pin = userInfo.pin;
      // console.log(email, pin);
      const currentUser = await usersCollection.findOne({ email });
      const status = currentUser?.status;
      // console.log(currentUser);
      const combinePin = pin.join("");
      console.log(pin, currentUser?.pin, combinePin);
      const validPin = await bcrypt.compare(combinePin, currentUser?.pin);
      console.log(validPin);
      if (!validPin) {
        return res.send({ message: "Invalid Pin" }).status(400);
        // return res.send({ message: "You are Logged In" }).status(200);
      }
      if (currentUser?.email !== email) {
        return res.send({ message: "Email Not Matched!" });
      }
      if (currentUser?.email === email && status === "accepted") {
        return res.send({ message: "Login Successfully!" });
      } else {
        return res.send({ message: "Wait for admin approval!" });
      }
    });

    // Get user data by email****************
    app.get("/loggedUser/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      res.send(result);
    });

    // Send money ************
    app.patch("/sendMoney", async (req, res) => {
      const data = req.body;
      console.log(data);
      const sendedAmount = parseFloat(data.sendAmount);
      const receverEmail = data.receverEmail;
      const senderEmail = data.senderEmail;
      const receverFilter = { email: receverEmail };
      const senderFilter = { email: senderEmail };
      console.log(receverEmail);
      const currentUser = await usersCollection.findOne({
        email: senderEmail,
      });
      console.log(currentUser.pin);
      const pin = data.pin.join("");
      const validPin = await bcrypt.compare(pin, currentUser?.pin);
      console.log(validPin);
      if (validPin) {
        const removeBalance = {
          $inc: {
            balance: -sendedAmount + sendedAmount * 0.05,
          },
        };
        const senderResult = await usersCollection.updateOne(
          senderFilter,
          removeBalance
        );

        const addBalance = {
          $inc: {
            balance: sendedAmount,
          },
        };
        const receverResult = await usersCollection.updateOne(
          receverFilter,
          addBalance
        );
        res
          .status(200)
          .send(
            { message: "Send money Successfully!" },
            receverResult,
            senderResult
          );
      }
    });

    // Cash Out***************
    app.patch("/cashOut", async (req, res) => {
      const senderData = req.body;
      console.log(senderData);
      const senderAmount = parseFloat(senderData?.sendAmount);
      const senderEmail = senderData?.senderEmail;
      const agentEmail = senderData?.receverEmail;
      const senderPin = senderData?.pin;
      const agentFilter = { email: agentEmail };
      const senderFilter = { email: senderEmail };
      const feePercentage = 1.5 / 100;
      const fee = senderAmount * feePercentage;
      const agentUpdateDoc = {
        $inc: {
          balance: senderAmount + fee,
        },
      };
      const senderUpdateDoc = {
        $inc: {
          balance: -(senderAmount - fee),
        },
      };

      const agentResult = await usersCollection.updateOne(
        agentFilter,
        agentUpdateDoc
      );
      const senderResult = await usersCollection.updateOne(
        senderFilter,
        senderUpdateDoc
      );

      res
        .send({ message: "Cash Out Successfully!" }, agentResult, senderResult)
        .status(200);
    });

    // cash in **************
    app.patch("/cashIn", async (req, res) => {
      const cashInData = req.body;
      console.log(cashInData);
      const senderEmail = cashInData.senderEmail;
      const receverEmail = cashInData.receverEmail;
      const cashInReq = cashInData.cashInReq;
      const pin = cashInData.pin;
      const senderAmount = cashInData.sendAmount;
      if (cashInReq === "pending") {
        return res.send({ message: "Wait for agent aproval" });
      }
      if (cashInReq === "accepted") {
        return res.send({ message: "succesfully cash in" });
      }
    });

    // update user request as user*************
    app.patch("/userReq/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      console.log(filter);
      const updateDoc = {
        $set: {
          // TODO :  add update doc
          role: "user",
          status: "accepted",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      // res.send({ message: "Update Successfully!" }, result).status(200);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("PocketFunds server is Running");
});

app.listen(port, () => {
  console.log(`PocketFunds listening on port ${port}`);
});
