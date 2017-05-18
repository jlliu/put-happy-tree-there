

/*Global variables*/

/*Frame Queue holds 200 most recent Leap frame data where there is a hand
Data in the form of [{x:pos,y:pos},time]*/
var frameQueue = [];
var handInFrame = false;
var gameStarted = true;
var introState = 0;
var firstTimestamp;
var cursorPosition = {x:0,y:0};

var horizonLine = 380;
var groundHeight = 350;

$(document).ready(function(){
  $(".horizon-line").css("top",horizonLine+"px");
  horizonLine = $("body").height()-groundHeight;
  console.log("Horizon line now:"+horizonLine);
  $( window ).resize(function() {
    horizonLine = $("body").height()-groundHeight;
    console.log("Horizon line now:"+horizonLine);
  });
});


//Selected Element is object of highlighted element
var selectedElement = null;

var currentColor = null;
var assets = {
  tree: {width:124,height:281,src:"tree.png"},
  mountain: {width:600,height:287/969*600,src:"mountain.png"},
  cloud: {width:562,height:191,src:"cloud.png"}
};


var moveImg = new Image();
moveImg.className = "moveArrows";
moveImg.src = "move-icon.png";
//Color name is string of target color you want to change to "yellow", etc.
var changeBrushColor = function(colorName){
  currentColor = colorName;
  
  $(".palette-color").removeClass("hover");
  $(".palette-color."+currentColor).addClass("hover");

  console.log("New items will be painted "+currentColor);
  $(".color-change").css("opacity",1);
  $(".color-change").html("New items will be painted "+currentColor);
  $("#leapCursor").css("background-color",colorPalette[colorName]);


  setTimeout(function(){ $(".color-change").css("opacity",0); }, 2000);

}

//boolean function, tells if coordinates are within bounds of element
var coordinatesWithinElement = function(x,y,element){
  var withinBounds = false;
  var divRect = $(element).offset();
  if(x>= divRect.left && x <= divRect.left+$(element).width() &&
                      y >= divRect.top && y <= divRect.top+$(element).height() ){
      withinBounds = true;
  }
  return withinBounds;
};

//returns list of elements that are within coordinates, with  jquery Filter
var getElementsWithinCoordinates = function(x,y,elementFilter){
  var possibleElements = $(elementFilter);
  var elementsWithinBounds = [];
  possibleElements.map(function(elementIndex){
    var element = possibleElements[elementIndex];
    var divRect = $(element).offset();
    if(x>= divRect.left && x <= divRect.left+$(element).width() &&
                        y >= divRect.top && y <= divRect.top+$(element).height() ){
        elementsWithinBounds.push(element);
    }
  });
  return elementsWithinBounds;
};

