
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

function verifyJWT(req, res, next) {

  const authHeader = req.headers.authorization;
  // console.log(authHeader);
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
  // next();
}




async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db('tools').collection('products');
    const bookingCollection = client.db('tools').collection('bookingProducts');
    const reviewCollection = client.db('tools').collection('reviews');
    const usersCollection = client.db('tools').collection('users');
    const testingProductCollection = client.db('tools').collection('testingProduct');


    /* admin checker */
    const verifyAdmin = async (req, res, next) => {
      const adminRequester = req.decoded.email;
      console.log(adminRequester);
      const adminRequesterAccount = await usersCollection.findOne({ email: adminRequester })
      if (adminRequesterAccount.role === 'admin') {
        next();
      } else {
        res.status(403).send({ message: 'forbidden' });
      }
    }




    app.get('/tools', async (req, res) => {
      const tools = await testingProductCollection.find().toArray();
      res.send(tools);
    })

    app.get('/tool/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await testingProductCollection.findOne(query);
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

    app.get('/booking', verifyJWT, async (req, res) => {
      const email = req.query.user;

      //const authorization = req.headers.authorization;
      //console.log('auth header: ', authorization);

      //const decodedEmail = req.decoded.email;
      //if (patient === decodedEmail) {
      const query = { useremail: email };
      const bookings = await bookingCollection.find(query).toArray();
      return res.send(bookings);
      //} else {
      return res.status(403).send({ message: 'forbidden access' });
      //}
    })

    app.post('/addreview', async (req, res) => {
      const review = req.body;
      // console.log(review);
      const result = await reviewCollection.insertOne(review);
      return res.send({ success: true, result });
    })

    app.get('/review', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await reviewCollection.find(query).toArray();
      // console.log(result);
      res.send(result);
    })

    app.get('/allreviews', async (req, res) => {
      const query = {};
      const result = await reviewCollection.find(query).toArray();
      // console.log(result);
      res.send(result);
    })

    /* user token generated */
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      // ekta inforation thake user body te 
      const user = req.body;

      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ result, token });
    })

    app.get('/users', verifyJWT, async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    })

    // user addmin request handle

    app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;

      const filter = { email: email };
      const updateDoc = {
        $set: { role: 'admin' },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    })


    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email: email });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin });
    })

    app.delete('/review/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: ObjectId(id) };
      console.log(filter);
      const result = await reviewCollection.deleteOne(filter);
      res.send(result);
    })

    app.post('/addproduct',verifyJWT,verifyAdmin ,async (req, res) => {
      const product = req.body;
      console.log(product);
      const result = await testingProductCollection.insertOne(product);
      res.send(result);
    })

    app.patch('/addbooking/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const UQ = req.body;
      // console.log(UQ);
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
          $set: {
            quantity: UQ.quantity
          }
      }
      const result = await testingProductCollection.updateOne(filter, updateDoc);
      res.send(result);
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