
const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;


/* middleware */
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.takrq.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db('tools').collection('products');
    const bookingCollection = client.db('tools').collection('bookingProducts');

    app.get('/tools', async (req, res) => {
      const tools = await toolsCollection.find().toArray();
      res.send(tools);
    })

    app.get('/tool/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.findOne(query);
      // console.log(result);
      res.send(result);
    })

    app.post('/booking', async (req, res) => {
      const booking = req.body;
      // console.log(booking);
      const result = await bookingCollection.insertOne(booking);
      // SendTestEmail(booking);
      return res.send({ success: true, result });
    })

    app.get('/booking', async (req, res) => {
      const email = req.query.user;
      /*  const authorization = req.headers.authorization;
       console.log('auth header: ',authorization); */
      //const decodedEmail = req.decoded.email;
      //if (patient === decodedEmail) {
      const query = { useremail: email };
      const bookings = await bookingCollection.find(query).toArray();
      return res.send(bookings);
      //} else {
      return res.status(403).send({ message: 'forbidden access' });
      //}
    })

  } finally {

    // await client.close();
  }
}
run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})