//Move all elements in list according to cursor position (x,y)
var moveElements = function(elementsList,x,y){
 elementsList.map(function(elementIndex){
  var element = elementsList[elementIndex];
  var containingDiv = $(element).parent();
  console.log(element);
  console.log($(element).parent());
  if ($(element).hasClass("tree")){
    containingDiv.addClass("treeWrapper");
    var horizonDist = y-horizonLine;
    var scale;
    console.log("TREE FOLLOW CURSOR");
    console.log(horizonDist);
    if (horizonDist > 0){
      scale = .01*horizonDist;
      $(containingDiv).css("left",x-assets.tree.width/2*scale+"px");
      element.style.height = assets.tree.height*scale+"px";
      $(containingDiv).css("top", y-assets.tree.height*scale+"px");
      
    }

  } else if ($(element).hasClass("mountain")){
      containingDiv.addClass("mountainWrapper");
     $(containingDiv).css("left",x-assets.mountain.width/2+"px");
     console.log("MOUNTAIN FOLLOW CURSOR");

  } else if ($(element).hasClass("cloud")){
      containingDiv.addClass("cloudWrapper");
      var horizonDist = horizonLine-y;
      var scale;
      if (horizonDist > 0){
        scale = .01*horizonDist;
        $(containingDiv).css("left",x-assets.cloud.width/4*scale+"px");
        element.style.height = assets.cloud.height/2*scale+"px";
        $(containingDiv).css("top",y-assets.cloud.height/4*scale+"px");

      }
      console.log("CLOUD FOLLOW CURSOR");
    }
 });
}

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
            y: extendedFingers[0].screenPosition()[1] + 500
          };

          $("#leapCursor").css({
           left: (position.x - $("#leapCursor").width()/2)+ 'px',
           top: (position.y - $("#leapCursor").height()/2) + 'px'
          });
          cursorPosition = {
           left: position.x ,
           top: position.y
          };

          var movableElements = $(".movable");
          if (movableElements.length){
            moveElements(movableElements,cursorPosition.left,cursorPosition.top);
            console.log("MOVING THE ITEM!");
          }
          
          // if (coordinatesWithinElement(position.x,position.y,$(".bob")[0])){
          //   $(".help-hover").show();
          // } else{
          //    $(".help-hover").hide();
          // }

          if (coordinatesWithinElement(position.x,position.y,$(".palette")[0])){
            $(".palette").addClass("hover");
          } else{
             $(".palette").removeClass("hover");
          }
          var paletteList = getElementsWithinCoordinates(position.x,position.y,".palette-color");
          if (paletteList.length){
            var hoverColor = paletteList[0];
            $(".palette-color").removeClass("hover");
            $(hoverColor).addClass("hover");

            var currentClass = $(hoverColor).attr("class");
            var classes = currentClass.split(" ");
            if (classes.length == 3){
              var color = classes[1];
              changeBrushColor(color);
            }

          } else{
            // $(".palette-color").removeClass("show");
          }

    }
      //User begins pointing, change text
      if (introState == 0 && gameStarted){
        introState = 1;
        $(".bobText").html("Great! Now that you're exploring the range of your canvas, try painting a mountain by pointing at the horizon and saying:<br><span class='command'>PAINT A MOUNTAIN THERE. </span>");
      }

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
var vocab = ["mystic","mistake","mistakes","erase","remove","delete","exit","close","help","put","select","Peachtree","petri","air","this","fair","move","make","paint","mountain","intermountain","tree","there","here","poetry","but",'that','bear','cloud','iCloud','McCloud','crowd','cloudy','clown','start',"red","orange","yellow","green","blue","purple","violet","brown","white","black"];
var soundsLikeThere = ["there","here","bear","trailer","fair","hair","air"];
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






//Function for making new tree, takes in position object
var makeNewTree = function(position){
    var containingDiv = document.createElement('div');
    containingDiv.className = "elementWrapper treeWrapper";
    var treeImg = new Image();

    if (currentColor != null){
      treeImg.className = "tree element "+ currentColor;
    } else{
      treeImg.className = "tree element "+ "green";
    }
    treeImg.src = assets.tree.src;
    var horizonDist = position.y-horizonLine;
    var scale;
    if (horizonDist > 0){
      scale = .01*horizonDist;
      containingDiv.style.left = position.x-assets.tree.width/2*scale+"px";
      treeImg.style.height = assets.tree.height*scale+"px";
      containingDiv.style.top = position.y-assets.tree.height*scale+"px";
      $(containingDiv).append(treeImg);
      $(".wrapper").append(containingDiv);
      console.log("PUT A TREE THERE");
      randomBrushAudio();
      if(introState ==2){
            introState++;
            //$(".bottomWrapper").hide();
            $(".bobText").html("Looks like you're getting the hang of it! To get help and learn more about what you can paint say <span class='command'>HELP</span>.");
            setTimeout(function(){ 
              $(".bobText").html("");
              $(".bottomWrapper").addClass("hidden nonIntro");
              $(".palette").fadeIn(2000);
             }, 4000);
      }

    } else {
      //Alert User that they should put the tree on the ground
      $(".bobText").html("Why don't you try putting the tree on the ground?");
      $(".bottomWrapper").removeClass("hidden");
      setTimeout(function(){ 
        if (introState > 2){
          $(".bottomWrapper").addClass("hidden");
          $(".bobText").html("");
        }
      },2000);
    }



};

