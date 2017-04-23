

/*Global variables*/

/*Frame Queue holds 200 most recent Leap frame data where there is a hand
Data in the form of [{x:pos,y:pos},time]*/
var frameQueue = [];
var handInFrame = false;
var gameStarted = true;
var introState = 0;
var firstTimestamp;

// MAIN GAME LOOP
// Called every time the Leap provides a new frame of data
Leap.loop({ frame: function(frame) {
    if (firstTimestamp == null){
      firstTimestamp = frame.timestamp;
    }
    var t = (frame.timestamp-firstTimestamp)/1000;
    var hand;
    if (hand = frame.hands[0]){
      handInFrame = true;
      // console.log("HERE IS FINGER");
      var extendedFingers = [];
    for(var f = 0; f < hand.fingers.length; f++){
        var finger = hand.fingers[f];
        if(finger.extended) {
          extendedFingers.push(finger);
        }
  }
        if (extendedFingers.length){

          var position = {
            x: extendedFingers[0].screenPosition()[0],
            y: extendedFingers[0].screenPosition()[1] + 800
          };

          $("#leapCursor").css({
           left: position.x + 'px',
           top: position.y + 'px'
          });
        }
      //User begins pointing, change text
      if (introState == 0 && gameStarted){
        introState = 1;
        $(".bobText").html("Try painting a mountain in the horizon. While you're pointing, you can do this by saying:<br> <b>PUT A MOUNTAIN THERE. </b>");
      }
      // $("#leapCursor").css({
      //      left: extendedFingers[0].screenPosition()[0] + 'px',
      //      top: extendedFingers[0].screenPosition()[1] + 800+ 'px'
      // });
      // $("#leapCursor").css({
      //      left: hand.screenPosition()[0] + 'px',
      //      top: hand.screenPosition()[1] + 800+ 'px'
      // });
      // var position = {
      //   x: hand.screenPosition()[0],
      //   y: hand.screenPosition()[1] + 800
      // };
      // $("#leapCursor").css({
      //      left: position.x + 'px',
      //      top: position.y + 'px'
      // });
      //Update frame queue
      frameQueue.push([position,t]);
      if (frameQueue.length >= 200){
        frameQueue.shift();
      } 
    }
  }
}).use('screenPosition', {positioning: 'absolute'});

//Speech recognition code
var recognizer = new webkitSpeechRecognition();
recognizer.lang = "en";
recognizer.continuous = true;
recognizer.interimResults = true;
recognizer.start();
var vocab = ["put","this","move","make","paint","mountain","tree","there","here","poetry","but",'that','bear','cloud','iCloud','McCloud','crowd','cloudy','clown','start',"red","orange","yellow","green","blue","purple","violet","brown","white","black"];
var colorPalette = {
      "red": "#A3334A",
      "orange": "#D17A2D",
      "yellow": "#DFBB39",
      "green": "#547C4B",
      "blue": "#4B798D",
      "purple": "#6B4D8F",
      "white": "#E4E0E9",
      "brown": "#5C4B3D",
      "black": "#3A383E",
};
var colorNames = ["red","orange","yellow","green","blue","purple","white","brown","black"];
//List of tuples [word,time] every time a key word is said, along with time it is said
var speechList = [];
//Takes in speechList and assess whether a given string is already said in it
var containsWord = function(speechList,string){
  var contains = false;
  var containList = speechList.map(function(item){
     if (item[0] == string){
      contains = true;
     }
  });
  return contains;
}


//Takes in speechList asses whether one of the words in the stringList is said in speechList
var containsWords = function(speechList,stringList){
  console.log("ENTERING CONTAINSWORDS CODE");
  console.log(speechList,stringList);
  var contains = false;
  //For each word in your speechlist, see if it exists in stringList.
  var containList = speechList.map(function(item){
    console.log(item[0]);
      console.log(stringList.indexOf(item[0]));
     if (stringList.indexOf(item[0])>=0){
      contains = true;
      console.log("STRINGLIST HAS A WORD ");
     }
  });
  return contains;
}

//finds closest or matching value in list, returns the index of that value if found
var binarySearch = function(list,value){
  var low = 0;
  var high = list.length-1;
  var best_index = low;
  while (low <= high){
    mid = low + (high-low)/2;
    if (list[mid] < value){
      low = mid+1;
    } else if(list[mid] > value) {
      high = mid -1;
    } else {
      best_index = mid;
      break
    }
    if (Math.abs(list[mid]-value)< Math.abs(list[best_index]-value)){
      best_index = mid;
    }
  }
  return best_index;
}

