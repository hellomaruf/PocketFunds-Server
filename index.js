const { MongoClient, ServerApiVersion } = require("mongodb");
require('dotenv').config()
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.0o9qayn.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });
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