//Function for making new mountain, takes in position object
var makeNewMountain = function(position){
    var containingDiv = document.createElement('div');
    containingDiv.className = "elementWrapper mountainWrapper";
    var mountainImg = new Image();
    
    if (currentColor != null){
      mountainImg.className = "mountain element "+ currentColor;
    } else {
      mountainImg.className = "mountain element" + " blue";
    }
    mountainImg.src = assets.mountain.src;
    containingDiv.style.left = position.x-assets.mountain.width/2+"px";
    containingDiv.style.top = horizonLine-assets.mountain.height+40;
    $(containingDiv).append(mountainImg);
    $(".wrapper").append(containingDiv);
    playAudio("mountainAudio");
    randomBrushAudio();

};

//Function for making new cloud, takes in position object
var makeNewCloud = function(position){
    var containingDiv = document.createElement('div');
    containingDiv.className = "elementWrapper cloudWrapper";
    var cloudImg = new Image();
    cloudImg.className = "cloud element";
    if (currentColor != null){
      cloudImg.className = "cloud element "+ currentColor;
    } else {
      cloudImg.className = "cloud element "+ "white"
    }
    cloudImg.src = assets.cloud.src;

    var horizonDist = horizonLine-position.y;
    var scale;
    if (horizonDist > 0){
      scale = .01*horizonDist;
      containingDiv.style.left = position.x-assets.cloud.width/4*scale+"px";
      cloudImg.style.height = assets.cloud.height/2*scale+"px";
      containingDiv.style.top = position.y-assets.cloud.height/4*scale+"px";
      $(containingDiv).append(cloudImg);
      $(".wrapper").append(containingDiv);


            if(introState ==2){
            introState++;
            //$(".bottomWrapper").hide();
            $(".bobText").html("Looks like you're getting the hang of it! To get help and learn more about what you can paint, just say <span class='command'>HELP</span>.");
            setTimeout(function(){ 
              $(".bobText").html("");
              $(".bottomWrapper").addClass("hidden nonIntro");
              $(".palette").fadeIn(2000);
             }, 4000);
          }
          randomBrushAudio();
    } else {
      $(".bobText").html("Why don't you try painting the cloud in the sky?");
      $(".bottomWrapper").removeClass("hidden");
      setTimeout(function(){ 
        if (introState > 2){
          $(".bottomWrapper").addClass("hidden");
          $(".bobText").html("");
        }
      },2000);
    }


};


var playAudio = function(audioID){
  console.log("PLAY AUDIO FUNCTION");
  recognizer.stop();
  document.getElementById(audioID).play();
  $("#"+audioID).bind("ended", function(){
    recognizer.start();       
});

};

var randomBrushAudio = function(){
   //recognizer.stop();
  var num = Math.floor(Math.random() * 3) + 1 ;
  playAudio("brushAudio"+num);
  // $("#brushAudio"+num).bind("ended", function(){
  //    recognizer.start();       
  // });
};

// var playMountainAudio = function(){

// }

// var mountainAudio = function(){

