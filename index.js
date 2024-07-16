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
  "mongodb+srv://PocketFundsDB:8DiLKXRbxWNKUEne@cluster0.0o9qayn.mongodb.net/?appName=Cluster0";

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
