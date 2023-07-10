var express = require("express");
var app = express();
var connection = require('./database');
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32); // Generate a random key (32 bytes for AES-256)
const iv = crypto.randomBytes(16);
const {
    v4: uuidv4
  } = require('uuid')
  const bcrypt = require('bcrypt')

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req,res){
    let sql="select * from USER";
    connection.query(sql,function(err,result){
        if(err) console.log(err)
        res.send(result);
    })
});

app.post('/api/signup',async(req,res)=>{
    const {Username,Email_ID,Password}=req.body;
    const saltRounds = 10;
    const encryptedPassword = await bcrypt.hash(Password, saltRounds)

    connection.query(
        `INSERT INTO USER(Username,Password,User_ID,Email_ID) VALUES (?,?,?,?)`,[Username,encryptedPassword,uuidv4(),Email_ID],(err,result)=>
        {
            if(err){
            console.log(err)
            }
            else{
                const User_ID = result.insertId;
                console.log('User_ID:', User_ID);

                connection.query(
                    `SELECT User_ID FROM USER WHERE User_ID = ?`,
                    [User_ID],
                    (err, rows) => {
                        if (err) {
                            console.log(err);
                        } else {
                            const insertedUser = rows[0];
                            res.send({
                                status: 'Account successfully created',
                                status_code: '200',
                                User_ID: insertedUser.User_ID,
                            });
                        }
                    }
                );
            }
        }
    )
})

app.post('/api/login',async(req,res)=>{
    const { Username, Password } = req.body;

    connection.query(
        'SELECT Password, User_ID FROM user WHERE Username=?',[Username],async(err,result)=>
        {
            console.log(result);
            if(err){
                console.log(err)
            }
            else{
                if(result){
                    const comparison = await bcrypt.compareSync(Password,result[0].Password)
                    if(comparison){
                        res.send({
                            status: "Incorrect username/password provided. Please retry",
                            status_code: 401
                        })
                    }else{
                        const accessToken = uuidv4();
                        res.send({
                            status: "Login successful",
                            status_code: 200,
                            User_Id: result[0].User_ID,
                            access_token: accessToken,
                        })
                    }
                }
            }
        }
    )     
})

app.post('/api/trains/create', async (req, res) => {
    const { TrainName, Source, Destination, Seats, Arrival_S, Arrival_D } = req.body;
    const TrainID = uuidv4(); // Generate a UUID for TrainID
  
    connection.query(
      `INSERT INTO TRAIN(TrainID, TrainName, Source, Destination, Seats, Arrival_S, Arrival_D) VALUES (?,?,?,?,?,?,?)`,
      [TrainID, TrainName, Source, Destination, Seats, Arrival_S, Arrival_D],
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send('Error adding train');
        } else {
          res.send({
            status: 'Train added successfully',
            TrainID: TrainID,
          });
        }
      }
    );
  });
  

app.get('/api/trains/availability', function(req, res) {
    const {Source,Destination} = req.query;
           
    connection.query(
        'SELECT TrainID,TrainName,Seats FROM train WHERE Source=? AND Destination = ?',[Source,Destination],
        async (err, result) => {
            if (err) {
                console.log(err);
                // Handle the error appropriately
                res.status(500).send({
                    message: 'No trains available',
                  });
            } else {

                const trains = result.map((row) => ({
                    TrainID: row.TrainID,
                    TrainName: row.TrainName,
                    Seats: row.Seats,
                  }));
          
                  res.send(trains);
                // res.send({
                //     TrainID: TrainID,
                //     TrainName: TrainName,
                //     Seats: Seats
                // });
            }
        }
    );
});

app.post('/api/trains/?TrainID/book',async(req,res)=>{
    const { User_ID, TotalSeats} = req.body;
    const BookingID=uuivd4();

    connection.query(
        `INSERT INTO BOOKING(BookingID,User_ID,TotalSeats,SeatsNo,TrainID) VALUES (?,?,?,?,?)`,[BookingID,User_ID,TotalSeats,SeatsNo,TrainID],(err,result)=>
        {
            console.log(result);
            if(err){
                console.log(err)
            }
            else{
                if(result){
                    res.send({
                        message: "Seat booked successfully",
                        BookingID : BookingID,
                        Seat_numbers: [5,6]
                    })
                }
            }
        }
    )     
})


app.listen(3000, function(){
    console.log('App Listening on port 3000');
    connection.connect(function(err){
        if(err) console.log(err)
        console.log('Database connected!');
    })
});