// }


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


          
          //Mistake audio
          if (containsWords(speechList,["mistake","mistakes","mystic"])){
            //Mistake audio
            // document.getElementById("mistakeAudio").play();
            console.log("MISTAKE!!!!");
            
            //TRIGGER RANDOM ITEM GENERATION
            var thisPosition = getPositionFromTime(frameQueue,time);
            var num = Math.floor(Math.random()*2) + 1 ;
            console.log("MISTAKE NUM"+num);
            var displace = Math.floor(Math.random()*200)+70;
            if (num == 1){
              makeNewTree({x:thisPosition.x,y:horizonLine+displace});
            } else if (num == 2){
              makeNewCloud({x:thisPosition.x,y:horizonLine-displace});
            }
            playAudio("mistakeAudio");

          }
          //Toggle help popup
          if (containsWord(speechList,"help")){
            $(".help-popup").show();
            console.log("HELP POPUP SHOW");
          }
          if (containsWords(speechList,["exit","close"])){
            $(".help-popup").hide();
            console.log("HELP POPUP EXIT");
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
          //This is time associated with the word "there", and its similar words. Null if there is not said.
          var thereTime;
          soundsLikeThere.map(function(index){
            if (speechList[soundsLikeThere[index]]!=null){
              thereTime = speechList[word];
            }
          });
          // var therePosition1 = getPositionFromTime(frameQueue,thereTime+500);
          // $(".thereDot").css("top",therePosition1.y);
          // $(".thereDot").css("left",therePosition1.x);

          //Create new tree object
           if (containsWords(speechList,["tree","petri","peachtree"]) && (containsWords(speechList,soundsLikeThere)) || containsWord(speechList,"poetry")){
              var therePosition = getPositionFromTime(frameQueue,thereTime);
              makeNewTree(therePosition);
           }

           //Create new mountain
           if (containsWords(speechList,["mountain","intermountain"]) && (containsWords(speechList,soundsLikeThere))){

              var therePosition = getPositionFromTime(frameQueue,thereTime);
              makeNewMountain(therePosition);
              //After user intiaially has put a mountain, change state
              if (introState == 1){
                introState++;
                $(".bobText").html("Fantastic. You can also paint other items, too. Try painting a <span class='command'>TREE</span> on the ground or a <span class='command'>CLOUD</span> in the sky the same way you did with the mountain.");
              }
           }
          //Create new cloud
           if (containsWord(speechList,"cloud") && (containsWords(speechList,soundsLikeThere))){
              var therePosition = getPositionFromTime(frameQueue,thereTime);
              makeNewCloud(therePosition);
           }
        // } //End of if say put, but, make

        //PUT THAT THERE CODE: Moves existing object to a new location
        if (containsWords(speechList,soundsLikeThere)){
              console.log("entering PUT THAT THERE CODE");
              if (selectedElement != null){
                //Element is a tree
                if($(selectedElement).hasClass("tree")){
                    var therePosition = getPositionFromTime(frameQueue,thereTime);
                    makeNewTree(therePosition);
                }
                if ($(selectedElement).hasClass("mountain")){
                  var therePosition = getPositionFromTime(frameQueue,thereTime);
                  makeNewMountain(therePosition);
                }

                //Create new cloud
                if ($(selectedElement).hasClass("cloud")){
                  //Find the time of the "there word"
                  var therePosition = getPositionFromTime(frameQueue,thereTime);
                  makeNewCloud(therePosition);
                }
                $(selectedElement).hide();
                selectedElement = null;
                $(".moveArrows").remove();
                $(".element").removeClass("movable");
                $(".bottomWrapper").addClass("hidden");
                $(".bobText").html("");
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
              if( word == "that" || word == "this" || word =="select"){
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
                if (selectedElement != null){
                    var selectedParent = $(selectedElement).parent();
                    $(selectedParent).append(moveImg);
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
                    $(".bobText").html("You just selected an item! Point to its new location and say <span class='command'>HERE</span> to place it elsewhere");
                    $(".bottomWrapper").removeClass('hidden');
                    //MAKE THIS SELECTED ELEMENTED MOVABLE
                    $(selectedElement).addClass("movable");
                }

              }
              //DELETE over selected element
              if (word =="delete"||word =="erase"||word=="remove"){
                  //Iterate through existing painting elements
                  var deletePosition = getPositionFromTime(frameQueue,time);
                  var elements = $(".element");
                  var elementToDelete;
                  $(elements).each(function(index){
                    var thisElement = elements[index];
                    var divRect = $(thisElement).offset();
                    if(deletePosition.x>= divRect.left && deletePosition.x <= divRect.left+$(thisElement).width() &&
                        deletePosition.y >= divRect.top && deletePosition.y <= divRect.top+$(thisElement).height() ){
                      elementToDelete = thisElement;
                    }
                  });
                  $(elementToDelete).fadeOut();
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
        }
      
      } else {
        interim_transcript += event.results[i][0].transcript;
        if(gameStarted==true){
          $(".speechBar").html("<b>What we think you said:<br></b>"+interim_transcript);
        }
      }
    }
};