function showLoginForm() {
    document.getElementById('login_form').classList.remove('hide');
    document.getElementById('login').classList.remove('hide');
}

function hideLoginForm() {
    document.getElementById('password').value = "";
    document.getElementById('username').value = "";
    document.getElementById('login_form').classList.add('hide');
    document.getElementById('login').classList.add('hide');
}

function showLoggedInMessage(username) {
    document.getElementById('logout').classList.remove('hide');
    document.getElementById('greetings').classList.remove('hide');
    document.getElementById('greetings').innerHTML = "Hello " + username + "!";
}

function hideLoggedInMessage() {
    document.getElementById('greetings').innerHTML = "";
    document.getElementById('greetings').classList.add('hide');
    document.getElementById('logout').classList.add('hide');
}


function showLoggedOutState() {
    showLoginForm();
    hideLoggedInMessage();
    document.getElementById('friends_list').innerHTML = "";
    document.getElementById('media_container').innerHTML = "";
    document.getElementById('media_navigation').classList.add('hide');
    document.getElementById('album_showing').value = "";
}

function createImageTag(mediaId, mediaUrl) {
    let imgTag = document.createElement('img');
    imgTag.src = mediaUrl;
    imgTag.id = mediaId;
    imgTag.height = 500;
    imgTag.width = 500;
    return imgTag;
}

function createVideoTag(mediaId, mediaUrl) {
    let vidTag = document.createElement('video');
    vidTag.src = mediaUrl;
    vidTag.id = mediaId;
    vidTag.controls = true;
    vidTag.height = 500;
    vidTag.width = 500;
    return vidTag;
}

function createCrossBtn() {
    let crossBtn = document.createElement('button');
    crossBtn.id = "close";
    crossBtn.innerText = 'X';
    crossBtn.onclick = handleCrossBtnClicked;
    return crossBtn;
}


/**
 * call the loadAlbum function when
 * the album's list is clicked
 * @param {MouseEvent} ev 
 */
function handleAlbumClicked(ev) {
    console.log("handleAlbumClicked(): clicked");
    let activeAlbum = null;
    let childrenNodes = document.getElementById("friends_list").children;
    for (let element of childrenNodes) {
        if (element.classList.contains("active")) {
            activeAlbum = element;
        }
    }

    if (!activeAlbum) {
        ev.target.classList.add("active")
    } else {
        if (activeAlbum.id !== ev.target.id) {
            activeAlbum.classList.remove("active")
            ev.target.classList.add("active");
        }
    }
    localStorage.setItem('currentPageNumber', "0")
    loadAlbum(ev, Number(localStorage.currentPageNumber));
}

function handlePreviousClicked(ev) {
    localStorage.setItem('currentPageNumber', String(Number(localStorage.currentPageNumber) - 1));
    loadAlbum(ev, Number(localStorage.currentPageNumber));
}

function handleNextClicked(ev) {
    localStorage.setItem('currentPageNumber', String(Number(localStorage.currentPageNumber) + 1));
    loadAlbum(ev, Number(localStorage.currentPageNumber));
}

function handleCrossBtnClicked(ev) {
    loadAlbum(ev, Number(localStorage.currentPageNumber));
}

/**
 * Enlarge photo when user click the photo
 * @param {MouseEvent} ev when user clicked the image 
 */
function displayPhoto(ev) {
    let clickedPhoto = ev.currentTarget;
    let crossBtn = createCrossBtn();
    document.getElementById('media_container').innerHTML = "";
    document.getElementById('media_navigation').classList.add('hide');
    document.getElementById('media_container').appendChild(crossBtn);
    document.getElementById('media_container').appendChild(clickedPhoto);

}

/**
 * Enlarge video when user click the video
 * @param {MouseEvent} ev when user clicked the video 
 */
function displayVideo(ev) {
    let clickedVideo = ev.currentTarget;
    let crossBtn = document.createElement('button');
    crossBtn.id = "close";
    crossBtn.innerText = 'X';
    crossBtn.onclick = handleCrossBtnClicked;
    document.getElementById('media_container').innerHTML = "";
    document.getElementById('media_navigation').classList.add('hide');
    document.getElementById('media_container').appendChild(crossBtn);
    document.getElementById('media_container').appendChild(clickedVideo);
}


/**
 * Retrieve the user's album from server  and load it onto the website
 * @param {MouseEvent} ev
 * @param {number} pageNum first page starts with 0
 */