//finds closest or matching value in frameQUeue, returns the position object {x: pos, y:pos} at that index
var getPositionFromTime = function(list,value){
  var low = 0;
  var high = list.length-1;
  var best_index = low;
  while (low <= high){
    mid = Math.floor(low + (high-low)/2);
    // console.log("mid: "+mid);
    // console.log(list[mid][0]);
    if (list[mid][1] < value){
      low = mid+1;
    } else if(list[mid][1] > value) {
      high = mid -1;
    } else {
      best_index = mid;
      break
    }
    if (Math.abs(list[mid][1]-value)< Math.abs(list[best_index][1]-value)){
      best_index = mid;
    }
  }
  return list[best_index][0];

}

var horizonLine = 360;
//Selected Element is object of highlighted element
var selectedElement = null;
// var vocab = ["put","but","make","paint","mountain","tree","there","here","poetry",'that','bear','cloud','iCloud','start','them','out','in'];

var currentColor = null;
var assets = {
  tree: {width:124,height:281,src:"tree.png"},
  mountain: {width:600,height:287/969*600,src:"mountain.png"},
  cloud: {width:562,height:191,src:"cloud.png"}
};


//Function for making new tree, takes in position object
var makeNewTree = function(position){
    var containingDiv = document.createElement('div');
    var treeImg = new Image();
    treeImg.className = "tree element";
    if (currentColor != null){
      treeImg.className = "tree element "+ currentColor;
    }
    treeImg.src = assets.tree.src;
    var horizonDist = position.y-horizonLine;
    var scale;
    if (horizonDist > 0){
      scale = .01*horizonDist;
      treeImg.style.left = position.x-assets.tree.width/2*scale+"px";
      treeImg.style.height = assets.tree.height*scale+"px";
      treeImg.style.top = position.y-assets.tree.height*scale+"px";
      //$(containingDiv).append(treeImg);
      $(".wrapper").append(treeImg);
      console.log("PUT A TREE THERE");
    }

};

//Function for making new mountain, takes in position object
var makeNewMountain = function(position){
    var mountainImg = new Image();
    mountainImg.className = "mountain element";
    if (currentColor != null){
      mountainImg.className = "mountain element "+ currentColor;
    }
    mountainImg.src = assets.mountain.src;
    mountainImg.style.left = position.x-assets.mountain.width/2+"px";
    $(".wrapper").append(mountainImg);

};

//Function for making new cloud, takes in position object
var makeNewCloud = function(position){
    var cloudImg = new Image();
    cloudImg.className = "cloud element";
    if (currentColor != null){
      cloudImg.className = "cloud element "+ currentColor;
    }
    cloudImg.src = assets.cloud.src;

    var horizonDist = horizonLine-position.y;
    var scale;
    if (horizonDist > 0){
      scale = .01*horizonDist;
      cloudImg.style.left = position.x-assets.cloud.width/4*scale+"px";
      cloudImg.style.height = assets.cloud.height/2*scale+"px";
      cloudImg.style.top = position.y-assets.cloud.height/4*scale+"px";
      $(".wrapper").append(cloudImg);
    }

};

