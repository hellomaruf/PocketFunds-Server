require("dotenv").config();
const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
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
      const { name, email, phoneNum, roleRequest, password, pin } = req.body;
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
      console.log(email);
      const result = await usersCollection.findOne({ email });
      console.log(result);
      res.send(result)
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