function loadAlbum(ev, pageNum) {
    // before loading, clear the container first
    document.getElementById('media_container').innerHTML = "";
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.log("loadAlbum(): received response from server");
            let responseData = JSON.parse(xhr.response);
            let mediaList = responseData.mediaList;
            /*
            if total pages = 0, it means there is only total of 1 page
            if total pages = 1, it means there is total of 2 page
            and so on and so forth
            */
            let totalPages = responseData.totalPages; 

            mediaList.forEach(obj => {
                let mediaFormat = obj.mediaUrl.slice(-3);
                let endingMessage = "";

                // this is the container to contain the <img>/<video> and the liked message
                let divTag = document.createElement('div');
                divTag.classList.add('media'); // add media class

                // append <img> or <video> depending on format
                if (mediaFormat === "jpg") {
                    endingMessage = "photo";
                    divTag.onclick = displayPhoto;
                    divTag.appendChild(createImageTag(obj.mediaId, obj.mediaUrl));
                } else if (mediaFormat === "mp4") {
                    endingMessage = "video";
                    divTag.onclick = displayVideo;
                    divTag.appendChild(createVideoTag(obj.mediaId, obj.mediaUrl));
                }

                
                // append <p> containing like message if it exists
                if (obj.likedby.length !== 0) {
                    let paragraphTag = document.createElement("p");
                    let message = "";
                    for (let i = 0; i < obj.likedby.length; i++) {
                        if (i === obj.likedby.length - 1) {
                            message += obj.likedby[i] + " liked this " + endingMessage;
                        } else {
                            message += obj.likedby[i] + ", ";
                        }
                    }
                    paragraphTag.innerHTML = message;
                    divTag.appendChild(paragraphTag);
                }

                // finally append to the album container
                document.getElementById('media_container').appendChild(divTag);
            });

            if (!(pageNum === 0 && pageNum === totalPages)) {
                console.log("show navigation")
                document.getElementById('media_navigation').classList.remove('hide');
                let previous = document.getElementById('go-previous');
                let next = document.getElementById('go-next');
                next.onclick = handleNextClicked;
                previous.onclick = handlePreviousClicked;
                if (pageNum === 0) {
                    previous.classList.add('disabled');
                    next.classList.remove('disabled');
                }
                else if (pageNum === totalPages) {
                    previous.classList.remove('disabled');
                    next.classList.add('disabled');
                }

                if (!(ev.target.id === 'go-previous' || ev.target.id === "go-next" || ev.target.id === "close")) {
                    document.getElementById('album_showing').value = ev.target.id;
                }
            } else {
                console.log("navigation not shown");
            }
        }

    }

    let userid;

    if (ev.target.id === "go-previous" || ev.target.id === "go-next" || ev.target.id === "close") {
        userid = document.getElementById('album_showing').value;
    } else {
        userid = ev.target.id;
    }

    const method = "GET";
    let query = "?userid=" + userid + "&pagenum=" + pageNum;
    const url = "http://localhost:8081/getalbum" + query;
    xhr.open(method, url, true);
    xhr.send()
}



/**
 * Add friends' album name in html
 * @param {Array} friendsList 
 */
function addFriendsList(friendsList) {
    let myAlbum = document.createElement('div');
    myAlbum.id = "0";
    myAlbum.classList.add('friend');
    myAlbum.onclick = handleAlbumClicked;
    myAlbum.innerText = "My Album";
    let hiddenTag = document.createElement('input');
    hiddenTag.type = "hidden";
    hiddenTag.value = myAlbum.id 
    myAlbum.appendChild(hiddenTag);
    document.getElementById('friends_list').appendChild(myAlbum);
    for (const idx in friendsList) {
        let divTag = document.createElement('div');
        divTag.id = friendsList[idx][1]
        divTag.classList.add('friend');
        divTag.onclick = handleAlbumClicked;
        let lastChar = friendsList[idx][0].slice(-1);
        divTag.innerText = lastChar === "s" ? friendsList[idx][0] + "' Album" : friendsList[idx][0] + "'s Album"
        let hiddenTag = document.createElement('input')
        hiddenTag.type = "hidden"
        hiddenTag.value = divTag.id
        divTag.append(hiddenTag);
        document.getElementById('friends_list').appendChild(divTag);
    }
}



function init() {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
            if (xhr.response) {
                console.log("init(): response received");
                let responseData = JSON.parse(xhr.response);
                let friendsList = responseData.friendsList;
                addFriendsList(friendsList);
                hideLoginForm();
                showLoggedInMessage(localStorage.getItem('currentUsername'));
            } else {
                console.log("init(): Nothing is received from server");
            }
        }
    }
    const method = "GET";
    const url = "http://localhost:8081/load";
    xhr.open(method, url, true);
    xhr.send();
}

function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById('password').value;
    if (username.length === 0 || password.length === 0) {
        alert("Please enter username and password")
        return;
    } 
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
            if (xhr.responseText === "Login failure") {
                alert(xhr.responseText);
            } else {
                console.log("Login successfully");
                let responseData = JSON.parse(xhr.response);
                localStorage.setItem("currentUsername", responseData.currentUsername);
                localStorage.setItem("currentPageNumber", "0")
                let friendsList = responseData.friendsList;
                addFriendsList(friendsList);
                hideLoginForm();
                showLoggedInMessage(localStorage.getItem('currentUsername'));
            }
        }
    }

    const method = "POST";
    const url = "http://localhost:8081/login";
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    const responseBody = "username=" + username + "&password=" + password;
    xhr.send(responseBody);
    
}

function logout() {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.log("Logged out successfully");
            localStorage.clear();
            showLoggedOutState();
        }
    }
    const method = "GET";
    const url = "http://localhost:8081/logout";
    xhr.open(method, url, true);
    xhr.send();
}