//Color name is string of target color you want to change to "yellow", etc.
var changeBrushColor = function(colorName){
  currentColor = colorName;
  $("#leapCursor").css("background-color",colorPalette[colorName]);

}
recognizer.onresult = function(event) {

    var transcript = '';
    var hasFinal = false;
    var time = event.timeStamp;
    //var speechList = [];
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      console.log(event.results[i][0]);
      console.log(time);
      if (event.results[i].isFinal){
        console.log("FINAL");

        //Once you receive the Final transcript, interpret the words
        if (containsWord(speechList,"start")&& gameStarted ==false){
          gameStarted = true;
          $(".intro").hide();
          console.log("GAME STARTED");
          $(".speechBar").html("");
        }

        if (gameStarted==true){
                  //This is "making an object mode"
        // if (containsWord(speechList,"put") || containsWord(speechList,"but")|| containsWord(speechList,"make") || containsWord(speechList,"paint")  || containsWord(speechList,"poetry")){

          if(introState ==2){
            //$(".bottomWrapper").hide();
            $(".bobText").hide();
          }

          //Change color of cursor/paintbrush
          console.log("THIS IS SPEECHLIST PASSING IN");
          console.log(speechList);
          if (containsWords(speechList,colorNames)){
            console.log("CONTAINS COLOR");
            //Identify which color has been said last
            var targetColor;
            speechList.map(function(item){
              word = item[0];
              if (colorNames.indexOf(word)>=0){
                targetColor = word;
              }
            });
            changeBrushColor(targetColor);  
          }
          //Create new tree object
           if (containsWord(speechList,"tree") && (containsWord(speechList,"there") || containsWord(speechList,"here")) || containsWord(speechList,"poetry")){
              var thereTime = speechList["there"];
              var therePosition = getPositionFromTime(frameQueue,thereTime);
              makeNewTree(therePosition);
           }

           //Create new mountain
           if (containsWord(speechList,"mountain") && (containsWord(speechList,"there") ||containsWord(speechList,"here"))){
              var thereTime = speechList["there"];
              var therePosition = getPositionFromTime(frameQueue,thereTime);
              makeNewMountain(therePosition);
              //After user intiaially has put a mountain, change state
              if (introState == 1){
                introState = 2;
                $(".bobText").html("Now, try making a <b>CLOUD</b> or a <b>TREE</b> in a similar way. Have fun!");
              }
           }

          //Create new cloud
           if (containsWord(speechList,"cloud") && (containsWord(speechList,"there") ||containsWord(speechList,"here")||containsWord(speechList,"bear"))){
              var thereTime = speechList["there"];
              var therePosition = getPositionFromTime(frameQueue,thereTime);
              makeNewCloud(therePosition);
           }

        // } //End of if say put, but, make
        if (containsWord(speechList,"there")){
              console.log("entering PUT THAT THERE CODE");
              if (selectedElement != null){
                //Create a copy of selected element

                //Element is a tree
                if($(selectedElement).hasClass("tree")){
                    var thereTime = speechList["there"];
                    var therePosition = getPositionFromTime(frameQueue,thereTime);
                    makeNewTree(therePosition);
                }
                if ($(selectedElement).hasClass("mountain")){
                  var thereTime = speechList["there"];
                  var therePosition = getPositionFromTime(frameQueue,thereTime);
                  makeNewMountain(therePosition);
                }

                //Create new cloud
                if ($(selectedElement).hasClass("cloud")){
                  //Find the time of the "there word"
                  var thereTime = speechList["there"];
                  var therePosition = getPositionFromTime(frameQueue,thereTime);
                  makeNewCloud(therePosition);
                }
                $(selectedElement).hide();
                selectedElement = null;
              }
           }
        }

        speechList = [];
       }else {

        //Record the first instances of words that are said, if words are
        //mountain, tree, put, make

        var thisPhrase = event.results[i][0].transcript;
        var phraseWords = thisPhrase.split(' ');
        console.log(phraseWords);

        //Iterate through each word said
        for (var j = 0; j<phraseWords.length; j++){
          console.log('iterating through phraseWords');
          word = phraseWords[j].toLowerCase();
          //Check if there is a match
          console.log(vocab.indexOf(word));
          console.log(vocab);

          //Word is recognized in the existing vocabulary
          if (vocab.indexOf(word) >= 0){
            console.log("WORD EXISTS IN DICTIONARY");
            //This is the first instance of the word in the given context
            if (!containsWord(speechList,word)){
               speechList.push([word,time]);
               console.log("PUSHING TO SPEECH LIST");
              //SPECIAL CASE: word we said is "that", in this case we want to instantly highlight
              if( word == "that" || word == "this"){
                var thatPosition = getPositionFromTime(frameQueue,time);
                //Iterate through existing painting elements
                var elements = $(".element");
                $(elements).each(function(index){
                  var thisElement = elements[index];
                  var divRect = $(thisElement).offset();
                  if(thatPosition.x>= divRect.left && thatPosition.x <= divRect.left+$(thisElement).width() &&
                      thatPosition.y >= divRect.top && thatPosition.y <= divRect.top+$(thisElement).height() ){
                    selectedElement = thisElement;
                  }
                });
                //Determine which color selectedElement has
                var targetColor = null;
                colorNames.map(function(item){
                  if ($(selectedElement).hasClass(item)){
                    targetColor = item;
                  }
                });
                if (targetColor !=null){
                  changeBrushColor(targetColor);
                }
                $(".element").removeClass("highlighted");
                $(selectedElement).addClass("highlighted");
                // var prevFilter = $(selectedElement).css("filter");
                // $(selectedElement).css(prevFilter+ " "+drop-shadow(0px 0px 10px yellow));
              }
            }
            
          }
        }
       }
    }

    if (event.results.length > 0) {
    }  
    var interim_transcript = '';
    var final_transcript='';
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final_transcript += event.results[i][0].transcript;
        //$(".recentSpeech").html(final_transcript);
        if(gameStarted==true){
          $(".speechBar").html("<b>What we think you said:<br></b>"+final_transcript);
          // console.log("FINAL TRANSCRIPT: "+ final_transcript);
        }
      
      } else {
        interim_transcript += event.results[i][0].transcript;
        if(gameStarted==true){
          $(".speechBar").html("<b>What we think you said:<br></b>"+interim_transcript);
          // console.log("FINAL TRANSCRIPT: "+ final_transcript);
        }
      }
    }
};