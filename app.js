let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');

let app = express();

// database
let monk = require('monk');
const mongodbServerURL = 'localhost:27017/assignment1';
let db = monk(mongodbServerURL);

app.use((req, res, next) => {
  req.db = db;
  next();
})

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
  res.send('hello');
})


app.get('/load', (req, res) => {
  if (!req.cookies.user_id) {
    res.send('')
    return;
  }
  const uid = req.cookies.user_id;
  let userListCol = req.db.get('userList');
  let friendsList = [];
  let responseData = {currentUsername: "", friendsList: ""}; // the data to be sent to frontend

  userListCol.findOne({_id: uid}).then((currentUser) => {
    // currentUser is null if not found. Throw error if not found
    if (!currentUser) {
      throw new Error('load(): Unable to find user');
    }

    responseData.currentUsername = currentUser.username;

    return Promise.all(currentUser.friends.map(name => {
      return userListCol.findOne(
        {username:name}, // query conditions
        {projection: {_id:1,username:1}}) // only include the _id field and username field
    }))

  }).then((arrayOfFriends)=>{
    arrayOfFriends.forEach(obj => {
      friendsList.push([obj.username, obj._id])
    })

    responseData.friendsList = friendsList;
    res.json(responseData);
  }).catch(err => {
    console.error(err);
    res.send(err);
  })

})

app.post('/login', (req, res) => {
  const currentUsername = req.body.username;
  const password = req.body.password;
  const milliseconds = 30 * 60000;
  let userListCol = req.db.get('userList');
  let friendsList = [];
  let responseData; // the data to be sent to frontend

  userListCol.findOne({username: currentUsername, password: password}).then((currentUser)=>{
    // currentUser is null if not found. Throw error if not found
    if (!currentUser) {
      throw new Error('Login failure');
    }
    
    // set cookie user_id
    res.cookie('user_id', currentUser._id, {maxAge: milliseconds});

    // Retrieve all the username and _id of current user's friend
    // currentUser.friends is an array of username
    return Promise.all(currentUser.friends.map(name=>{
      return userListCol.findOne(
        {username:name}, // query conditions
        {projection: {_id:1,username:1}}) // only include the _id field and username field
    }))

  }).then((arrayOfFriends)=>{
    arrayOfFriends.forEach(obj => {
      friendsList.push([obj.username, obj._id])
    })
    
    
    responseData = {currentUsername: currentUsername, friendsList: friendsList}
    res.json(responseData);
  }).catch(err => {
    console.error(err);
    res.send("Login failure");
  })


})



app.get('/logout', (req, res) => {
  res.clearCookie('user_id'); // unset the cookie
  res.send('');
})

app.get('/getalbum', (req, res) => {
  const userid = req.query.userid === "0" ? req.cookies.user_id : req.query.userid;
  const pagenum = req.query.pagenum;
  const mediaPerPage = 8; // number of videos/photos to show per page
  let responseData; // the data to be sent to frontend
  let sizeOfAlbum; // the total no. of photos and videos the user has
  let totalPages;
  let mediaList = [];

  console.log("User id:", userid);
  console.log('page:', pagenum);
  
  let mediaListCol = req.db.get('mediaList');
  mediaListCol.find({userid: monk.id(userid)}).then((docs) => {
    if (docs.length === 0) {
      throw new Error("Unable to find media");
    }

    sizeOfAlbum = docs.length;
    totalPages = (sizeOfAlbum === mediaPerPage) ? 0 : Math.floor(sizeOfAlbum / mediaPerPage);

    /*
    e.g. pagenum: 0 (first page)
    lowerlimit : 8 * 0 = 0
    upperlimit : lowerlimit + 8 = 8

    e.g. pagenum: 1 (second page)
    lowerlimit: 8 * 1 = 8
    upperlimit: lowerlimit + 8 = 16

    if upperlimit >= sizeofalbum
    upperlimit = size of albu
    */ 
    let lowerLimit = mediaPerPage * pagenum;
    let upperLimit = (lowerLimit + mediaPerPage >= sizeOfAlbum) ? sizeOfAlbum : lowerLimit + mediaPerPage;
    // lowerlimit <= idx < upperlimit

    console.log("Lower limit:", lowerLimit);
    console.log("Upper limit:", upperLimit);
    for (let idx = lowerLimit; idx < upperLimit; idx++) {
      mediaList.push({mediaId: docs[idx]._id, mediaUrl: docs[idx].url, likedby: docs[idx].likedby})
    }

    responseData = {mediaList: mediaList, totalPages: totalPages};
    res.json(responseData);

  }).catch(err => {
    console.error(err);
    res.send(err.toString());
  })
  
})

app.post('/postlike', (req, res) => {
  const mediaId = monk.id(req.body.photovideoid); // cast the string to an ObjectId
  let userWhoLikedId = req.cookies.user_id;
  let userWhoLikedName;
  let responseData;
  let updatedLikedByArray;
  let userListCol = req.db.get('userList');
  let mediaListCol = req.db.get('mediaList');
  console.log("The photovideoid:", mediaId);

  userListCol.findOne({_id: userWhoLikedId}).then((userWhoLiked)=>{
    if (!userWhoLiked) {
      console.log("Unable to find user who liked");
      throw new Error("Unable to find user who liked");
    }
    userWhoLikedName = userWhoLiked.username;
    return mediaListCol.findOne({_id: mediaId})
  }).then((queryResult)=> {
    console.log("Query result liked by array", queryResult.likedby);
    if(queryResult.likedby.includes(userWhoLikedName)) {
      console.log("this user has already liked before");
      return queryResult.likedby;
    } else {
      console.log("this user has not liked before");
      let existingArray = queryResult.likedby;
      existingArray.push(userWhoLikedName);
      return existingArray;
    }
  }).then((likedbyArray)=> {
    console.log("likedbyArray:",likedbyArray);
    updatedLikedByArray = likedbyArray;
    return mediaListCol.update({_id: mediaId}, {$set: {likedby: likedbyArray}})
  }).then(() => {
    console.log("End", updatedLikedByArray);
    responseData = {likedby: updatedLikedByArray}
    res.json(responseData);

  }).catch(err => {
    console.error(err);
    res.send(err.toString());
  })
  
})


const PORT = 8081
app.listen(PORT, ()=>{
  console.log(`Album App listening on port ${PORT}`);
  db.then(() => {
    console.log("Connected correctly to server");
  })

})